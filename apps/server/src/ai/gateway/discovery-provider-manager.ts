import { env } from '../../config/env';
import { AIGatewayResponse, AIRequestOptions } from '../types/ai.types';
import { GeminiProvider } from '../providers/gemini.provider';
import { GroqProvider } from '../providers/groq.provider';
import { retryWithBackoff } from '../utils/retry';
import { ScoutAIError } from '../utils/errors';
import { ProviderPoolFactory } from '../../lib/providers/provider-pool-factory';

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
   * Initializes Discovery Engine provider pools.
   * Keys come exclusively from DISCOVERY_GEMINI_API_KEYS and DISCOVERY_GROQ_API_KEYS.
   */
  private initializePools() {
    // 1. Resolve Discovery Gemini pool
    const geminiPool = ProviderPoolFactory.discovery('gemini');
    if (geminiPool.getKeys().length > 0) {
      this.providerPool.push({
        provider: 'gemini',
        model: env.DISCOVERY_MODEL || 'gemini-2.5-flash',
        keys: geminiPool.getKeys(),
        activeKeyIdx: 0,
      });
    }

    // 2. Resolve Discovery Groq pool
    const groqPool = ProviderPoolFactory.discovery('groq');
    if (groqPool.getKeys().length > 0) {
      this.providerPool.push({
        provider: 'groq',
        model: env.DISCOVERY_FALLBACK_MODEL || 'llama-3.3-70b-versatile',
        keys: groqPool.getKeys(),
        activeKeyIdx: 0,
      });
    }

    if (this.providerPool.length === 0) {
      console.warn(
        '[Discovery Provider Manager] Warning: No Discovery AI provider API keys configured. ' +
          'Set DISCOVERY_GEMINI_API_KEYS and/or DISCOVERY_GROQ_API_KEYS in your environment.',
      );
    }
  }

  /**
   * Generates AI response using the active Discovery provider.
   * Automatically retries on transient errors, rotates keys on permanent failures,
   * and falls back to the next provider when all keys are exhausted.
   */
  async generate(options: AIRequestOptions): Promise<AIGatewayResponse> {
    if (this.providerPool.length === 0) {
      throw new ScoutAIError('No configured AI providers available for Discovery Engine.');
    }

    let attempts = 0;
    const maxProviderRotations = this.providerPool.reduce(
      (sum, p) => sum + ProviderPoolFactory.discovery(p.provider).getKeys().length,
      0,
    );

    while (attempts < maxProviderRotations) {
      const activeState = this.providerPool[this.activeProviderIdx];
      const pool = ProviderPoolFactory.discovery(activeState.provider);
      const activeKey = pool.getCurrentKey();
      const activeProvider =
        activeState.provider === 'gemini' ? this.geminiProvider : this.groqProvider;

      console.log(
        `[Discovery Provider Manager] Using ${activeState.provider.toUpperCase()} ` +
          `(Model: ${activeState.model}, Key index: ${pool.getTelemetry().activeIndex})`,
      );

      try {
        const response = await retryWithBackoff(
          async () => {
            return await activeProvider.generate(options, activeKey, activeState.model);
          },
          {
            retries: 1,
            minTimeoutMs: 1000,
            shouldRetry: (error) => {
              // Only retry on transient errors
              const msg = error.message.toLowerCase();
              const isRateLimit = msg.includes('429') || msg.includes('rate limit');
              const isTimeout = error.name === 'AITimeoutError' || msg.includes('timeout');
              const is5xx = msg.includes('500') || msg.includes('503');
              return isRateLimit || isTimeout || is5xx;
            },
          },
          (error, attempt, delayMs) => {
            console.warn(
              `[Discovery Provider Manager] Temporary failure on attempt ${attempt}. ` +
                `Retrying in ${delayMs.toFixed(0)}ms... Error: ${error.message}`,
            );
          },
        );

        pool.markSuccess();
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
            `[Discovery Provider Manager] Fatal extraction error: ${err.message}. Aborting.`,
          );
          throw err;
        }

        pool.markFailure();
        if (isQuotaExhausted || isAuthError) {
          console.warn(
            `[Discovery Provider Manager] Permanent failure on ${activeState.provider}: ${err.message}`,
          );
          this.rotateKeyOrProvider(activeState);
        } else {
          console.warn(`[Discovery Provider Manager] Provider failed: ${err.message}. Rotating...`);
          this.rotateKeyOrProvider(activeState);
        }
      }
    }

    throw new ScoutAIError('All Discovery API providers and backup keys have been exhausted.');
  }

  private rotateKeyOrProvider(state: ProviderState) {
    const pool = ProviderPoolFactory.discovery(state.provider);
    const oldIndex = pool.getTelemetry().activeIndex;
    pool.rotate();
    const newIndex = pool.getTelemetry().activeIndex;

    state.activeKeyIdx = newIndex;

    if (newIndex === 0 && oldIndex >= 0 && pool.getTelemetry().totalKeys > 1) {
      // All keys for this provider exhausted — rotate to next provider
      this.activeProviderIdx = (this.activeProviderIdx + 1) % this.providerPool.length;
      console.warn(
        `[Discovery Provider Manager] Exhausted keys for ${state.provider}. ` +
          `Switched to next provider: ${this.providerPool[this.activeProviderIdx].provider}`,
      );
    } else {
      console.warn(
        `[Discovery Provider Manager] Rotated to next key for ${state.provider} (index: ${newIndex})`,
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
[Discovery Extraction Success]
Provider: ${providerLabel}
Model: ${response.metadata.model}
Latency: ${latencySec}s
Tokens:
  Input: ${inputTokens}
  Output: ${outputTokens}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  }
}
