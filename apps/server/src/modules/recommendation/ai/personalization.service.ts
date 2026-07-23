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
    const sampleCand = top5[0] || { opportunity: {} };
    const sampleContext = builder.build(profile, resume, sampleCand, snapshot);

    const prompt = PromptManager.buildPrompt(profile, resume, top5, snapshot);
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
        parsedResponse = ResponseValidator.validate(responseText);
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

Candidate Summary Size:      ${sampleContext.humanReadableSummary.length} chars
Projects Referenced:         ${sampleContext.projects.length}
Experience Referenced:       ${sampleContext.experienceSummary.internships.length + sampleContext.experienceSummary.leadership.length}
Strongest Technologies:      ${sampleContext.technicalProfile.languages.concat(sampleContext.technicalProfile.frameworks).slice(0, 5).join(', ')}

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
