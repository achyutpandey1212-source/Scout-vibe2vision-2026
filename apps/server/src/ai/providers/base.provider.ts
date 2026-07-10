import { AIProvider, AIProviderName, AIRequestOptions, AIGatewayResponse } from '../types/ai.types';
import { AITimeoutError } from '../utils/errors';

export abstract class BaseProvider implements AIProvider {
  abstract name: AIProviderName;

  abstract generate(
    options: AIRequestOptions,
    apiKey: string,
    model: string,
  ): Promise<AIGatewayResponse>;

  /**
   * Helper to perform a fetch request with a strict timeout limit.
   */
  protected async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number = 30000,
  ): Promise<Response> {
    const controller = new AbortController();
    const signal = controller.signal;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal,
      });
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new AITimeoutError(`Network request to ${url} exceeded timeout limit`, timeoutMs);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
