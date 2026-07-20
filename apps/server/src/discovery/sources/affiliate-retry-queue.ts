import { redis } from '../../config/redis';

const RETRY_QUEUE_ZSET_KEY = 'scout:affiliate:retry_queue';
const RETRY_METADATA_HASH_KEY = 'scout:affiliate:retry_metadata';

export interface RetryItemMetadata {
  domain: string;
  retryCount: number;
  firstFailureAt: string;
  lastAttemptAt: string;
  nextRetryAt: number; // Unix timestamp in ms
  lastError: string;
}

export class AffiliateRetryQueue {
  /**
   * Calculates exponential backoff delay based on retry count.
   * 1st retry: Immediate (0s)
   * 2nd retry: 30 minutes
   * 3rd retry: 2 hours
   * 4th+ retry: 24 hours
   */
  private static getBackoffDelayMs(retryCount: number): number {
    if (retryCount <= 1) return 0;
    if (retryCount === 2) return 30 * 60 * 1000; // 30 minutes
    if (retryCount === 3) return 2 * 60 * 60 * 1000; // 2 hours
    return 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Enqueues or updates a domain in the Redis ZSET retry queue.
   */
  static async enqueue(domain: string, error: string): Promise<void> {
    if (!domain) return;
    const cleanDomain = domain.toLowerCase().trim();
    const redisClient = redis.getClient();
    const now = Date.now();

    try {
      const existingRaw = await redisClient.hget(RETRY_METADATA_HASH_KEY, cleanDomain);
      let existingMeta: RetryItemMetadata | null = null;
      if (existingRaw) {
        try {
          existingMeta = JSON.parse(existingRaw);
        } catch {
          existingMeta = null;
        }
      }

      const retryCount = (existingMeta?.retryCount || 0) + 1;
      const delayMs = this.getBackoffDelayMs(retryCount);
      const nextRetryAt = now + delayMs;

      const metadata: RetryItemMetadata = {
        domain: cleanDomain,
        retryCount,
        firstFailureAt: existingMeta?.firstFailureAt || new Date(now).toISOString(),
        lastAttemptAt: new Date(now).toISOString(),
        nextRetryAt,
        lastError: error || 'Transient AI Provider Failure',
      };

      await redisClient
        .multi()
        .zadd(RETRY_QUEUE_ZSET_KEY, nextRetryAt, cleanDomain)
        .hset(RETRY_METADATA_HASH_KEY, cleanDomain, JSON.stringify(metadata))
        .exec();

      console.log(
        `[AffiliateRetryQueue] Enqueued ${cleanDomain} for retry #${retryCount} (Next retry in ${Math.round(
          delayMs / 1000,
        )}s)`,
      );
    } catch (err: any) {
      console.error(`[AffiliateRetryQueue] Failed to enqueue ${cleanDomain}: ${err.message}`);
    }
  }

  /**
   * Gets domains ready for retry (where nextRetryAt <= now) using Redis ZSET range query.
   */
  static async getReadyItems(
    limit = 25,
  ): Promise<{ domain: string; metadata: RetryItemMetadata }[]> {
    const redisClient = redis.getClient();
    const now = Date.now();

    try {
      // Single fast query based on ZSET score (nextRetryAt <= now)
      const readyDomains: string[] = await redisClient.zrangebyscore(
        RETRY_QUEUE_ZSET_KEY,
        0,
        now,
        'LIMIT',
        0,
        limit,
      );

      if (readyDomains.length === 0) return [];

      const rawMetas = await redisClient.hmget(RETRY_METADATA_HASH_KEY, ...readyDomains);
      const results: { domain: string; metadata: RetryItemMetadata }[] = [];

      readyDomains.forEach((dom, index) => {
        const raw = rawMetas[index];
        if (raw) {
          try {
            results.push({ domain: dom, metadata: JSON.parse(raw) });
          } catch {
            results.push({
              domain: dom,
              metadata: {
                domain: dom,
                retryCount: 1,
                firstFailureAt: new Date().toISOString(),
                lastAttemptAt: new Date().toISOString(),
                nextRetryAt: now,
                lastError: 'Unknown',
              },
            });
          }
        }
      });

      return results;
    } catch (err: any) {
      console.error(`[AffiliateRetryQueue] Failed to fetch ready retry items: ${err.message}`);
      return [];
    }
  }

  /**
   * Removes processed domains from the Redis ZSET and metadata hash.
   */
  static async remove(domains: string[]): Promise<number> {
    if (!domains || domains.length === 0) return 0;
    const redisClient = redis.getClient();
    const cleanDomains = domains.map((d) => d.toLowerCase().trim());

    try {
      await redisClient
        .multi()
        .zrem(RETRY_QUEUE_ZSET_KEY, ...cleanDomains)
        .hdel(RETRY_METADATA_HASH_KEY, ...cleanDomains)
        .exec();

      console.log(`[AffiliateRetryQueue] Removed ${cleanDomains.length} domains from retry queue`);
      return cleanDomains.length;
    } catch (err: any) {
      console.error(
        `[AffiliateRetryQueue] Failed to remove items from retry queue: ${err.message}`,
      );
      return 0;
    }
  }

  /**
   * Fetches summary statistics for the retry queue.
   */
  static async getStats(): Promise<{
    totalPending: number;
    readyToRetry: number;
    lastRetryAt: Date | null;
  }> {
    const redisClient = redis.getClient();
    const now = Date.now();

    try {
      const [totalPending, readyToRetry] = await Promise.all([
        redisClient.zcard(RETRY_QUEUE_ZSET_KEY),
        redisClient.zcount(RETRY_QUEUE_ZSET_KEY, 0, now),
      ]);

      return {
        totalPending,
        readyToRetry,
        lastRetryAt: new Date(),
      };
    } catch {
      return { totalPending: 0, readyToRetry: 0, lastRetryAt: null };
    }
  }
}
