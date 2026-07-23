import { RecommendationAI } from './recommendation.ai';
import { ResponseValidator } from './response-validator';
import { IAIPersonalizationResponse } from './ai.types';

export class RepairService {
  /**
   * Attempts to fix validation errors by requesting AI to correct the schema.
   * Keeps repair prompt lightweight without inflating token usage.
   */
  static async repair(
    originalPrompt: string,
    invalidText: string,
    validationError: string,
    systemInstruction: string,
  ): Promise<{ response: IAIPersonalizationResponse; rawText: string }> {
    const errorSnippet = (validationError || '').slice(0, 300);
    const textSnippet = (invalidText || '').slice(0, 400);

    const repairPrompt = `Validation Error in previous JSON generation:
${errorSnippet}

Response Snippet:
${textSnippet}...

Original Context & Prompt:
${originalPrompt}

Please correct the schema violations and return ONLY valid JSON matching the schema.`;

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
