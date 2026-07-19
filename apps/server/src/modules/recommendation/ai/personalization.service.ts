import { IProfile } from '../../../profile/models/profile.model';
import { IRankedCandidate } from '../types/scoring.types';
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
    top5: IRankedCandidate[],
  ): Promise<{ response: IAIPersonalizationResponse; metadata: IAIPersonalizationMetadata }> {
    const startTime = Date.now();
    const prompt = PromptManager.buildPrompt(profile, resume, top5);
    const promptHash = PromptManager.hashPrompt(prompt);
    const systemInstruction = PromptManager.getSystemInstructions();

    let provider = 'gemini';
    let model = 'gemini-3.5-flash'; // Default from config
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
      parsedResponse = FallbackPersonalization.generate(top5);
      responseText = JSON.stringify(parsedResponse);
    }

    const latencyMs = Date.now() - startTime;

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
