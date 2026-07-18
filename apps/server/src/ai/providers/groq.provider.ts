import { BaseProvider } from './base.provider';
import { AIProviderName, AIRequestOptions, AIGatewayResponse } from '../types/ai.types';
import { AIApiError, AIRateLimitError } from '../utils/errors';

export class GroqProvider extends BaseProvider {
  readonly name: AIProviderName = 'groq';

  async generate(
    options: AIRequestOptions,
    apiKey: string,
    model: string,
  ): Promise<AIGatewayResponse> {
    const startTime = Date.now();
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const messages: any[] = [];

    if (options.systemInstruction) {
      messages.push({
        role: 'system',
        content: options.systemInstruction,
      });
    }

    messages.push({
      role: 'user',
      content: options.prompt,
    });

    const body: any = {
      model,
      messages,
    };

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    }

    if (
      options.prompt.toLowerCase().includes('json') ||
      options.prompt.toLowerCase().includes('schema')
    ) {
      body.response_format = { type: 'json_object' };
    }
    const timeoutMs = options.timeoutMs ?? 30000;

    let response: Response;
    try {
      response = await this.fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
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
        error.message || 'Network error connecting to Groq',
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

    const choice = payload.choices?.[0];
    if (!choice) {
      throw new AIApiError(
        'Groq API returned response with no choices',
        this.name,
        response.status,
        payload,
      );
    }

    const text = choice.message?.content;
    if (text === undefined || text === null) {
      throw new AIApiError(
        'Groq API choice content was empty',
        this.name,
        response.status,
        payload,
      );
    }

    const usage = payload.usage
      ? {
          promptTokens: payload.usage.prompt_tokens,
          completionTokens: payload.usage.completion_tokens,
          totalTokens: payload.usage.total_tokens,
        }
      : undefined;

    return {
      text,
      usage,
      metadata: {
        provider: this.name,
        model,
        latencyMs,
        retries: 0,
      },
    };
  }
}
