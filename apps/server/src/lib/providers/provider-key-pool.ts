import dotenv from 'dotenv';
dotenv.config();

// ─── Status Types ─────────────────────────────────────────────────────────────

export type PoolStatus = 'ACTIVE' | 'DEGRADED' | 'EXHAUSTED';

export interface ProviderPoolStats {
  system: string;
  provider: string;
  totalKeys: number;
  activeIndex: number;
  successRequests: number;
  failedRequests: number;
  rotations: number;
  lastRotationAt: string | null;
  currentStatus: PoolStatus;
}

// ─── ProviderKeyPool ──────────────────────────────────────────────────────────

/**
 * Generic, system-scoped API key pool.
 *
 * Each instance is identified by a composite key: `system:provider`
 * e.g. "discovery:gemini", "recommendation:groq", "resume:gemini"
 *
 * This class has zero knowledge of what "discovery" or "recommendation" means.
 * It simply holds a list of keys, rotates them in memory, and tracks telemetry.
 *
 * Usage:
 *   ProviderKeyPool.for("discovery", "gemini")
 *   ProviderKeyPool.for("recommendation", "groq")
 *   ProviderKeyPool.for("resume", "gemini")   // works without any code changes
 */
export class ProviderKeyPool {
  private static instances: Map<string, ProviderKeyPool> = new Map();

  private keys: string[] = [];
  private currentIndex = 0;
  private successCount = 0;
  private failureCount = 0;
  private rotationCount = 0;
  private lastRotationAt: Date | null = null;

  private readonly systemName: string;
  private readonly providerName: string;

  private constructor(system: string, provider: string) {
    this.systemName = system.toLowerCase().trim();
    this.providerName = provider.toLowerCase().trim();
    this.loadKeys();
  }

  /**
   * Factory — resolves or creates a singleton key pool for the given system+provider pair.
   * Singleton key: "discovery:gemini", "recommendation:groq", etc.
   */
  static for(system: string, provider: string): ProviderKeyPool {
    const key = `${system.toLowerCase().trim()}:${provider.toLowerCase().trim()}`;
    if (!ProviderKeyPool.instances.has(key)) {
      ProviderKeyPool.instances.set(key, new ProviderKeyPool(system, provider));
    }
    return ProviderKeyPool.instances.get(key)!;
  }

  /**
   * Returns all registered pool instances (used by admin telemetry).
   */
  static getAllPools(): ProviderKeyPool[] {
    return Array.from(ProviderKeyPool.instances.values());
  }

  /**
   * Loads API keys from environment using the pattern:
   *   ${SYSTEM}_${PROVIDER}_API_KEYS
   *
   * Examples:
   *   DISCOVERY_GEMINI_API_KEYS=key1,key2,key3
   *   RECOMMENDATION_GROQ_API_KEYS=key1
   *   RESUME_GEMINI_API_KEYS=key1,key2
   */
  private loadKeys(): void {
    const envVarName = `${this.systemName.toUpperCase()}_${this.providerName.toUpperCase()}_API_KEYS`;
    const envValue = process.env[envVarName];

    if (envValue) {
      this.keys = envValue
        .split(',')
        .map((k) => k.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }

    if (this.keys.length === 0) {
      console.warn(
        `[ProviderPool] Warning: No API keys found for pool "${this.systemName}:${this.providerName}". ` +
          `Expected env var: ${envVarName}`,
      );
    }
  }

  // ─── Key Access ─────────────────────────────────────────────────────────────

  /** Returns the full list of keys (for diagnostics only — never log these). */
  getKeys(): string[] {
    return this.keys;
  }

  /** Returns the currently active API key. */
  getCurrentKey(): string {
    if (this.keys.length === 0) return '';
    return this.keys[this.currentIndex];
  }

  /** Rotates to the next key in the pool (circular). Returns new active key. */
  rotate(): string {
    if (this.keys.length <= 1) return this.getCurrentKey();

    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    this.rotationCount++;
    this.lastRotationAt = new Date();

    console.log(
      `[ProviderPool] Rotated ${this.systemName}:${this.providerName.toUpperCase()} key ` +
        `(${this.currentIndex + 1}/${this.keys.length})`,
    );

    return this.getCurrentKey();
  }

  // ─── Telemetry Tracking ──────────────────────────────────────────────────────

  markSuccess(): void {
    this.successCount++;
  }

  markFailure(): void {
    this.failureCount++;
  }

  // ─── Status Resolution ───────────────────────────────────────────────────────

  private resolveStatus(): PoolStatus {
    if (this.keys.length === 0) return 'EXHAUSTED';
    if (this.failureCount > 0 && this.failureCount >= this.successCount) return 'DEGRADED';
    return 'ACTIVE';
  }

  // ─── Telemetry Output ────────────────────────────────────────────────────────

  getTelemetry(): ProviderPoolStats {
    return {
      system: this.systemName,
      provider: this.providerName,
      totalKeys: this.keys.length,
      activeIndex: this.currentIndex,
      successRequests: this.successCount,
      failedRequests: this.failureCount,
      rotations: this.rotationCount,
      lastRotationAt: this.lastRotationAt ? this.lastRotationAt.toISOString() : null,
      currentStatus: this.resolveStatus(),
    };
  }

  // ─── Test Helpers ─────────────────────────────────────────────────────────────

  /** Override keys list — for tests only. */
  setKeys(keys: string[]): void {
    this.keys = keys.filter(Boolean);
    this.currentIndex = 0;
  }
}
