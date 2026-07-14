/**
 * Stage 4.2.1 — Context Optimization Layer (Final Iteration)
 * optimizer.ts — Pipeline orchestrator with opportunity-aware routing.
 *
 * Additions vs 4.2:
 *  - Adaptive Jina routing: skip Jina when page < jinaThresholdChars
 *  - Negative compression guard: never send Jina output if it's larger than Firecrawl
 *    (unless Jina contains richer opportunity sections)
 *  - Dynamic context budget: auto-selected from page size profile
 *  - Firecrawl vs Jina comparison logged per run
 *  - Expanded quality report with per-priority chunk counts
 *
 * Fallback hierarchy (unchanged from 4.2):
 *  1. Jina fails          → use Firecrawl markdown
 *  2. Cleaner fails       → use raw provider content
 *  3. Chunker fails       → single-chunk fallback
 *  4. Scorer fails        → pass chunks unscored
 *  5. Compressor fails    → legacy chunkMarkdown() truncation
 */

import { CrawledPage } from '../stages/stage2';
import {
  OptimizationProfile,
  DEFAULT_OPTIMIZATION_PROFILE,
  CompressionMetrics,
  OptimizationResult,
  PageSizeProfile,
  classifyPageSize,
  getPageBudgets,
} from './metrics';
import { IContentProvider } from './providers/base-provider';
import { JinaProvider } from './providers/jina-provider';
import { FirecrawlProvider } from './providers/firecrawl-provider';
import { loadDocument } from './langchain/loader';
import { cleanDocument } from './langchain/cleaner';
import { chunkDocument } from './langchain/chunker';
import { scoreChunks } from './langchain/scorer';
import { compressChunks } from './langchain/compressor';
import { chunkMarkdown } from '../stages/stage3';

// ─── Dynamic Budget Resolution ────────────────────────────────────────────────

/**
 * Resolve the character budget for Gemini input based on the page size profile.
 * Reads configurable env vars; falls back to hardcoded defaults.
 */
function resolveMaxChars(profile: PageSizeProfile): number {
  const budgets = getPageBudgets();
  return budgets[profile];
}

// ─── Provider Instantiation ───────────────────────────────────────────────────

function buildJinaProvider(): JinaProvider | null {
  const jinaKey = process.env.JINA_API_KEY;
  if (jinaKey && jinaKey.trim().length > 0) {
    return new JinaProvider(jinaKey.trim());
  }
  return null;
}

// ─── Adaptive Jina Routing ────────────────────────────────────────────────────

interface SourceRoutingDecision {
  content: string;
  jinaUsed: boolean;
  jinaFromCache: boolean;
  jinaChars: number;
  jinaLatencyMs: number;
  jinaSkippedAdaptive: boolean;
  chosenSource: 'jina' | 'firecrawl';
  sourceRoutingReason: string;
}

