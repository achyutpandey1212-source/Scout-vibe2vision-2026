import { AIGateway } from '../../../ai/gateway/ai.gateway';
import { AIGatewayResponse } from '../../../ai/types/ai.types';
import { AI_TIMEOUT_MS } from './ai.constants';

export class RecommendationAI {
  /**
   * Calls AIGateway to generate text using the recommendation context.
   */
  static async personalizeRecommendations(
    prompt: string,
    systemInstruction: string,
  ): Promise<AIGatewayResponse> {
    return AIGateway.getInstance().generate({
      prompt,
      context: 'recommendation',
      systemInstruction,
      temperature: 0.1, // low temperature to ensure strict JSON schemas compliance
      timeoutMs: AI_TIMEOUT_MS,
    });
  }
}
