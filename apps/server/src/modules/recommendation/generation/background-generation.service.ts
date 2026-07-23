import { ProfileModel, ResumeModel } from '../../../profile';
import { CandidateRetrievalService } from '../service/candidate-retrieval.service';
import { RecommendationPackBuilder } from '../builder/recommendation-pack.builder';
import { RecommendationRepository } from '../repository/recommendation.repository';
import { RecommendationGenerationReason } from '../types/recommendation.types';
import { RecommendationConfig } from '../config/recommendation-config';
import { ScoringExperimentsService } from '../experiments/scoring-experiments.service';
import { RecommendationQualityService } from '../quality/recommendation-quality.service';
import { FallbackPersonalization } from '../ai/fallback-personalization';
import { PersonalizationService } from '../ai/personalization.service';
import { IAIPersonalizationMetadata, IAIPersonalizationResponse } from '../ai/ai.types';
import { ENGINE_VERSION } from '../ai/ai.constants';
import { OnboardingGuard } from '../guard/onboarding-guard';
import mongoose from 'mongoose';

export class BackgroundGenerationService {
  // Global memory locks to track active generation tasks and failed attempt cooldowns by userId
  private static activeLocks = new Set<string>();
  private static failedLocks = new Map<string, number>();

  static trigger(
    userId: string,
    profileHash?: string,
    reason: RecommendationGenerationReason = RecommendationGenerationReason.DAILY_SCHEDULE,
  ): Promise<{ packId: string; status: string }> {
    return this.triggerGeneration(userId, reason);
  }

  /**
   * Safe entry point to trigger background generation asynchronously.
   * Acquires a lock for the user, creates the GENERATING pack, and starts the worker thread.
   */
  static async triggerGeneration(
    userId: string,
    reason: RecommendationGenerationReason = RecommendationGenerationReason.DAILY_SCHEDULE,
  ): Promise<{ packId: string; status: string }> {
    // 0. Onboarding Gating Guard: Exit cleanly if onboarding is incomplete
    const isCompleted = await OnboardingGuard.isOnboardingCompleted(userId);
    if (!isCompleted) {
      console.log(
        `[Recommendation] Generation Skipped. Reason: Onboarding incomplete for user ${userId}`,
      );
      return { packId: 'skipped', status: 'ONBOARDING_REQUIRED' };
    }

    // 1. Prevent duplicate concurrent generations
    if (this.activeLocks.has(userId)) {
      const existing = await RecommendationRepository.findLatestByUser(userId);
      return {
        packId: existing?._id?.toString() || 'active',
        status: existing?.status || 'GENERATING',
      };
    }

    // 2. Cooldown check: prevent immediate repeated regeneration loops if failed recently (2-minute cooldown)
    const lastFailedAt = this.failedLocks.get(userId);
    if (lastFailedAt && Date.now() - lastFailedAt < 120000) {
      console.warn(
        `[Recommendation] Cooldown active for user ${userId}. Skipping repeated generation.`,
      );
      const existing = await RecommendationRepository.findLatestByUser(userId);
      return {
        packId: existing?._id?.toString() || 'cooldown',
        status: existing?.status || 'FAILED',
      };
    }

    // 3. Create placeholder GENERATING pack with SHA-256 profile fingerprint
    const { RecommendationService } = await import('../service/recommendation.service');
    const profileHash = await RecommendationService.generateProfileHash(userId);

    const pack = await RecommendationRepository.createPack({
      userId: new mongoose.Types.ObjectId(userId),
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      status: 'GENERATING',
      progressPhase: 'RETRIEVING',
      generationReason: reason,
      profileHash,
      recommendationVersion: ENGINE_VERSION,
    });

    const packId = pack._id.toString();

    // 4. Acquire lock and launch worker asynchronously
    this.activeLocks.add(userId);

    setImmediate(() => {
      this.runWorker(userId, packId, profileHash, reason).finally(() => {
        this.activeLocks.delete(userId);
      });
    });

    return { packId, status: 'GENERATING' };
  }

