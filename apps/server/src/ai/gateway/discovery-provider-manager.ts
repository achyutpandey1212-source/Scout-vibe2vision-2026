import { env } from '../../config/env';
import { AIGatewayResponse, AIRequestOptions } from '../types/ai.types';
import { GeminiProvider } from '../providers/gemini.provider';
import { GroqProvider } from '../providers/groq.provider';
import { retryWithBackoff } from '../utils/retry';
import { AIApiError, ScoutAIError } from '../utils/errors';

export interface ProviderState {
  provider: 'gemini' | 'groq';
  model: string;
  keys: string[];
  activeKeyIdx: number;
}

export class DiscoveryProviderManager {
  private static instance: DiscoveryProviderManager;
  private geminiProvider: GeminiProvider;
  private groqProvider: GroqProvider;
  private providerPool: ProviderState[] = [];
  private activeProviderIdx = 0;

  private constructor() {
    this.geminiProvider = new GeminiProvider();
    this.groqProvider = new GroqProvider();
    this.initializePools();
  }

  static getInstance(): DiscoveryProviderManager {
    if (!DiscoveryProviderManager.instance) {
      DiscoveryProviderManager.instance = new DiscoveryProviderManager();
    }
    return DiscoveryProviderManager.instance;
  }

  /**
   * Initializes Gemini and Groq provider pools with multiple API keys if configured.
   * Gracefully falls back to existing env variables.
   */
  private initializePools() {
    // 1. Resolve Gemini keys pool
    const geminiKeysEnv = process.env.DISCOVERY_GEMINI_KEYS;
    const geminiKeys = geminiKeysEnv
      ? geminiKeysEnv
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      : [env.DISCOVERY_API_KEY].filter(Boolean);

    if (geminiKeys.length > 0) {
      this.providerPool.push({
        provider: 'gemini',
        model: env.DISCOVERY_MODEL || 'gemini-2.5-flash',
        keys: geminiKeys,
        activeKeyIdx: 0,
      });
    }

    // 2. Resolve Groq keys pool
    const groqKeysEnv = process.env.DISCOVERY_GROQ_KEYS;
    const groqKeys = (
      groqKeysEnv
        ? groqKeysEnv
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean)
        : [env.GROQ_API_KEY || env.DISCOVERY_FALLBACK_API_KEY].filter(Boolean)
    ) as string[];

    if (groqKeys.length > 0) {
      this.providerPool.push({
        provider: 'groq',
        model: env.DISCOVERY_FALLBACK_MODEL || 'llama-3.3-70b-versatile',
        keys: groqKeys,
        activeKeyIdx: 0,
      });
    }

    if (this.providerPool.length === 0) {
      console.warn(
        '[Provider Manager] Warning: No discovery AI provider API keys configured in pool.',
      );
    }
  }

  /**
   * Extracts using active provider. Automatically handles temporary retries, rotates keys
   * on permanent failures, or falls back to next provider when current provider keys exhaust.
   */
  async generate(options: AIRequestOptions): Promise<AIGatewayResponse> {
    if (this.providerPool.length === 0) {
      throw new ScoutAIError('No configured AI providers available for Discovery Engine.');
    }

    let attempts = 0;
    const maxProviderRotations = this.providerPool.reduce((sum, p) => sum + p.keys.length, 0);

    while (attempts < maxProviderRotations) {
      const activeState = this.providerPool[this.activeProviderIdx];
      const activeKey = activeState.keys[activeState.activeKeyIdx];
      const activeProvider =
        activeState.provider === 'gemini' ? this.geminiProvider : this.groqProvider;

      console.log(
        `[Provider Manager] Using ${activeState.provider.toUpperCase()} (Model: ${activeState.model}, Key index: ${activeState.activeKeyIdx})`,
      );

      try {
        // Run with temporary error retry logic (exponential backoff)
        const response = await retryWithBackoff(
          async () => {
            return await activeProvider.generate(options, activeKey, activeState.model);
          },
          {
            retries: 2,
            minTimeoutMs: 1500,
            shouldRetry: (error) => {
              // Temporary errors: 429 rate limit, timeouts, 500, 503
              const msg = error.message.toLowerCase();
              const isRateLimit = msg.includes('429') || msg.includes('rate limit');
              const isTimeout = error.name === 'AITimeoutError' || msg.includes('timeout');
              const is5xx = msg.includes('500') || msg.includes('503');
              return isRateLimit || isTimeout || is5xx;
            },
          },
          (error, attempt, delayMs) => {
            console.warn(
              `[Provider Manager] Temporary failure on attempt ${attempt}. Retrying in ${delayMs.toFixed(0)}ms... Error: ${error.message}`,
            );
          },
        );

        // Success: Log and return response
        this.logMetrics(response);
        return response;
      } catch (err: any) {
        attempts++;
        const msg = err.message.toLowerCase();
        const isQuotaExhausted =
          msg.includes('quota') || msg.includes('exhausted') || msg.includes('limit exceeded');
        const isAuthError =
          msg.includes('api key') ||
          msg.includes('401') ||
          msg.includes('unauthorized') ||
          msg.includes('invalid');
        const isFatal =
          msg.includes('schema') || msg.includes('prompt') || msg.includes('validation failed');

        if (isFatal) {
          console.error(
            `[Provider Manager] Fatal extraction error: ${err.message}. Aborting execution.`,
          );
          throw err;
        }

        if (isQuotaExhausted || isAuthError) {
          console.warn(
            `[Provider Manager] Permanent failure on ${activeState.provider}: ${err.message}`,
          );
          this.rotateKeyOrProvider(activeState);
        } else {
          // If retries exhausted and not classified, default rotate to prevent pipeline lock
          console.warn(`[Provider Manager] Provider failed: ${err.message}. Rotating...`);
          this.rotateKeyOrProvider(activeState);
        }
      }
    }

    throw new ScoutAIError('All Discovery API providers and backup keys have been exhausted.');
  }

  private rotateKeyOrProvider(state: ProviderState) {
    if (state.activeKeyIdx < state.keys.length - 1) {
      state.activeKeyIdx++;
      console.warn(
        `[Provider Manager] Rotated to next API key inside pool for provider: ${state.provider}`,
      );
    } else {
      // Current provider's keys are exhausted. Rotate to next provider
      this.activeProviderIdx = (this.activeProviderIdx + 1) % this.providerPool.length;
      console.warn(
        `[Provider Manager] Exhausted keys for ${state.provider}. Switched to next provider: ${this.providerPool[this.activeProviderIdx].provider}`,
      );
    }
  }

  private logMetrics(response: AIGatewayResponse): void {
    const providerLabel = response.metadata.provider.toUpperCase();
    const latencySec = (response.metadata.latencyMs / 1000).toFixed(1);
    const inputTokens = response.usage?.promptTokens ?? 'N/A';
    const outputTokens = response.usage?.completionTokens ?? 'N/A';

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Provider Manager Extraction Success]
Provider: ${providerLabel}
Model: ${response.metadata.model}
Latency: ${latencySec}s
Tokens:
  Input: ${inputTokens}
  Output: ${outputTokens}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  }
}