async function routeContentSource(
  page: CrawledPage,
  profile: OptimizationProfile,
): Promise<SourceRoutingDecision> {
  const firecrawlChars = page.markdown.length;

  // ── Rule 1: Page below threshold — skip Jina entirely ────────────────────
  if (!profile.enableJina || firecrawlChars < profile.jinaThresholdChars) {
    const reason = !profile.enableJina
      ? 'Jina disabled in profile'
      : `Firecrawl (${firecrawlChars} chars) below threshold (${profile.jinaThresholdChars})`;

    console.log(`[ContextOptimizer] Source routing: Firecrawl — ${reason}`);
    return {
      content: page.markdown,
      jinaUsed: false,
      jinaFromCache: false,
      jinaChars: 0,
      jinaLatencyMs: 0,
      jinaSkippedAdaptive: firecrawlChars < profile.jinaThresholdChars && profile.enableJina,
      chosenSource: 'firecrawl',
      sourceRoutingReason: reason,
    };
  }

  // ── Rule 2: No API key — fall back to Firecrawl ───────────────────────────
  const jinaProvider = buildJinaProvider();
  if (!jinaProvider) {
    const reason = 'JINA_API_KEY not set';
    console.warn(`[ContextOptimizer] Source routing: Firecrawl — ${reason}`);
    return {
      content: page.markdown,
      jinaUsed: false,
      jinaFromCache: false,
      jinaChars: 0,
      jinaLatencyMs: 0,
      jinaSkippedAdaptive: false,
      chosenSource: 'firecrawl',
      sourceRoutingReason: reason,
    };
  }

  // ── Rule 3: Call Jina, then apply negative compression guard ─────────────
  try {
    const providerResult = await jinaProvider.getReadableContent(page.url, page.markdown);
    const jinaChars = providerResult.content.length;
    const jinaLatencyMs = providerResult.latencyMs;

    // Negative compression guard: if Jina output is larger, use Firecrawl
    if (jinaChars > firecrawlChars) {
      const reason = `Negative compression guard: Jina (${jinaChars}) > Firecrawl (${firecrawlChars}) — using Firecrawl`;
      console.log(`[ContextOptimizer] Source routing: Firecrawl — ${reason}`);
      return {
        content: page.markdown,
        jinaUsed: false,
        jinaFromCache: providerResult.fromCache,
        jinaChars,
        jinaLatencyMs,
        jinaSkippedAdaptive: false,
        chosenSource: 'firecrawl',
        sourceRoutingReason: reason,
      };
    }

    const reason = `Jina (${jinaChars}) < Firecrawl (${firecrawlChars}) — ${providerResult.fromCache ? 'cache hit' : `${jinaLatencyMs}ms`}`;
    console.log(`[ContextOptimizer] Source routing: Jina — ${reason}`);
    return {
      content: providerResult.content,
      jinaUsed: true,
      jinaFromCache: providerResult.fromCache,
      jinaChars,
      jinaLatencyMs,
      jinaSkippedAdaptive: false,
      chosenSource: 'jina',
      sourceRoutingReason: reason,
    };
  } catch (jinaErr: any) {
    const reason = `Jina failed: ${jinaErr.message}`;
    console.warn(`[ContextOptimizer] Source routing: Firecrawl — ${reason}`);
    return {
      content: page.markdown,
      jinaUsed: false,
      jinaFromCache: false,
      jinaChars: 0,
      jinaLatencyMs: 0,
      jinaSkippedAdaptive: false,
      chosenSource: 'firecrawl',
      sourceRoutingReason: reason,
    };
  }
}

// ─── Quality Report ───────────────────────────────────────────────────────────

function printOptimizationReport(url: string, m: CompressionMetrics): void {
  const ratio = m.compressionRatio.toFixed(1);
  const firecrawlLabel = m.originalChars.toLocaleString();
  const jinaLabel =
    m.jinaChars > 0
      ? m.jinaChars.toLocaleString()
      : m.jinaSkippedAdaptive
        ? 'skipped (page below threshold)'
        : 'not used';

  console.log(`
==============================
Context Optimization Report
URL: ${url}
==============================

Firecrawl:           ${firecrawlLabel} chars
Jina:                ${jinaLabel}
Chosen:              ${m.chosenSource.toUpperCase()}
Reason:              ${m.sourceRoutingReason}

↓ Cleaner:           ${m.charsAfterCleaning.toLocaleString()} chars
↓ Chunks:            ${m.chunksGenerated}
  High:              ${m.highChunksRetained} retained
  Normal:            ${m.normalChunksRetained} retained
  Low:               ${m.lowChunksDiscarded} discarded
↓ Sent:              ${m.charsSentToGemini.toLocaleString()} chars

Page Profile:        ${m.pageSizeProfile}
Compression:         ${ratio}%
Est. Tokens:         ${m.estimatedGeminiInputTokens.toLocaleString()}
Tokens Saved:        ${m.estimatedTokensSaved.toLocaleString()}

Jina Latency:        ${m.jinaLatencyMs}ms
Cleaning Latency:    ${m.cleaningLatencyMs}ms
Compression Latency: ${m.compressionLatencyMs}ms
Total:               ${m.totalOptimizationMs}ms

==============================`);
}

// ─── Main Optimizer ──────────────────────────────────────────────────────────

