/**
 * Stage 4.2 — Context Optimization Layer
 * providers/base-provider.ts — Content provider interface.
 *
 * The optimizer never calls Jina directly. All content acquisition is
 * routed through a provider that implements this interface.
 * Switching providers does not affect the rest of the Discovery Engine.
 */

export interface ContentProviderResult {
  /** Cleaned or raw content returned by this provider */
  content: string;
  /** True if the result was served from Redis cache */
  fromCache: boolean;
  /** Latency of the provider call in ms (0 for cache hits) */
  latencyMs: number;
}

export interface IContentProvider {
  /**
   * Acquire the most readable version of a page's content.
   *
   * @param url           The canonical URL of the page
   * @param fallbackMarkdown  The raw Firecrawl markdown (always available)
   * @returns             Provider-cleaned content plus cache/latency metadata
   * @throws              Providers may throw; the optimizer will catch and fall back
   */
  getReadableContent(url: string, fallbackMarkdown: string): Promise<ContentProviderResult>;
}
