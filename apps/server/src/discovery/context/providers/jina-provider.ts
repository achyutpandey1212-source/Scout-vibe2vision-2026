/**
 * Stage 4.2 — Context Optimization Layer
 * providers/jina-provider.ts — Jina Reader API client with Redis cache.
 *
 * Flow:
 *   1. Check Redis for cached Jina output (key: jina:{urlHash})
 *   2. On cache hit → return immediately (fromCache: true)
 *   3. On miss → call https://r.jina.ai/{url} with Bearer auth
 *   4. Store result in Redis (TTL: 24h)
 *   5. Return cleaned markdown
 *
 * The optimizer catches all thrown errors and falls back to FirecrawlProvider.
 * Jina is never aware of opportunity-related concepts — it only cleans pages.
 */

import * as crypto from 'crypto';
import { IContentProvider, ContentProviderResult } from './base-provider';
import { redis } from '../../../config/redis';

const JINA_API_BASE = 'https://r.jina.ai';
const JINA_CACHE_TTL_SECONDS = 86400; // 24 hours
const JINA_REQUEST_TIMEOUT_MS = 10000; // 10 seconds

function buildCacheKey(url: string): string {
  const hash = crypto.createHash('sha256').update(url).digest('hex').substring(0, 16);
  return `jina:${hash}`;
}

export class JinaProvider implements IContentProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getReadableContent(url: string, fallbackMarkdown: string): Promise<ContentProviderResult> {
    const cacheKey = buildCacheKey(url);
    const redisClient = redis.getClient();

    // ── 1. Redis cache check ──────────────────────────────────────────────────
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`[JinaProvider] Cache HIT for ${url}`);
        return { content: cached, fromCache: true, latencyMs: 0 };
      }
    } catch (cacheErr: any) {
      console.warn(`[JinaProvider] Redis read error (proceeding to Jina): ${cacheErr.message}`);
    }

    // ── 2. Jina Reader API call ───────────────────────────────────────────────
    const startTime = Date.now();
    const jinaUrl = `${JINA_API_BASE}/${url}`;

    let responseText: string;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), JINA_REQUEST_TIMEOUT_MS);

      const response = await fetch(jinaUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'text/markdown',
          'X-Return-Format': 'markdown',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Jina API returned HTTP ${response.status} for ${url}`);
      }

      responseText = await response.text();
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      if (err.name === 'AbortError') {
        throw new Error(`Jina request timed out after ${JINA_REQUEST_TIMEOUT_MS}ms for ${url}`);
      }
      throw new Error(`Jina API call failed (${latencyMs}ms): ${err.message}`);
    }

    const latencyMs = Date.now() - startTime;

    if (!responseText || responseText.trim().length < 50) {
      throw new Error(`Jina returned empty or near-empty content for ${url}`);
    }

    // ── 3. Cache the result ───────────────────────────────────────────────────
    try {
      await redisClient.setex(cacheKey, JINA_CACHE_TTL_SECONDS, responseText);
    } catch (cacheSetErr: any) {
      console.warn(`[JinaProvider] Redis write error (non-fatal): ${cacheSetErr.message}`);
    }

    console.log(
      `[JinaProvider] Retrieved ${responseText.length} chars from Jina in ${latencyMs}ms for ${url}`,
    );

    return { content: responseText, fromCache: false, latencyMs };
  }
}