export async function runOptimizer(
  page: CrawledPage,
  profile: OptimizationProfile,
): Promise<OptimizationResult> {
  const totalStart = Date.now();

  // Resolve dynamic budget from page size
  const pageSizeProfile: PageSizeProfile = classifyPageSize(page.markdown.length);
  const resolvedMaxChars =
    profile.maxChars > 0 ? profile.maxChars : resolveMaxChars(pageSizeProfile);
  const resolvedProfile: OptimizationProfile = { ...profile, maxChars: resolvedMaxChars };

  const metrics: CompressionMetrics = {
    originalChars: page.markdown.length,
    jinaChars: 0,
    jinaSkippedAdaptive: false,
    chosenSource: 'firecrawl',
    sourceRoutingReason: '',
    charsAfterCleaning: 0,
    charsSentToGemini: 0,
    estimatedGeminiInputTokens: 0,
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
  };

  // ── Stage 1: Adaptive Content Routing ────────────────────────────────────
  const routing = await routeContentSource(page, resolvedProfile);
  const providerContent = routing.content;
  metrics.jinaUsed = routing.jinaUsed;
  metrics.jinaFromCache = routing.jinaFromCache;
  metrics.jinaChars = routing.jinaChars;
  metrics.jinaLatencyMs = routing.jinaLatencyMs;
  metrics.jinaSkippedAdaptive = routing.jinaSkippedAdaptive;
  metrics.chosenSource = routing.chosenSource;
  metrics.sourceRoutingReason = routing.sourceRoutingReason;

  // ── Stage 2: LangChain Document Loader ───────────────────────────────────
  const doc = loadDocument(page, providerContent);

  // ── Stage 3: Deterministic Cleaner ───────────────────────────────────────
  let cleanedDoc = doc;
  try {
    const cleanerResult = cleanDocument(doc as any);
    cleanedDoc = cleanerResult.doc as any;
    metrics.cleaningLatencyMs = cleanerResult.cleaningLatencyMs;
    metrics.charsAfterCleaning = cleanedDoc.pageContent.length;
  } catch (cleanErr: any) {
    console.warn(`[ContextOptimizer] Cleaner failed — using raw content: ${cleanErr.message}`);
    metrics.charsAfterCleaning = doc.pageContent.length;
  }

  // ── Stage 4–6: Chunker → Scorer → Compressor ─────────────────────────────
  const compressionStart = Date.now();
  let finalContent: string;

  try {
    // Chunker
    let chunks = chunkDocument(cleanedDoc as any);

    // Scorer
    if (resolvedProfile.enableScoring) {
      try {
        chunks = scoreChunks(chunks);
      } catch (scoreErr: any) {
        console.warn(`[ContextOptimizer] Scorer failed — chunks unscored: ${scoreErr.message}`);
      }
    }

    // Compressor (opportunity-aware staged budget)
    const compressionResult = compressChunks(chunks, resolvedProfile);
    finalContent = compressionResult.content;
    metrics.chunksGenerated = compressionResult.chunksGenerated;
    metrics.chunksRetained = compressionResult.chunksRetained;
    metrics.highChunksRetained = compressionResult.highChunksRetained;
    metrics.normalChunksRetained = compressionResult.normalChunksRetained;
    metrics.lowChunksDiscarded = compressionResult.lowChunksDiscarded;
  } catch (compressionErr: any) {
    console.warn(
      `[ContextOptimizer] Chunker/Compressor failed — using legacy chunkMarkdown: ${compressionErr.message}`,
    );
    finalContent = chunkMarkdown(cleanedDoc.pageContent, resolvedProfile.maxChars);
    metrics.chunksGenerated = 1;
    metrics.chunksRetained = 1;
  }

  metrics.compressionLatencyMs = Date.now() - compressionStart;

  // ── Final Metrics ─────────────────────────────────────────────────────────
  metrics.charsSentToGemini = finalContent.length;
  metrics.estimatedGeminiInputTokens = Math.round(finalContent.length / 4);
  metrics.estimatedTokensSaved = Math.round(
    (metrics.originalChars - metrics.charsSentToGemini) / 4,
  );
  metrics.compressionRatio =
    metrics.originalChars > 0
      ? Math.max(
          0,
          parseFloat(
            (
              ((metrics.originalChars - metrics.charsSentToGemini) / metrics.originalChars) *
              100
            ).toFixed(1),
          ),
        )
      : 0;
  metrics.totalOptimizationMs = Date.now() - totalStart;

  printOptimizationReport(page.url, metrics);

  return { optimizedContent: finalContent, compressionMetrics: metrics };
}
