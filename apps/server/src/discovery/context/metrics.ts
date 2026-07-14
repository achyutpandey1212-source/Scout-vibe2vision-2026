/**
 * Stage 4.2.1 — Context Optimization Layer (Final Iteration)
 * metrics.ts — Shared types for optimization profiles, metrics, chunks, and results.
 */

// ─── Page Size Profiles ───────────────────────────────────────────────────────

export type PageSizeProfile = 'SMALL' | 'MEDIUM' | 'LARGE' | 'HUGE';

/**
 * Configurable character budgets per page size profile.
 * Resolved at runtime from environment variables or these defaults.
 */
export interface PageBudgets {
  SMALL: number; // default: 3500
  MEDIUM: number; // default: 5000
  LARGE: number; // default: 7000
  HUGE: number; // default: 9000
}

export function getPageBudgets(): PageBudgets {
  return {
    SMALL: parseInt(process.env.SMALL_PAGE_BUDGET || '3500', 10),
    MEDIUM: parseInt(process.env.MEDIUM_PAGE_BUDGET || '5000', 10),
    LARGE: parseInt(process.env.LARGE_PAGE_BUDGET || '7000', 10),
    HUGE: parseInt(process.env.HUGE_PAGE_BUDGET || '9000', 10),
  };
}

/**
 * Classifies a page into a size profile based on character count.
 * Used to select the appropriate compression budget automatically.
 */
export function classifyPageSize(chars: number): PageSizeProfile {
  if (chars < 5000) return 'SMALL';
  if (chars < 12000) return 'MEDIUM';
  if (chars < 25000) return 'LARGE';
  return 'HUGE';
}

// ─── Optimization Profile ────────────────────────────────────────────────────

/**
 * Configurable per-run settings for the context optimizer.
 * Allows future tuning without touching implementation code.
 */
export interface OptimizationProfile {
  /** Maximum characters to send to Gemini — resolved dynamically from page size */
  maxChars: number;
  /** Maximum number of chunks to retain (default: 20, overridden per priority tier) */
  maxChunks: number;
  /** Always preserve sections matching critical opportunity keywords (default: true) */
  preserveCriticalSections: boolean;
  /** Whether to attempt Jina Reader cleaning (default: true, requires JINA_API_KEY) */
  enableJina: boolean;
  /** Whether to run compression (rank → merge → trim) (default: true) */
  enableCompression: boolean;
  /** Whether to run keyword relevance scoring (default: true) */
  enableScoring: boolean;

  // ── Stage 4.2.1 additions ──

  /** Characters below which Jina is skipped — page is already compact (env: JINA_THRESHOLD_CHARS, default: 8000) */
  jinaThresholdChars: number;
  /** Maximum number of HIGH-priority chunks to retain (env: MAX_HIGH_PRIORITY_CHUNKS, default: 6) */
  maxHighChunks: number;
  /** Maximum number of NORMAL-priority chunks to retain (env: MAX_NORMAL_PRIORITY_CHUNKS, default: 3) */
  maxNormalChunks: number;
  /** Maximum number of LOW-priority chunks to retain (default: 0 — LOW chunks are discarded) */
  maxLowChunks: number;
}

export const DEFAULT_OPTIMIZATION_PROFILE: OptimizationProfile = {
  maxChars: 7000, // Overridden dynamically by page size profile
  maxChunks: 20, // Kept as a safety ceiling; per-priority limits take precedence
  preserveCriticalSections: true,
  enableJina: true,
  enableCompression: true,
  enableScoring: true,
  jinaThresholdChars: parseInt(process.env.JINA_THRESHOLD_CHARS || '8000', 10),
  maxHighChunks: parseInt(process.env.MAX_HIGH_PRIORITY_CHUNKS || '6', 10),
  maxNormalChunks: parseInt(process.env.MAX_NORMAL_PRIORITY_CHUNKS || '3', 10),
  maxLowChunks: 0,
};

// ─── Chunk ───────────────────────────────────────────────────────────────────

export type ChunkPriority = 'HIGH' | 'NORMAL' | 'LOW';

/**
 * A section of the document after chunking, carrying rich metadata
 * for debugging, explainability, and smarter compression.
 */
export interface Chunk {
  /** The heading text that introduced this section (empty string if preamble) */
  heading: string;
  /** The textual content of the section */
  content: string;
  /** Relevance score 0–100 (assigned by scorer) */
  score: number;
  /** Starting line number in the cleaned document (0-indexed) */
  startLine: number;
  /** Ending line number in the cleaned document (0-indexed, inclusive) */
  endLine: number;
  /** Pre-set priority based on heading keyword match */
  priority: ChunkPriority;
}

// ─── Compression Metrics ─────────────────────────────────────────────────────

/**
 * Full observability record for one optimization run.
 * Logged as a Context Optimization Report after every execution.
 */
export interface CompressionMetrics {
  /** Character count of the raw Firecrawl markdown input */
  originalChars: number;
  /** Character count produced by Jina Reader (0 if Jina skipped) */
  jinaChars: number;
  /** Whether Jina was skipped due to adaptive routing (page below threshold) */
  jinaSkippedAdaptive: boolean;
  /** The source chosen for downstream processing: 'jina' | 'firecrawl' */
  chosenSource: 'jina' | 'firecrawl';
  /** Human-readable reason for the source routing decision */
  sourceRoutingReason: string;
  /** Character count after deterministic boilerplate cleaning */
  charsAfterCleaning: number;
  /** Character count of the final optimized content sent to Gemini */
  charsSentToGemini: number;
  /** Estimated Gemini input tokens (chars / 4) */
  estimatedGeminiInputTokens: number;
  /** Estimated tokens saved vs raw Firecrawl input */
  estimatedTokensSaved: number;
  /** Reduction percentage: (1 - charsSentToGemini / originalChars) * 100 */
  compressionRatio: number;
  /** Time spent calling Jina Reader API in ms (0 if skipped) */
  jinaLatencyMs: number;
  /** Time spent in deterministic cleaning in ms */
  cleaningLatencyMs: number;
  /** Time spent in chunking + scoring + compression in ms */
  compressionLatencyMs: number;
  /** Total wall-clock time for the entire optimization in ms */
  totalOptimizationMs: number;
  /** Total chunks produced by the chunker */
  chunksGenerated: number;
  /** HIGH-priority chunks retained */
  highChunksRetained: number;
  /** NORMAL-priority chunks retained */
  normalChunksRetained: number;
  /** LOW-priority chunks discarded */
  lowChunksDiscarded: number;
  /** Total chunks retained after compression */
  chunksRetained: number;
  /** Whether Jina Reader was invoked in this run */
  jinaUsed: boolean;
  /** Whether the Jina result came from Redis cache */
  jinaFromCache: boolean;
  /** The page size profile used for budgeting */
  pageSizeProfile: PageSizeProfile;
  /** Number of markdown images removed by the cleaner (Stage 4.2.2) */
  visualElementsRemoved: number;
  /** Number of standalone logo/asset filename lines removed (Stage 4.2.2) */
  logoAssetsRemoved: number;
  /** Number of UI/marketing boilerplate lines removed (Stage 4.2.2) */
  uiBoilerplateRemoved: number;
}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface OptimizationResult {
  /** The compressed, clean content string ready to send to Gemini */
  optimizedContent: string;
  /** Full telemetry for this optimization run */
  compressionMetrics: CompressionMetrics;
}
