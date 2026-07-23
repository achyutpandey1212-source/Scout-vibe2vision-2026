import { IProfile } from '../../../profile/models/profile.model';
import { CandidateSnapshotBuilder } from '../../../recommendation/engine/candidate-snapshot';
import { RecommendationContextBuilder } from '../../../intelligence/recommendation/context/recommendation-context-builder';
import { PromptManager } from './prompt-manager';
import { RecommendationAI } from './recommendation.ai';
import { ResponseValidator } from './response-validator';
import { RepairService } from './repair.service';
import { FallbackPersonalization } from './fallback-personalization';
import { IAIPersonalizationResponse, IAIPersonalizationMetadata } from './ai.types';
import { PROMPT_VERSION, SCHEMA_VERSION, ENGINE_VERSION } from './ai.constants';

export class PersonalizationService {
  /**
   * Orchestrates the AI Personalization request.
   * Prompts, calls Gemini, validates, repairs, and falls back if needed.
   */
  static async personalize(
    profile: IProfile,
    resume: any,
    top5: any[],
    existingSnapshot?: any,
  ): Promise<{ response: IAIPersonalizationResponse; metadata: IAIPersonalizationMetadata }> {
    const startTime = Date.now();
    const snapshot = existingSnapshot || new CandidateSnapshotBuilder().build(profile, resume);
    const builder = new RecommendationContextBuilder();
    const recContext = builder.build(profile, resume, top5, snapshot);

    const prompt = PromptManager.buildPrompt(recContext);
    const promptHash = PromptManager.hashPrompt(prompt);
    const systemInstruction = PromptManager.getSystemInstructions();

    let provider = 'gemini';
    let model = 'gemini-3.5-flash';
    let fallbackUsed = false;
    let repairUsed = false;
    let responseText = '';
    let parsedResponse: IAIPersonalizationResponse | null = null;

    try {
      // 1. Initial attempt
      const gatewayRes = await RecommendationAI.personalizeRecommendations(
        prompt,
        systemInstruction,
      );
      responseText = gatewayRes.text;
      provider = gatewayRes.metadata.provider;
      model = gatewayRes.metadata.model;

      try {
        // ──── DIAGNOSTIC: RAW LLM RESPONSE ─────────────────────────────────
        console.log(`
════════════════════════════════════════
[CAREER REPORT DIAGNOSTIC] STAGE 1 — RAW LLM RESPONSE
════════════════════════════════════════
Response Length:  ${responseText.length} chars
First 800 chars:
${responseText.slice(0, 800)}
════════════════════════════════════════`);
        // ────────────────────────────────────────────────────────────────────
        parsedResponse = ResponseValidator.validate(responseText);

        // ──── DIAGNOSTIC: VALIDATED RESPONSE FIELD CENSUS ───────────────────
        const slots = Object.keys(parsedResponse.recommendationsBySlot || {});
        const firstSlot = parsedResponse.recommendationsBySlot[slots[0]] as any;
        if (firstSlot) {
          const fieldStatus = (field: string) => {
            const val = firstSlot[field];
            if (val === undefined || val === null) return '❌ MISSING';
            if (Array.isArray(val))
              return val.length === 0
                ? '⚠ EMPTY ARRAY'
                : `✅ [${val.length} items] ${JSON.stringify(val[0]).slice(0, 60)}`;
            if (typeof val === 'object')
              return JSON.stringify(val).length < 5
                ? '⚠ EMPTY OBJECT'
                : `✅ ${JSON.stringify(val).slice(0, 80)}`;
            return val.length === 0 ? '⚠ EMPTY STRING' : `✅ "${String(val).slice(0, 80)}"`;
          };
          console.log(`
════════════════════════════════════════
[CAREER REPORT DIAGNOSTIC] STAGE 2 — AFTER VALIDATION (slot: "${slots[0]}")
════════════════════════════════════════
executiveSummary:      ${fieldStatus('executiveSummary')}
whyScoutPickedThis:    ${fieldStatus('whyScoutPickedThis')}
strongestStrengths:    ${fieldStatus('strongestStrengths')}
missingSkills:         ${fieldStatus('missingSkills')}
resumeImprovements:    ${fieldStatus('resumeImprovements')}
interviewPrep:         ${fieldStatus('interviewPrep')}
applicationConfidence: ${fieldStatus('applicationConfidence')}
nextAction:            ${fieldStatus('nextAction')}
scoutVerdict:          ${fieldStatus('scoutVerdict')}
personalizedReason:    ${fieldStatus('personalizedReason')}
projectEvidence:       ${fieldStatus('projectEvidence')}
strengths:             ${fieldStatus('strengths')}
challenges:            ${fieldStatus('challenges')}
applicationStrategy:   ${fieldStatus('applicationStrategy')}
preparationChecklist:  ${fieldStatus('preparationChecklist')}
════════════════════════════════════════`);
        }
        // ────────────────────────────────────────────────────────────────────
      } catch (validationErr: any) {
        console.warn(
          `[Recommendation] Initial validation failed: ${validationErr.message}. Attempting repair...`,
        );
        // 2. Repair attempt
        repairUsed = true;
        const repairResult = await RepairService.repair(
          prompt,
          responseText,
          validationErr.message,
          systemInstruction,
        );
        parsedResponse = repairResult.response;
        responseText = repairResult.rawText;
      }
    } catch (err: any) {
      console.error('[Recommendation] AI Personalization pipeline failed:', err.message);
      fallbackUsed = true;
    }

    // 3. Fallback mode
    if (!parsedResponse) {
      fallbackUsed = true;
      parsedResponse = FallbackPersonalization.generate(top5, profile, resume, snapshot);
      responseText = JSON.stringify(parsedResponse);
    }

    const latencyMs = Date.now() - startTime;

    // Print Recommendation Personalization Report
    const recValues = Object.values(parsedResponse.recommendationsBySlot || {});
    const avgLen =
      recValues.length > 0
        ? Math.round(
            recValues.reduce((acc, r) => acc + (r.personalizedReason || '').length, 0) /
              recValues.length,
          )
        : 0;

    console.log(`
========================================
Recommendation Personalization Report
========================================

Candidate Summary Size:      ${recContext.humanReadableSummary?.length || 0} chars
Projects Referenced:         ${recContext.candidateBrief.projectHighlights.length}
Experience Referenced:       ${recContext.candidateBrief.experienceSummary.internshipCount + recContext.candidateBrief.experienceSummary.leadershipCount}
Strongest Technologies:      ${recContext.candidateBrief.technicalProfile.strongestTechnologies.slice(0, 5).join(', ')}

Prompt Length:               ${prompt.length} chars
Response Length:             ${responseText.length} chars
Average Recommendation Len:  ${avgLen} chars
Fallback Engine Used:        ${fallbackUsed}

========================================`);

    const metadata: IAIPersonalizationMetadata = {
      provider,
      model,
      latencyMs,
      promptVersion: PROMPT_VERSION,
      schemaVersion: SCHEMA_VERSION,
      engineVersion: ENGINE_VERSION,
      fallbackUsed,
      repairUsed,
      promptLength: prompt.length,
      responseLength: responseText.length,
      promptHash,
    };

    return {
      response: parsedResponse,
      metadata,
    };
  }
}
