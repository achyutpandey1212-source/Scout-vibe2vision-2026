/**
 * Stage 4.2.1 — Context Optimization Layer (Final Iteration)
 * langchain/compressor.ts — Opportunity-aware staged budget compressor.
 *
 * Algorithm:
 *  Step 1. Collect HIGH chunks (capped at maxHighChunks, budget-checked).
 *  Step 2. Measure total size. If already within budget → done.
 *  Step 3. Add NORMAL chunks (capped at maxNormalChunks, highest score first).
 *  Step 4. LOW chunks are discarded (maxLowChunks = 0 by default).
 *  Step 5. Reconstruct in original document order (by startLine).
 *
 * Fully deterministic — no LLM, no summarization, no truncation mid-chunk.
 */

import { Chunk, OptimizationProfile } from '../metrics';

export interface CompressorResult {
  content: string;
  chunksGenerated: number;
  chunksRetained: number;
  highChunksRetained: number;
  normalChunksRetained: number;
  lowChunksDiscarded: number;
}

function renderChunk(chunk: Chunk): string {
  return chunk.heading ? `## ${chunk.heading}\n\n${chunk.content}` : chunk.content;
}

/**
 * Compress a scored list of chunks using the opportunity-aware staged budget strategy.
 */
export function compressChunks(chunks: Chunk[], profile: OptimizationProfile): CompressorResult {
  const chunksGenerated = chunks.length;

  if (chunks.length === 0) {
    return {
      content: '',
      chunksGenerated: 0,
      chunksRetained: 0,
      highChunksRetained: 0,
      normalChunksRetained: 0,
      lowChunksDiscarded: 0,
    };
  }

  // ── If compression disabled: join everything, hard-cap at maxChars ─────────
  if (!profile.enableCompression) {
    const content = chunks.map(renderChunk).join('\n\n');
    return {
      content: content.slice(0, profile.maxChars),
      chunksGenerated,
      chunksRetained: chunks.length,
      highChunksRetained: chunks.filter((c) => c.priority === 'HIGH').length,
      normalChunksRetained: chunks.filter((c) => c.priority === 'NORMAL').length,
      lowChunksDiscarded: 0,
    };
  }

  // ── Partition by priority ─────────────────────────────────────────────────
  const highChunks = chunks.filter((c) => c.priority === 'HIGH');
  const normalChunks = chunks
    .filter((c) => c.priority === 'NORMAL')
    .sort((a, b) => b.score - a.score);
  const lowChunks = chunks.filter((c) => c.priority === 'LOW');

  const selected: Chunk[] = [];
  let usedChars = 0;

  const tryAdd = (chunk: Chunk): boolean => {
    const text = renderChunk(chunk);
    const len = text.length + 4; // +4 for \n\n separator
    if (usedChars + len > profile.maxChars && selected.length > 0) return false;
    selected.push(chunk);
    usedChars += len;
    return true;
  };

  // ── Step 1: HIGH priority chunks (capped at maxHighChunks) ────────────────
  let highRetained = 0;
  if (profile.preserveCriticalSections) {
    for (const chunk of highChunks) {
      if (highRetained >= profile.maxHighChunks) break;
      if (tryAdd(chunk)) highRetained++;
    }
  }

  // ── Step 2: If already within budget, done ────────────────────────────────
  // (Step 3 runs anyway to fill remaining budget with NORMAL chunks)

  // ── Step 3: NORMAL priority chunks (capped at maxNormalChunks) ───────────
  let normalRetained = 0;
  for (const chunk of normalChunks) {
    if (normalRetained >= profile.maxNormalChunks) break;
    if (!tryAdd(chunk)) break;
    normalRetained++;
  }

  // ── Step 4: LOW priority — discarded unless maxLowChunks > 0 ─────────────
  let lowRetained = 0;
  if (profile.maxLowChunks > 0) {
    for (const chunk of lowChunks) {
      if (lowRetained >= profile.maxLowChunks) break;
      if (!tryAdd(chunk)) break;
      lowRetained++;
    }
  }

  const lowDiscarded = lowChunks.length - lowRetained;

  // ── Step 5: Reconstruct in original document order ────────────────────────
  selected.sort((a, b) => a.startLine - b.startLine);

  const content = selected.map(renderChunk).join('\n\n');

  return {
    content,
    chunksGenerated,
    chunksRetained: selected.length,
    highChunksRetained: highRetained,
    normalChunksRetained: normalRetained,
    lowChunksDiscarded: lowDiscarded,
  };
}
