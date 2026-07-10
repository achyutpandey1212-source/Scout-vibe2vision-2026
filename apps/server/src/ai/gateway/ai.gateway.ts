import { env } from '../../config/env';
import { GeminiProvider } from '../providers/gemini.provider';
import { GroqProvider } from '../providers/groq.provider';
import {
  AIProvider,
  AIProviderName,
  AIRequestOptions,
  AIGatewayResponse,
  AIWorkflowContext,
} from '../types/ai.types';
import { retryWithBackoff } from '../utils/retry';
import { ScoutAIError, AIApiError } from '../utils/errors';

export class AIGateway {
  private static instance: AIGateway;
  private readonly providers: Record<AIProviderName, AIProvider>;

  private constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      groq: new GroqProvider(),
    };
  }

  static getInstance(): AIGateway {
    if (!AIGateway.instance) {
      AIGateway.instance = new AIGateway();
    }
    return AIGateway.instance;
  }

  /**
   * Helper to resolve the correct provider name, model and API key configuration
   * based on the context (discovery or personalization) and whether we are using primary or fallback config.
   */
  private resolveConfig(
    context: AIWorkflowContext,
    useFallback = false,
  ): { provider: AIProviderName; model: string; apiKey: string } | null {
    if (context === 'discovery') {
      if (!useFallback) {
        return {
          provider: env.DISCOVERY_PROVIDER as AIProviderName,
          model: env.DISCOVERY_MODEL,
          apiKey: env.DISCOVERY_API_KEY,
        };
      } else {
        if (
          !env.DISCOVERY_FALLBACK_PROVIDER ||
          !env.DISCOVERY_FALLBACK_API_KEY ||
          !env.DISCOVERY_FALLBACK_MODEL
        ) {
          return null;
        }
        return {
          provider: env.DISCOVERY_FALLBACK_PROVIDER as AIProviderName,
          model: env.DISCOVERY_FALLBACK_MODEL,
          apiKey: env.DISCOVERY_FALLBACK_API_KEY,
        };
      }
    } else {
      if (!useFallback) {
        return {
          provider: env.PERSONALIZATION_PROVIDER as AIProviderName,
          model: env.PERSONALIZATION_MODEL,
          apiKey: env.PERSONALIZATION_API_KEY,
        };
      } else {
        if (
          !env.PERSONALIZATION_FALLBACK_PROVIDER ||
          !env.PERSONALIZATION_FALLBACK_API_KEY ||
          !env.PERSONALIZATION_FALLBACK_MODEL
        ) {
          return null;
        }
        return {
          provider: env.PERSONALIZATION_FALLBACK_PROVIDER as AIProviderName,
          model: env.PERSONALIZATION_FALLBACK_MODEL,
          apiKey: env.PERSONALIZATION_FALLBACK_API_KEY,
        };
      }
    }
  }

  /**
   * Orchestrates the raw text generation request, applying retries on the primary provider,
   * and falling back to the secondary provider if the primary provider completely fails.
   */
  async generate(options: AIRequestOptions): Promise<AIGatewayResponse> {
    const context = options.context;

    // Resolve primary configuration
    const primaryConfig = this.resolveConfig(context, false);
    if (!primaryConfig) {
      throw new ScoutAIError(`Missing primary configuration for context: ${context}`);
    }

    const primaryProvider = this.providers[primaryConfig.provider];
    if (!primaryProvider) {
      throw new ScoutAIError(`Primary provider "${primaryConfig.provider}" is not supported`);
    }

    let retriesCount = 0;
    let finalResponse: AIGatewayResponse;

    try {
      // 1. Try Primary Provider (typically Gemini) with retries
      finalResponse = await retryWithBackoff(
        async (attempt) => {
          retriesCount = attempt;
          return await primaryProvider.generate(options, primaryConfig.apiKey, primaryConfig.model);
        },
        {
          retries: 2, // Try up to 3 times (1 initial + 2 retries)
          minTimeoutMs: 1000,
          shouldRetry: (error) => {
            // Retry on network errors or rate limit errors
            return error instanceof AIApiError || error.name === 'AITimeoutError';
          },
        },
        (error, attempt, delayMs) => {
          console.warn(
            `[AI Layer] Primary provider ${primaryConfig.provider} failed (attempt ${attempt}). Retrying in ${delayMs.toFixed(0)}ms... Error: ${error.message}`,
          );
        },
      );
    } catch (primaryError: any) {
      console.error(
        `[AI Layer] Primary provider ${primaryConfig.provider} failed completely after ${retriesCount} retries: ${primaryError.message}`,
      );

      // 2. Resolve fallback configuration (typically Groq)
      const fallbackConfig = this.resolveConfig(context, true);
      if (!fallbackConfig) {
        console.warn(
          `[AI Layer] No fallback config available for context ${context}. Re-throwing primary error.`,
        );
        throw primaryError;
      }

      console.warn(
        `[AI Layer] Switching transparently to fallback provider: ${fallbackConfig.provider} (${fallbackConfig.model})`,
      );

      const fallbackProvider = this.providers[fallbackConfig.provider];
      if (!fallbackProvider) {
        throw new ScoutAIError(`Fallback provider "${fallbackConfig.provider}" is not supported`);
      }

      const startTime = Date.now();
      try {
        finalResponse = await fallbackProvider.generate(
          options,
          fallbackConfig.apiKey,
          fallbackConfig.model,
        );
        finalResponse.metadata.retries = retriesCount;
      } catch (fallbackError: any) {
        console.error(
          `[AI Layer] Fallback provider ${fallbackConfig.provider} also failed: ${fallbackError.message}`,
        );
        throw new ScoutAIError(
          `Both primary and fallback AI providers failed. Primary: ${primaryError.message}. Fallback: ${fallbackError.message}`,
        );
      }
    }

    // Update metadata with actual retries count
    finalResponse.metadata.retries = retriesCount;

    // Log call metrics beautifully
    this.logMetrics(context, finalResponse);

    return finalResponse;
  }

  /**
   * Outputs clean structured console prints for telemetry and debugging.
   */
  private logMetrics(context: AIWorkflowContext, response: AIGatewayResponse): void {
    const ctxLabel = context.charAt(0).toUpperCase() + context.slice(1);
    const providerLabel = response.metadata.provider.toUpperCase();
    const latencySec = (response.metadata.latencyMs / 1000).toFixed(1);

    const inputTokens =
      response.usage?.promptTokens !== undefined ? response.usage.promptTokens : 'N/A';
    const outputTokens =
      response.usage?.completionTokens !== undefined ? response.usage.completionTokens : 'N/A';

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[${ctxLabel}]
Provider: ${providerLabel}
Model: ${response.metadata.model}
Latency: ${latencySec}s
Retries: ${response.metadata.retries}
Tokens:
  Input: ${inputTokens}
  Output: ${outputTokens}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  }
}
