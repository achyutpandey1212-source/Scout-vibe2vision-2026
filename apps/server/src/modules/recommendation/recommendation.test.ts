import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecommendationTriggerService } from './triggers/recommendation-trigger.service';
import { ProfileHashGenerator } from './hash/profile-hash.generator';
import { IRecommendationPack } from './types/recommendation.types';
import { RECOMMENDATION_VERSION } from './constants';
import { HardFilterEngine } from './engine/hard-filter.engine';
import { ScoringEngine } from './engine/scoring.engine';
import { DiversificationEngine } from './engine/diversification.engine';
import { IOpportunity } from '../../discovery/extraction/models/opportunity.model';
import { IProfile } from '../../profile/models/profile.model';
import {
  ResponseValidator,
  FallbackPersonalization,
  PromptManager,
  RecommendationPackBuilder,
  BackgroundGenerationService,
  RecommendationStatusService,
  RecommendationSchedulerService,
  RecommendationDto,
  RecommendationConfig,
  ScoringExperimentsService,
  RecommendationAnalyticsService,
  RecommendationQualityService,
  RecommendationExplainabilityService,
  RecommendationMetricsService,
  RecommendationPackModel,
} from './index';
import mongoose from 'mongoose';

describe('Recommendation Module Unit Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId();

  const mockProfile = {
    userId: mockUserId,
    gender: 'FEMALE' as const,
    degree: 'B.Tech',
    branch: 'Computer Science',
    currentYear: 3,
    expectedGraduation: 2027,
    cgpa: 8.5,
    technicalSkills: ['React', 'Node.js'],
    softSkills: ['Communication'],
    tools: ['Git'],
    languages: ['English'],
    interestDomains: ['Software Engineering'],
    preferredRoles: ['Frontend Developer'],
    careerGoals: ['Land a startup internship'],
    opportunityPreferences: { internships: true },
    persona: 'COLLEGE_STUDENT' as const,
    careerReadinessScore: 75,
    availability: { hoursPerWeek: 20 },
    remotePreference: true,
  } as unknown as IProfile;

  const mockResume = {
    skills: ['React', 'TypeScript'],
    certifications: ['AWS Cloud Practitioner'],
    achievements: ['Hackathon Winner'],
    education: [{ degree: 'B.Tech', fieldOfStudy: 'Computer Science', cgpa: 8.5 }],
    experience: [{ role: 'Web Intern', description: 'Built frontend features' }],
    projects: [
      {
        title: 'Portfolio',
        description: 'Personal portfolio website',
        technologies: ['HTML', 'CSS'],
      },
    ],
  };

  const makeMockOp = (fields: Partial<IOpportunity>): IOpportunity => {
    return {
      _id: new mongoose.Types.ObjectId(),
      title: 'Mock Op',
      description: 'Mock Description',
      summary: 'Mock Summary',
      organization: 'Mock Org',
      opportunityType: 'INTERNSHIP',
      category: 'Design',
      applicationUrl: 'https://example.com/' + Math.random(),
      sourceURL: 'https://example.com/' + Math.random(),
      sourceDomain: 'example.com',
      sourceType: 'OTHER',
      confidence: 90,
      hash: 'mock-hash-' + Math.random(),
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      archived: false,
      eligibleBranches: [],
      eligibleYears: [],
      minimumEducation: '',
      womenFocused: false,
      visaSponsored: false,
      tags: [],
      skills: [],
      ...fields,
    } as unknown as IOpportunity;
  };

  describe('ProfileHashGenerator', () => {
    it('should generate a deterministic hash (same inputs = same hash)', () => {
      const hash1 = ProfileHashGenerator.generate(mockProfile, mockResume, RECOMMENDATION_VERSION);
      const hash2 = ProfileHashGenerator.generate(mockProfile, mockResume, RECOMMENDATION_VERSION);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('RecommendationTriggerService', () => {
    let currentHash: string;

    beforeEach(() => {
      currentHash = ProfileHashGenerator.generate(mockProfile, mockResume, RECOMMENDATION_VERSION);
    });

    it('should generate if no pack exists', () => {
      const result = RecommendationTriggerService.shouldGenerateRecommendation(null, currentHash);
      expect(result.shouldGenerate).toBe(true);
      expect(result.reason).toBe('LOGIN');
    });
  });

  describe('Scoring and Diversification Engine (Phase 3)', () => {
    it('should calculate reproducible and deterministic scores (same input = same score)', () => {
      const op = makeMockOp({ title: 'Frontend Developer React', tags: ['React', 'Design'] });
      const score1 = ScoringEngine.scoreOpportunity(op, mockProfile);
      const score2 = ScoringEngine.scoreOpportunity(op, mockProfile);
      expect(score1.finalScore).toBe(score2.finalScore);
      expect(score1.scoreBreakdown).toEqual(score2.scoreBreakdown);
    });

    it('should increase score for branch matches and interest overlaps', () => {
      const opLowMatch = makeMockOp({
        title: 'System Analyst',
        eligibleBranches: ['Mechanical Engineering'],
      });
      const opHighMatch = makeMockOp({
        title: 'Software Developer',
        eligibleBranches: ['Computer Science'],
        tags: ['React', 'Software Engineering'],
      });

      const resLow = ScoringEngine.scoreOpportunity(opLowMatch, mockProfile);
      const resHigh = ScoringEngine.scoreOpportunity(opHighMatch, mockProfile);

      expect(resHigh.finalScore).toBeGreaterThan(resLow.finalScore);
      expect(resHigh.scoreBreakdown.baseMatch).toBeGreaterThan(resLow.scoreBreakdown.baseMatch);
      expect(resHigh.scoreBreakdown.interest).toBeGreaterThan(resLow.scoreBreakdown.interest);
    });

    it('should apply women-centric bonus for female users', () => {
      const opGeneral = makeMockOp({ title: 'Standard Fellowship', womenFocused: false });
      const opWomen = makeMockOp({ title: 'Women in Tech Fellowship', womenFocused: true });

      const scoreGen = ScoringEngine.scoreOpportunity(opGeneral, mockProfile);
      const scoreWomen = ScoringEngine.scoreOpportunity(opWomen, mockProfile);

      expect(scoreWomen.scoreBreakdown.womenBonus).toBe(5);
      expect(scoreGen.scoreBreakdown.womenBonus).toBe(0);
    });

    it('should score portfolio builders and hidden gems higher', () => {
      const opStandard = makeMockOp({ hiddenGemScore: 0 });
      const opPremium = makeMockOp({
        hiddenGemScore: 90,
        careerValPortfolio: 5,
        careerValResume: 5,
        careerValLearning: 5,
      });

      const resStandard = ScoringEngine.scoreOpportunity(opStandard, mockProfile);
      const resPremium = ScoringEngine.scoreOpportunity(opPremium, mockProfile);

      expect(resPremium.scoreBreakdown.portfolio).toBeGreaterThan(
        resStandard.scoreBreakdown.portfolio,
      );
      expect(resPremium.scoreBreakdown.hiddenGem).toBe(5);
    });

    it('should respect remote work preference', () => {
      const opOnsite = makeMockOp({ remote: false });
      const opRemote = makeMockOp({ remote: true });

      const resOnsite = ScoringEngine.scoreOpportunity(opOnsite, mockProfile);
      const resRemote = ScoringEngine.scoreOpportunity(opRemote, mockProfile);

      expect(resRemote.scoreBreakdown.remote).toBe(5);
      expect(resOnsite.scoreBreakdown.remote).toBe(3);
    });

    it('should stably sort tie scores using trust, quality, then date', () => {
      const now = new Date();
      const op1 = makeMockOp({ trustScore: 60, qualityScore: 80, createdAt: now as any });
      const op2 = makeMockOp({ trustScore: 90, qualityScore: 80, createdAt: now as any });
      const op3 = makeMockOp({ trustScore: 90, qualityScore: 95, createdAt: now as any });

      // Trigger run to score and sort
      const ranked = ScoringEngine.run([op1, op2, op3], mockProfile);

      expect(ranked[0].opportunity._id.toString()).toBe(op3._id.toString()); // Highest quality (95) among highest trust (90)
      expect(ranked[1].opportunity._id.toString()).toBe(op2._id.toString()); // Next highest trust (90)
      expect(ranked[2].opportunity._id.toString()).toBe(op1._id.toString()); // Lowest trust (60)
    });

    it('should select diversified candidates from ranked pool without mutating original scores', () => {
      // Create candidates from same organization/category to test diversification
      const op1 = makeMockOp({ organization: 'Razorpay', category: 'INTERNSHIPS' as any });
      const op2 = makeMockOp({ organization: 'Razorpay', category: 'INTERNSIPS' as any }); // should be penalized during selection
      const op3 = makeMockOp({ organization: 'Google', category: 'FELLOWSHIPS' as any }); // different org & type, should be prioritized over op2
      const op4 = makeMockOp({ organization: 'Microsoft', category: 'JOBS' as any });

      const ranked = ScoringEngine.run([op1, op2, op3, op4], mockProfile);
      ranked[0].finalScore = 95;
      ranked[1].finalScore = 94;
      ranked[2].finalScore = 90;
      ranked[3].finalScore = 85;
      const originalScores = ranked.map((c) => c.finalScore);

      const diversified = DiversificationEngine.diversify(ranked, 3);

      // Verify the selection prioritized op3 over op2 due to same organization penalty
      expect(diversified[0].opportunity.organization).toBe('Razorpay');
      expect(diversified[1].opportunity.organization).toBe('Google'); // op3 is selected 2nd

      // Verify scores are not mutated
      diversified.forEach((cand) => {
        const match = ranked.find(
          (r) => r.opportunity._id.toString() === cand.opportunity._id.toString(),
        );
        expect(cand.finalScore).toBe(match?.finalScore);
      });
    });
  });

  describe('AI Personalization & Validation (Phase 4)', () => {
    it('should validate correctly formatted structured JSON response', () => {
      const validText = JSON.stringify({
        todayMission: 'Complete onboarding',
        aiSummary: 'Here are matching opportunities.',
        recommendationsBySlot: {
          perfectMatch: {
            personalizedReason: 'Matches CSE',
            missingSkills: ['Git'],
            firstAction: 'Read details',
            confidenceMessage: 'Achievable',
          },
        },
      });

      const parsed = ResponseValidator.validate(validText);
      expect(parsed.todayMission).toBe('Complete onboarding');
      expect(parsed.recommendationsBySlot.perfectMatch.personalizedReason).toBe('Matches CSE');
    });

    it('should reject response with missing fields or invalid format', () => {
      const invalidText = JSON.stringify({
        todayMission: 'Complete onboarding',
        // missing aiSummary and recommendationsBySlot
      });

      expect(() => ResponseValidator.validate(invalidText)).toThrow();
    });

    it('should fall back to smart deterministic properties successfully', () => {
      const mockOp = makeMockOp({
        title: 'Mock Internship',
        organization: 'Company',
        opportunityType: 'INTERNSHIP' as any,
        category: 'INTERNSHIPS' as any,
      });
      const mockRanked = [
        {
          opportunity: mockOp,
          finalScore: 90,
          rank: 1,
          scoreBreakdown: {} as any,
          recommendationExplanations: [
            { type: 'interest' as const, message: 'Matches React interests' },
          ],
          diversificationTags: {
            category: 'INTERNSHIPS',
            organization: 'Company',
            domain: 'React',
            workMode: 'REMOTE',
          },
        },
      ] as any;

      const fallback = FallbackPersonalization.generate(mockRanked);
      expect(fallback.todayMission).toBe("Review today's personalized recommendations.");
      expect(fallback.recommendationsBySlot.perfectMatch.personalizedReason).toContain(
        'Matches React interests',
      );
      expect(fallback.recommendationsBySlot.perfectMatch.firstAction).toBe(
        'Read the official application page.',
      );
    });

    it('should hash prompts deterministically using SHA-256', () => {
      const prompt = 'Test prompt';
      const hash1 = PromptManager.hashPrompt(prompt);
      const hash2 = PromptManager.hashPrompt(prompt);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('Recommendation Pack & Lifecycle (Phase 5)', () => {
    it('should map scored candidates and AI responses to Mongo fields via RecommendationPackBuilder', () => {
      const mockOp = makeMockOp({ title: 'Build Internship' });
      const mockRanked = [
        {
          opportunity: mockOp,
          finalScore: 92,
          rank: 1,
          scoreBreakdown: { interest: 10, baseMatch: 15 },
          recommendationExplanations: [],
          diversificationTags: {
            category: 'INTERNSHIPS',
            organization: 'Company',
            domain: 'React',
            workMode: 'REMOTE',
          },
        },
      ] as any;

      const mockAiRes = {
        todayMission: 'Build React projects',
        aiSummary: 'Good opportunities.',
        recommendationsBySlot: {
          perfectMatch: {
            personalizedReason: 'Matches CSE React interests',
            missingSkills: [],
            firstAction: 'Read application details',
            confidenceMessage: 'Achievable match',
          },
        },
      };

      const mockAiMeta = {
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        latencyMs: 1200,
        promptVersion: '1',
        schemaVersion: '1',
        engineVersion: '1',
        fallbackUsed: false,
        repairUsed: false,
        promptLength: 100,
        responseLength: 100,
        promptHash: 'some-hash',
      } as any;

      const fields = RecommendationPackBuilder.build(
        mockUserId.toString(),
        'some-profile-hash',
        'LOGIN',
        mockRanked,
        mockAiRes as any,
        mockAiMeta,
        'A',
        90,
      );

      expect(fields.todayMission).toBe('Build React projects');
      expect(fields.perfectMatch?.score).toBe(92);
      expect(fields.perfectMatch?.personalizedReason).toBe('Matches CSE React interests');
    });

    it('should serialize ready packs via RecommendationDto and exclude scoreBreakdown', () => {
      const mockPack = {
        _id: new mongoose.Types.ObjectId(),
        userId: mockUserId,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        todayMission: 'Mission test',
        aiSummary: 'Summary test',
        perfectMatch: {
          opportunityId: {
            _id: new mongoose.Types.ObjectId(),
            title: 'Perfect Job',
          } as any,
          score: 95,
          personalizedReason: 'Matches you perfectly',
          scoreBreakdown: { interest: 20 },
        },
      } as any;

      const dto = RecommendationDto.toDto(mockPack);
      expect(dto.todayMission).toBe('Mission test');
      expect(dto.perfectMatch.score).toBe(95);
      expect(dto.perfectMatch.scoreBreakdown).toBeUndefined(); // Stripped from output
    });

    it('should evaluate scheduler expiration correctly', () => {
      const freshPack = { expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12) } as any;
      const expiredPack = { expiresAt: new Date(Date.now() - 1000 * 60) } as any;

      expect(RecommendationSchedulerService.shouldRegenerate(freshPack)).toBe(false);
      expect(RecommendationSchedulerService.shouldRegenerate(expiredPack)).toBe(true);
      expect(RecommendationSchedulerService.shouldRegenerate(null)).toBe(true);
    });

    it('should lock active users during background generation', () => {
      const testUser = new mongoose.Types.ObjectId().toString();
      expect(BackgroundGenerationService.isGenerating(testUser)).toBe(false);

      // Trigger dummy async action that doesn't resolve instantly to hold lock
      BackgroundGenerationService.trigger(testUser, 'hash1', 'LOGIN');

      // Lock should now be active
      expect(BackgroundGenerationService.isGenerating(testUser)).toBe(true);
    });
  });

  describe('Recommendation Tuning & Intelligence (Phase 6)', () => {
    it('should dynamically query weights and feature flags from RecommendationConfig', () => {
      const flags = RecommendationConfig.getFlags();
      expect(flags.enableWomenBonus).toBe(true);

      const weightsA = RecommendationConfig.getWeights('A');
      const weightsB = RecommendationConfig.getWeights('B');
      expect(weightsA.interest).toBe(20);
      expect(weightsB.interest).toBe(25);
    });

    it('should assign users deterministically to experiment group A or B', () => {
      const user1 = new mongoose.Types.ObjectId().toString();
      const user2 = new mongoose.Types.ObjectId().toString();

      const group1 = ScoringExperimentsService.assignGroup(user1);
      const group2 = ScoringExperimentsService.assignGroup(user1);
      expect(group1).toBe(group2); // Deterministic

      const groupForUser2 = ScoringExperimentsService.assignGroup(user2);
      expect(['A', 'B']).toContain(groupForUser2);
    });

    it('should calculate pack quality score correctly', () => {
      const mockOp = makeMockOp({ hiddenGemScore: 80, careerValPortfolio: 5, careerValResume: 5 });
      const mockRanked = [
        {
          opportunity: mockOp,
          finalScore: 90,
          recommendationExplanations: [],
          diversificationTags: {
            category: 'INTERNSHIPS',
            organization: 'Company',
            domain: 'React',
            workMode: 'REMOTE',
          },
        },
      ] as any;

      const score = RecommendationQualityService.evaluatePack(mockRanked);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should format explainability logs cleanly', () => {
      const mockPack = {
        _id: new mongoose.Types.ObjectId(),
        userId: mockUserId,
        generatedAt: new Date(),
        todayMission: 'Test mission',
        aiSummary: 'Test summary',
        perfectMatch: {
          opportunityId: { _id: new mongoose.Types.ObjectId() } as any,
          score: 95,
          scoreBreakdown: { interest: 20 },
        },
      } as any;

      const explanation = RecommendationExplainabilityService.explainPack(mockPack);
      expect(explanation?.todayMission).toBe('Test mission');
      expect(explanation?.recommendations.perfectMatch.scoreBreakdown.interest).toBe(20);
    });

    it('should fetch system health and determine statuses correctly', async () => {
      const spy = vi.spyOn(RecommendationPackModel, 'find').mockReturnValue({
        sort: () => ({
          limit: () => ({
            exec: async () => [
              {
                status: 'READY',
                metadata: {
                  cacheHit: true,
                  fallbackUsed: false,
                  generationTimeMs: 1500,
                  qualityScore: 90,
                },
              },
            ],
          }),
        }),
      } as any);

      const health = await RecommendationMetricsService.getRecommendationHealth();
      expect(health.status).toBe('HEALTHY');
      expect(health.cacheHitRate).toBe(100);
      expect(health.averageLatency).toBe(1500);

      spy.mockRestore();
    });
  });
});
