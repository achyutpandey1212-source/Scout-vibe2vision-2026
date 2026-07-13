import { ProviderKeyPool } from './provider-key-pool';

/**
 * ProviderPoolFactory — convenience helpers for common system-scoped pool access.
 *
 * Instead of writing ProviderKeyPool.for("discovery", "gemini") everywhere,
 * call sites can use:
 *
 *   ProviderPoolFactory.discovery("gemini")
 *   ProviderPoolFactory.recommendation("groq")
 *
 * This is a thin wrapper with zero logic.
 * Adding a new backend system (resume, chat, interview, etc.) simply requires
 * adding a new static method here — ProviderKeyPool itself never changes.
 */
export class ProviderPoolFactory {
  /**
   * Returns the key pool for the Discovery Engine.
   *
   * @example
   *   ProviderPoolFactory.discovery("gemini")   // DISCOVERY_GEMINI_API_KEYS
   *   ProviderPoolFactory.discovery("groq")     // DISCOVERY_GROQ_API_KEYS
   *   ProviderPoolFactory.discovery("firecrawl") // DISCOVERY_FIRECRAWL_API_KEYS
   *   ProviderPoolFactory.discovery("tavily")   // DISCOVERY_TAVILY_API_KEYS
   */
  static discovery(provider: string): ProviderKeyPool {
    return ProviderKeyPool.for('discovery', provider);
  }

  /**
   * Returns the key pool for the Recommendation Engine.
   *
   * @example
   *   ProviderPoolFactory.recommendation("gemini")  // RECOMMENDATION_GEMINI_API_KEYS
   *   ProviderPoolFactory.recommendation("groq")    // RECOMMENDATION_GROQ_API_KEYS
   */
  static recommendation(provider: string): ProviderKeyPool {
    return ProviderKeyPool.for('recommendation', provider);
  }
}
