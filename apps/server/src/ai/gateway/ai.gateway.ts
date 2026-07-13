import { env } from '../../config/env';
import { ProviderPoolFactory } from '../../lib/providers/provider-pool-factory';
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
   * Resolves the correct provider, model and API key for a given workflow context.
   *
   * - `discovery` context  → keys from DISCOVERY_GEMINI_API_KEYS / DISCOVERY_GROQ_API_KEYS
   * - `recommendation` context → keys from RECOMMENDATION_GEMINI_API_KEYS / RECOMMENDATION_GROQ_API_KEYS
   *
   * Each context owns its own pool — no cross-contamination of key state.
   */
  private resolveConfig(
    context: AIWorkflowContext,
    useFallback = false,
  ): { provider: AIProviderName; model: string; apiKey: string } | null {
    if (context === 'discovery') {
      if (!useFallback) {
        const provider = env.DISCOVERY_PROVIDER as AIProviderName;
        return {
          provider,
          model: env.DISCOVERY_MODEL,
          apiKey: ProviderPoolFactory.discovery(provider).getCurrentKey(),
        };
      } else {
        if (!env.DISCOVERY_FALLBACK_PROVIDER || !env.DISCOVERY_FALLBACK_MODEL) {
          return null;
        }
        const provider = env.DISCOVERY_FALLBACK_PROVIDER as AIProviderName;
        return {
          provider,
          model: env.DISCOVERY_FALLBACK_MODEL,
          apiKey: ProviderPoolFactory.discovery(provider).getCurrentKey(),
        };
      }
    } else {
      // recommendation context
      if (!useFallback) {
        const provider = env.RECOMMENDATION_PROVIDER as AIProviderName;
        return {
          provider,
          model: env.RECOMMENDATION_MODEL,
          apiKey: ProviderPoolFactory.recommendation(provider).getCurrentKey(),
        };
      } else {
        if (!env.RECOMMENDATION_FALLBACK_PROVIDER || !env.RECOMMENDATION_FALLBACK_MODEL) {
          return null;
        }
        const provider = env.RECOMMENDATION_FALLBACK_PROVIDER as AIProviderName;
        return {
          provider,
          model: env.RECOMMENDATION_FALLBACK_MODEL,
          apiKey: ProviderPoolFactory.recommendation(provider).getCurrentKey(),
        };
      }
    }
  }

  /**
   * Orchestrates the AI generation request.
   * Retries primary provider up to 3 times on transient errors,
   * then falls back to the configured fallback provider.
   */
  async generate(options: AIRequestOptions): Promise<AIGatewayResponse> {
    const context = options.context;

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
      finalResponse = await retryWithBackoff(
        async (attempt) => {
          retriesCount = attempt;
          return await primaryProvider.generate(options, primaryConfig.apiKey, primaryConfig.model);
        },
        {
          retries: 2,
          minTimeoutMs: 1000,
          shouldRetry: (error) => {
            return error instanceof AIApiError || error.name === 'AITimeoutError';
          },
        },
        (error, attempt, delayMs) => {
          console.warn(
            `[AI Gateway] Primary provider ${primaryConfig.provider} failed (attempt ${attempt}). ` +
              `Retrying in ${delayMs.toFixed(0)}ms... Error: ${error.message}`,
          );
        },
      );
    } catch (primaryError: any) {
      console.error(
        `[AI Gateway] Primary provider ${primaryConfig.provider} failed completely ` +
          `after ${retriesCount} retries: ${primaryError.message}`,
      );

      const fallbackConfig = this.resolveConfig(context, true);
      if (!fallbackConfig) {
        console.warn(
          `[AI Gateway] No fallback config available for context "${context}". Re-throwing primary error.`,
        );
        throw primaryError;
      }

      console.warn(
        `[AI Gateway] Switching to fallback provider: ${fallbackConfig.provider} (${fallbackConfig.model})`,
      );

      const fallbackProvider = this.providers[fallbackConfig.provider];
      if (!fallbackProvider) {
        throw new ScoutAIError(`Fallback provider "${fallbackConfig.provider}" is not supported`);
      }

      try {
        finalResponse = await fallbackProvider.generate(
          options,
          fallbackConfig.apiKey,
          fallbackConfig.model,
        );
        finalResponse.metadata.retries = retriesCount;
      } catch (fallbackError: any) {
        console.error(
          `[AI Gateway] Fallback provider ${fallbackConfig.provider} also failed: ${fallbackError.message}`,
        );
        throw new ScoutAIError(
          `Both primary and fallback AI providers failed. ` +
            `Primary: ${primaryError.message}. Fallback: ${fallbackError.message}`,
        );
      }
    }

    finalResponse.metadata.retries = retriesCount;
    this.logMetrics(context, finalResponse);
    return finalResponse;
  }

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
