import { BaseProvider } from './base.provider';
import { AIProviderName, AIRequestOptions, AIGatewayResponse } from '../types/ai.types';
import { AIApiError, AIRateLimitError } from '../utils/errors';

export class GeminiProvider extends BaseProvider {
  readonly name: AIProviderName = 'gemini';

  async generate(
    options: AIRequestOptions,
    apiKey: string,
    model: string,
  ): Promise<AIGatewayResponse> {
    const startTime = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body: any = {
      contents: [
        {
          parts: [{ text: options.prompt }],
        },
      ],
      generationConfig: {},
    };

    if (options.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    if (options.temperature !== undefined) {
      body.generationConfig.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      body.generationConfig.maxOutputTokens = options.maxTokens;
    }

    if (
      options.prompt.toLowerCase().includes('json') ||
      options.prompt.toLowerCase().includes('schema')
    ) {
      body.generationConfig.responseMimeType = 'application/json';
    }
    // Default timeout limit is 30s unless overridden
    const timeoutMs = options.timeoutMs ?? 30000;

    let response: Response;
    try {
      response = await this.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        timeoutMs,
      );
    } catch (error: any) {
      if (error instanceof Error && error.name === 'AITimeoutError') {
        throw error;
      }
      throw new AIApiError(
        error.message || 'Network error connecting to Gemini',
        this.name,
        undefined,
        error,
      );
    }

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const status = response.status;
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {
        errorText = 'Could not read error body';
      }

      if (status === 429) {
        throw new AIRateLimitError(this.name, status, errorText);
      }
      throw new AIApiError(errorText || `HTTP error ${status}`, this.name, status);
    }

    let payload: any;
    try {
      payload = await response.json();
    } catch (error: any) {
      throw new AIApiError(
        'Failed to parse response body as JSON',
        this.name,
        response.status,
        error,
      );
    }

    const candidate = payload.candidates?.[0];
    if (!candidate) {
      throw new AIApiError(
        'Gemini API returned response with no candidates',
        this.name,
        response.status,
        payload,
      );
    }

    const text = candidate.content?.parts?.[0]?.text;
    if (text === undefined || text === null) {
      throw new AIApiError(
        'Gemini API candidate content was empty',
        this.name,
        response.status,
        payload,
      );
    }

    const usage = payload.usageMetadata
      ? {
          promptTokens: payload.usageMetadata.promptTokenCount,
          completionTokens: payload.usageMetadata.candidatesTokenCount,
          totalTokens: payload.usageMetadata.totalTokenCount,
        }
      : undefined;

    return {
      text,
      usage,
      metadata: {
        provider: this.name,
        model,
        latencyMs,
        retries: 0, // Filled in by Gateway retry decorator
      },
    };
  }
}
