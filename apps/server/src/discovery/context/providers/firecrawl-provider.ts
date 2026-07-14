/**
 * Stage 4.2 — Context Optimization Layer
 * providers/firecrawl-provider.ts — Passthrough provider using Firecrawl markdown.
 *
 * Used when Jina is disabled (no API key) or unavailable.
 * Returns the Firecrawl markdown unchanged so the downstream
 * Cleaner → Chunker → Scorer → Compressor pipeline still runs.
 */

import { IContentProvider, ContentProviderResult } from './base-provider';

export class FirecrawlProvider implements IContentProvider {
  async getReadableContent(_url: string, fallbackMarkdown: string): Promise<ContentProviderResult> {
    return {
      content: fallbackMarkdown,
      fromCache: false,
      latencyMs: 0,
    };
  }
}
