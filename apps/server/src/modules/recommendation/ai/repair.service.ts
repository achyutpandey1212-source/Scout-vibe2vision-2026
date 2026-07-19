import { RecommendationAI } from './recommendation.ai';
import { ResponseValidator } from './response-validator';
import { IAIPersonalizationResponse } from './ai.types';

export class RepairService {
  /**
   * Attempts to fix validation errors by requesting Gemini to correct the schema.
   */
  static async repair(
    originalPrompt: string,
    invalidText: string,
    validationError: string,
    systemInstruction: string,
  ): Promise<{ response: IAIPersonalizationResponse; rawText: string }> {
    const repairPrompt = `Your previous response failed validation with the following error:
${validationError}

Original Prompt:
${originalPrompt}

Invalid JSON Response you returned:
${invalidText}

Please correct the schema violations and return ONLY valid JSON.
Do not change meanings.
Fix schema violations only.`;

    const gatewayRes = await RecommendationAI.personalizeRecommendations(
      repairPrompt,
      systemInstruction,
    );
    const parsed = ResponseValidator.validate(gatewayRes.text);

    return {
      response: parsed,
      rawText: gatewayRes.text,
    };
  }
}
