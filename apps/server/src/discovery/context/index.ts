/**
 * Stage 4.2.1 — Context Optimization Layer (Final Iteration)
 * index.ts — Public API
 *
 * The rest of Scout interacts only with this module.
 * No other module should import directly from providers/ or langchain/.
 *
 * Usage:
 *   import { optimizeContext } from '../context';
 *   const { optimizedContent, compressionMetrics } = await optimizeContext(page);
 */

import { CrawledPage } from '../stages/stage2';
import {
  OptimizationProfile,
  DEFAULT_OPTIMIZATION_PROFILE,
  OptimizationResult,
  classifyPageSize,
  getPageBudgets,
} from './metrics';
import { runOptimizer } from './optimizer';

export type {
  OptimizationProfile,
  OptimizationResult,
  CompressionMetrics,
  Chunk,
  PageSizeProfile,
} from './metrics';
export { DEFAULT_OPTIMIZATION_PROFILE, classifyPageSize, getPageBudgets } from './metrics';

/**
 * Optimize a crawled page's content for LLM extraction.
 *
 * Runs the full Context Optimization Pipeline:
 *  Adaptive Routing → LangChain Document → Cleaner → Chunker → Scorer → Compressor
 *
 * Key Stage 4.2.1 behaviours:
 *  - Jina is skipped for pages below jinaThresholdChars (default: 8000 chars)
 *  - Negative compression guard prevents sending a larger Jina output
 *  - Context budget is chosen dynamically from page size profile (SMALL/MEDIUM/LARGE/HUGE)
 *  - HIGH-priority opportunity sections are always retained
 *  - LOW-priority boilerplate chunks are discarded
 *
 * Failures at any stage are caught and the pipeline falls through gracefully.
 * This function NEVER throws — extraction always continues.
 *
 * @param page     A successfully crawled page from Stage 2
 * @param profile  Optional per-run overrides for the optimization profile
 * @returns        Optimized content string + full compression telemetry
 */
export async function optimizeContext(
  page: CrawledPage,
  profile?: Partial<OptimizationProfile>,
): Promise<OptimizationResult> {
  // maxChars = 0 signals the optimizer to resolve it dynamically from page size
  const resolvedProfile: OptimizationProfile = {
    ...DEFAULT_OPTIMIZATION_PROFILE,
    maxChars: 0,
    ...profile,
  };

  try {
    return await runOptimizer(page, resolvedProfile);
  } catch (fatalErr: any) {
    // Last-resort safety net — should never be reached due to per-stage fallbacks
    console.error(
      `[ContextOptimizer] Fatal unexpected error — returning raw markdown: ${fatalErr.message}`,
    );
    const pageSizeProfile = classifyPageSize(page.markdown.length);
    return {
      optimizedContent: page.markdown,
      compressionMetrics: {
        originalChars: page.markdown.length,
        jinaChars: 0,
        jinaSkippedAdaptive: false,
        chosenSource: 'firecrawl',
        sourceRoutingReason: 'Fatal fallback — raw markdown returned',
        charsAfterCleaning: page.markdown.length,
        charsSentToGemini: page.markdown.length,
        estimatedGeminiInputTokens: Math.round(page.markdown.length / 4),
        estimatedTokensSaved: 0,
        compressionRatio: 0,
        jinaLatencyMs: 0,
        cleaningLatencyMs: 0,
        compressionLatencyMs: 0,
        totalOptimizationMs: 0,
        chunksGenerated: 0,
        highChunksRetained: 0,
        normalChunksRetained: 0,
        lowChunksDiscarded: 0,
        chunksRetained: 0,
        jinaUsed: false,
        jinaFromCache: false,
        pageSizeProfile,
        visualElementsRemoved: 0,
        logoAssetsRemoved: 0,
        uiBoilerplateRemoved: 0,
      },
    };
  }
}