  /**
   * Worker thread processing the multi-stage recommendation pipeline.
   */
  private static async runWorker(
    userId: string,
    packId: string,
    profileHash: string,
    reason: RecommendationGenerationReason,
  ): Promise<void> {
    const startTime = Date.now();
    let initialCount = 0;
    let filteredCount = 0;
    let fallbackUsed = false;
    let repairUsed = false;
    let success = false;
    let aiLatency = 0;
    let promptHashVal = '';
    let currentStage = 'INIT';

    try {
      // 0. Verify onboarding completion before executing worker pipeline
      const isCompleted = await OnboardingGuard.isOnboardingCompleted(userId);
      if (!isCompleted) {
        console.log(
          `[Recommendation] Generation Skipped. Reason: Onboarding incomplete for user ${userId}`,
        );
        await RecommendationRepository.markFailed(packId);
        return;
      }

      // 1. Assign Experiment Group and load configurations
      currentStage = 'EXPERIMENT_CONFIG';
      const experimentGroup = ScoringExperimentsService.assignGroup(userId);
      const flags = RecommendationConfig.getFlags();
      const weights = RecommendationConfig.getWeights(experimentGroup);

      // 2. Retrieving Active Candidates
      currentStage = 'CANDIDATE_RETRIEVAL';
      await RecommendationRepository.updateProgressPhase(packId, 'RETRIEVING');
      const rawCandidates = await CandidateRetrievalService.fetchActiveCandidates();
      initialCount = rawCandidates.length;

      // Fetch user profile and resume
      currentStage = 'FETCH_USER_PROFILE';
      const profile = await ProfileModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      }).exec();
      if (!profile) {
        throw new Error('User profile not found. Complete onboarding first.');
      }
      const resume = await ResumeModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      }).exec();

      // Stage 1: Candidate Snapshot Builder (Built exactly ONCE)
      currentStage = 'CANDIDATE_SNAPSHOT';
      const { CandidateSnapshotBuilder } =
        await import('../../../recommendation/engine/candidate-snapshot');
      const snapshotBuilder = new CandidateSnapshotBuilder();
      const snapshot = snapshotBuilder.build(profile, resume);

      // Stage 2A: Hard & Soft Candidate Filtering
      currentStage = 'HARD_FILTERING';
      await RecommendationRepository.updateProgressPhase(packId, 'FILTERING');
      const { OpportunityFilter } =
        await import('../../../recommendation/engine/opportunity-filter');
      const oppFilter = new OpportunityFilter();
      const filterResult = oppFilter.filter(snapshot, rawCandidates);
      filteredCount = filterResult.eligible.length;

      // Stage 2B: Deterministic Opportunity Scoring
      currentStage = 'DETERMINISTIC_SCORING';
      await RecommendationRepository.updateProgressPhase(packId, 'SCORING');
      const { RecommendationScorer } =
        await import('../../../recommendation/engine/recommendation-score');
      const oppScorer = new RecommendationScorer();
      let scoredList = filterResult.eligible
        .map((opp) => oppScorer.score(snapshot, opp))
        .filter((res): res is NonNullable<typeof res> => res !== null)
        .sort((a, b) => b.totalScore - a.totalScore);

      // Prevent candidates from disappearing if minimum threshold (45) drops all items
      if (scoredList.length === 0 && filterResult.eligible.length > 0) {
        console.warn(
          `[Recommendation] Threshold dropped all candidates. Falling back to unthresholded eligible pool.`,
        );
        scoredList = filterResult.eligible.map((opp) => ({
          opportunity: opp,
          totalScore: 50,
          score: 50,
          scoreBreakdown: {
            skillMatch: 25,
            projectMatch: 25,
            preferenceMatch: 0,
            titleRelevance: 0,
            recencyScore: 0,
            softPenalties: 0,
          },
          matchedSkills: [],
          matchedProjects: [],
          reasons: ['Eligible candidate posting'],
          recommendationStrength: 'good' as const,
        }));
      }

      // Top 40 Deterministic Candidates passed to Portfolio Builder
      const top40Candidates = scoredList.slice(0, 40);

      // Print Recommendation Filtering Report
      const scores = scoredList.map((s) => s.totalScore || s.score || 50);
      const avgScore =
        scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
      const topCandidate = scoredList[0];

      console.log(`
======================================
Recommendation Filtering Report
======================================

Total Opportunities: ${initialCount}

Rejected:
Masters: ${filterResult.stats.rejectionReasons['REJECT_MASTER_PROGRAM'] || 0}
Research: ${(filterResult.stats.rejectionReasons['REJECT_RESEARCH_ONLY'] || 0) + (filterResult.stats.rejectionReasons['REJECT_PHD'] || 0)}
Senior: ${filterResult.stats.rejectionReasons['REJECT_SENIOR_ROLE'] || 0}
Expired: ${filterResult.stats.rejectionReasons['REJECT_EXPIRED'] || 0}
Location: 0
Non Engineering: ${filterResult.stats.rejectionReasons['REJECT_NON_ENGINEERING'] || 0}

Remaining Candidates: ${scoredList.length}

Average Match Score: ${avgScore}
Highest Match Score: ${highestScore}
Lowest Match Score:  ${lowestScore}

Top Candidate:
${topCandidate?.opportunity?.title || 'N/A'}
${topCandidate?.opportunity?.organization || topCandidate?.opportunity?.company || 'N/A'}

======================================
`);

      // 5. Portfolio Construction (Stage 4)
      currentStage = 'PORTFOLIO_CONSTRUCTION';
      await RecommendationRepository.updateProgressPhase(packId, 'DIVERSIFYING');
      const { RecommendationPortfolioBuilder } =
        await import('../../../recommendation/engine/recommendation-portfolio');
      const portfolioBuilder = new RecommendationPortfolioBuilder();
      const portfolio = portfolioBuilder.buildPortfolio(top40Candidates, snapshot);

      // Exactly 5 candidates passed downstream to LLM Personalization
      const top5Candidates = portfolio.selectedCandidates.map((sc) => ({
        opportunity: sc.opportunity || sc,
        score: sc.totalScore || sc.score || 75,
        scoreBreakdown: sc.scoreBreakdown || {},
        matchedSkills: sc.matchedSkills || [],
        matchedProjects: sc.matchedProjects || [],
        reasons: sc.reasons || [],
        recommendationStrength: sc.recommendationStrength || 'strong',
      }));

      // Print Recommendation Portfolio Report
      console.log(`
======================================
Recommendation Portfolio Report
======================================

Candidates Ranked: ${top40Candidates.length}

Perfect Match:
${portfolio.slots['perfectMatch']?.candidate?.opportunity?.title || 'N/A'}

Hidden Gem:
${portfolio.slots['hiddenGem']?.candidate?.opportunity?.title || 'N/A'}

Fast Apply:
${portfolio.slots['fastApply']?.candidate?.opportunity?.title || 'N/A'}

Resume Builder:
${portfolio.slots['resumeBuilder']?.candidate?.opportunity?.title || 'N/A'}

Stretch Goal:
${portfolio.slots['stretchGoal']?.candidate?.opportunity?.title || 'N/A'}

--------------------------------------

Unique Companies: ${portfolio.uniqueCompaniesCount}
Unique Families: ${portfolio.uniqueRoleFamiliesCount}
Unique Technologies Covered: ${portfolio.uniqueTechnologiesCount}
Portfolio Diversity Score: ${portfolio.portfolioDiversityScore}/100

======================================
`);

      // 6. LLM Personalization (Stage 3 - 5 Selected Slots)
      currentStage = 'LLM_PERSONALIZATION';
      await RecommendationRepository.updateProgressPhase(packId, 'PERSONALIZING');

      let aiResponse: IAIPersonalizationResponse;
      let aiMeta: IAIPersonalizationMetadata;

      if (flags.enableAIPersonalization) {
        const aiResult = await PersonalizationService.personalize(
          profile,
          resume,
          top5Candidates,
          snapshot,
        );
        aiResponse = aiResult.response;
        aiMeta = aiResult.metadata;
        fallbackUsed = aiMeta.fallbackUsed;
        repairUsed = aiMeta.repairUsed;
        aiLatency = aiMeta.latencyMs;
        promptHashVal = aiMeta.promptHash;
      } else {
        fallbackUsed = true;
        aiResponse = FallbackPersonalization.generate(top5Candidates, profile, resume, snapshot);
        aiMeta = {
          provider: 'local-fallback',
          model: 'fallback',
          latencyMs: 0,
          promptVersion: 'N/A',
          schemaVersion: 'N/A',
          engineVersion: 'N/A',
          fallbackUsed: true,
          repairUsed: false,
          promptLength: 0,
          responseLength: 0,
          promptHash: '',
        };
        promptHashVal = '';
      }

      // Ensure per-slot fallback completeness if AI personalization omitted any slot
      const requiredSlots = [
        'perfectMatch',
        'hiddenGem',
        'quickWin',
        'confidenceBuilder',
        'stretchGoal',
      ];
      requiredSlots.forEach((slotKey, idx) => {
        if (!aiResponse.recommendationsBySlot[slotKey]) {
          console.warn(
            `[Recommendation] Slot ${slotKey} missing in AI response. Generating slot fallback.`,
          );
          const cand = top5Candidates[idx] || top5Candidates[0];
          const fallbackGen = FallbackPersonalization.generate([cand], profile, resume, snapshot);
          aiResponse.recommendationsBySlot[slotKey] =
            fallbackGen.recommendationsBySlot['perfectMatch'] ||
            Object.values(fallbackGen.recommendationsBySlot)[0];
        }
      });

      // 7. Quality evaluation
      currentStage = 'QUALITY_EVALUATION';
      const qualityScore = RecommendationQualityService.evaluatePack(top5Candidates);

      // Print Comprehensive Recommendation Quality Report
      console.log(`
======================================
Recommendation Quality Report
======================================

Candidates Evaluated:         ${initialCount}
Candidates Filtered:          ${filteredCount}
Candidates Scored:            ${scoredList.length}
Candidates Ranked:            ${top40Candidates.length}

Average Recommendation Score: ${avgScore}
Highest Recommendation Score: ${highestScore}
Lowest Recommendation Score:  ${lowestScore}

Portfolio Diversity Score:    ${portfolio.portfolioDiversityScore}/100
Unique Role Families:         ${portfolio.uniqueRoleFamiliesCount}
Unique Companies:             ${portfolio.uniqueCompaniesCount}
Unique Technologies:          ${portfolio.uniqueTechnologiesCount}

Top Slot (Perfect Match):     ${portfolio.slots['perfectMatch']?.candidate?.opportunity?.title || 'N/A'}
Recommendation Strength:      ${portfolio.slots['perfectMatch']?.candidate?.recommendationStrength || 'strong'}

AI Provider:                  ${aiMeta?.provider || 'local-fallback'}
Latency:                      ${aiMeta?.latencyMs || 0}ms
Fallback Used:                ${fallbackUsed}
Repair Used:                  ${repairUsed}
Overall Quality Score:        ${qualityScore}

======================================
`);

      // 8. Building & Persisting Pack
      currentStage = 'SAVE_RECOMMENDATION_PACK';
      await RecommendationRepository.updateProgressPhase(packId, 'BUILDING_PACK');
      // ──── DIAGNOSTIC: STAGE 3 — AI RESPONSE BEFORE PACKBUILDER ──────────────
      const _diagSlot3 = aiResponse?.recommendationsBySlot?.['perfectMatch'] as any;
      if (_diagSlot3) {
        const _fieldSt3 = (f: string) => {
          const v = _diagSlot3[f];
          if (v === undefined || v === null) return '❌ MISSING';
          if (Array.isArray(v))
            return v.length === 0
              ? '⚠ EMPTY ARRAY'
              : `✅ [${v.length} items] "${String(v[0]).slice(0, 50)}"`;
          if (typeof v === 'object')
            return JSON.stringify(v).length < 5
              ? '⚠ EMPTY OBJECT'
              : `✅ ${JSON.stringify(v).slice(0, 80)}`;
          return String(v).length === 0 ? '⚠ EMPTY STRING' : `✅ "${String(v).slice(0, 80)}"`;
        };
        console.log(`
════════════════════════════════════════
[CAREER REPORT DIAGNOSTIC] STAGE 3 — AI RESPONSE BEFORE PACKBUILDER (slot: perfectMatch)
════════════════════════════════════════
executiveSummary:      ${_fieldSt3('executiveSummary')}
whyScoutPickedThis:    ${_fieldSt3('whyScoutPickedThis')}
strongestStrengths:    ${_fieldSt3('strongestStrengths')}
missingSkills:         ${_fieldSt3('missingSkills')}
resumeImprovements:    ${_fieldSt3('resumeImprovements')}
interviewPrep:         ${_fieldSt3('interviewPrep')}
applicationConfidence: ${_fieldSt3('applicationConfidence')}
nextAction:            ${_fieldSt3('nextAction')}
scoutVerdict:          ${_fieldSt3('scoutVerdict')}
applicationStrategy:   ${_fieldSt3('applicationStrategy')}
preparationChecklist:  ${_fieldSt3('preparationChecklist')}
strengths:             ${_fieldSt3('strengths')}
challenges:            ${_fieldSt3('challenges')}
════════════════════════════════════════`);
      }
      // ───────────────────────────────────────────────────────────────────────────
      const finalPackFields = RecommendationPackBuilder.build(
        userId,
        profileHash,
        reason,
        top5Candidates,
        aiResponse,
        aiMeta,
        experimentGroup,
        qualityScore,
      );

      // ──── DIAGNOSTIC: STAGE 4 — PACKBUILDER OUTPUT BEFORE MONGODB ───────────
      const _diagSlot4 = (finalPackFields as any)?.perfectMatch;
      if (_diagSlot4) {
        const _fieldSt4 = (f: string) => {
          const v = _diagSlot4[f];
          if (v === undefined || v === null) return '❌ MISSING';
          if (Array.isArray(v))
            return v.length === 0
              ? '⚠ EMPTY ARRAY'
              : `✅ [${v.length} items] "${String(v[0]).slice(0, 50)}"`;
          if (typeof v === 'object')
            return JSON.stringify(v).length < 5
              ? '⚠ EMPTY OBJECT'
              : `✅ ${JSON.stringify(v).slice(0, 80)}`;
          return String(v).length === 0 ? '⚠ EMPTY STRING' : `✅ "${String(v).slice(0, 80)}"`;
        };
        console.log(`
════════════════════════════════════════
[CAREER REPORT DIAGNOSTIC] STAGE 4 — PACKBUILDER OUTPUT (slot: perfectMatch) BEFORE MONGODB
════════════════════════════════════════
executiveSummary:      ${_fieldSt4('executiveSummary')}
whyScoutPickedThis:    ${_fieldSt4('whyScoutPickedThis')}
strongestStrengths:    ${_fieldSt4('strongestStrengths')}
missingSkills:         ${_fieldSt4('missingSkills')}
resumeImprovements:    ${_fieldSt4('resumeImprovements')}
interviewPrep:         ${_fieldSt4('interviewPrep')}
applicationConfidence: ${_fieldSt4('applicationConfidence')}
nextAction:            ${_fieldSt4('nextAction')}
scoutVerdict:          ${_fieldSt4('scoutVerdict')}
applicationStrategy:   ${_fieldSt4('applicationStrategy')}
preparationChecklist:  ${_fieldSt4('preparationChecklist')}
strengths:             ${_fieldSt4('strengths')}
challenges:            ${_fieldSt4('challenges')}
════════════════════════════════════════`);
      }
      // ───────────────────────────────────────────────────────────────────────────

      const durationMs = Date.now() - startTime;
      if (finalPackFields.metadata) {
        finalPackFields.metadata.generationTimeMs = durationMs;
        finalPackFields.metadata.candidateCount = initialCount;
        finalPackFields.metadata.filteredCount = filteredCount;
      }

      await RecommendationRepository.markReady(packId, finalPackFields);
      success = true;
      // Clear failed lock on success
      this.failedLocks.delete(userId);

      console.log(`
======================================
Recommendation Pipeline Completed
======================================
Candidates Found:   ${initialCount}
Hard Filtered:      ${filteredCount}
Scored:             ${scoredList.length}
Portfolio Selected: ${top5Candidates.length}
Personalized:       5
Saved Status:       SUCCESS (Pack ID: ${packId})
======================================
`);
    } catch (err: any) {
      console.error(`
======================================
FAILED DURING STAGE: ${currentStage}
Reason: ${err.message}
Stack: ${err.stack}
======================================
`);
      // Record failure timestamp for cooldown check
      this.failedLocks.set(userId, Date.now());
      await RecommendationRepository.markFailed(packId);
    } finally {
      // Clear active lock
      this.activeLocks.delete(userId);
    }
  }

  /**
   * Helper to check if a generation lock is currently active.
   */
  static isGenerating(userId: string): boolean {
    return this.activeLocks.has(userId);
  }
}
