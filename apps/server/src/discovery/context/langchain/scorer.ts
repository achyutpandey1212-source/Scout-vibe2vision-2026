/**
 * Stage 4.2 — Context Optimization Layer
 * langchain/scorer.ts — Keyword-density relevance scorer.
 *
 * Each chunk receives a score 0–100 based on the density of
 * opportunity-relevant keywords within its content.
 *
 * HIGH-priority chunks (critical section headings) receive a +20 base bonus
 * before keyword scoring to ensure they're always competitive.
 *
 * Fully deterministic — no LLM, no external calls.
 */

import { Chunk } from '../metrics';

// ─── Opportunity Signal Keywords ─────────────────────────────────────────────

/**
 * Keywords that indicate high-value opportunity content.
 * Each occurrence adds to the raw score before normalization.
 */
const OPPORTUNITY_KEYWORDS: RegExp[] = [
  /\bapply\b/i,
  /\bapplication\b/i,
  /\bdeadline\b/i,
  /\blast date\b/i,
  /\bclosing date\b/i,
  /\beligib/i,
  /\bfellowship\b/i,
  /\binternship\b/i,
  /\bscholarship\b/i,
  /\bhackathon\b/i,
  /\bchallenge\b/i,
  /\brecruitment\b/i,
  /\bhiring\b/i,
  /\bjob\b/i,
  /\bvacancy\b/i,
  /\bopening\b/i,
  /\bprize\b/i,
  /\bstipend\b/i,
  /\bsalary\b/i,
  /\bcompensation\b/i,
  /\bselection\b/i,
  /\bbenefits?\b/i,
  /\bqualification\b/i,
  /\bresponsibilit/i,
  /\bregistration\b/i,
  /\bgrant\b/i,
  /\bbootcamp\b/i,
  /\bcompetition\b/i,
  /\baccelerator\b/i,
  /\bincubator\b/i,
  /\bmentorship\b/i,
  /\btraining\b/i,
  /\bprogram\b/i,
  /\bopportunity\b/i,
  /\baward\b/i,
  /\bfunding\b/i,
  /\bfully funded\b/i,
  /\bopen to\b/i,
  /\bwho can apply\b/i,
  /\bhow to apply\b/i,
  /\bapplication (form|link|portal|process|window)\b/i,
  /\bsubmit\b/i,
  /\bapply (now|here|online|via|through)\b/i,
];

// ─── Scorer ──────────────────────────────────────────────────────────────────

/**
 * Score a single chunk based on keyword density.
 * Returns a score in the range [0, 100].
 */
function scoreChunk(chunk: Chunk): number {
  // HIGH-priority headings get a base bonus
  let rawScore = chunk.priority === 'HIGH' ? 20 : 0;

  // Count keyword hits in the combined heading + content
  const textToScore = `${chunk.heading} ${chunk.content}`.toLowerCase();
  for (const keyword of OPPORTUNITY_KEYWORDS) {
    const matches = textToScore.match(new RegExp(keyword.source, 'gi'));
    if (matches) {
      rawScore += matches.length;
    }
  }

  // Normalize: score is roughly capped at 100 (20 signals × 5 avg hits each)
  // Use a sigmoid-like compression to stay within 0–100
  const normalized = Math.min(100, Math.round((rawScore / 120) * 100));
  return normalized;
}

/**
 * Score all chunks and return them with updated score fields.
 * Does not mutate input — returns new Chunk objects.
 */
export function scoreChunks(chunks: Chunk[]): Chunk[] {
  return chunks.map((chunk) => ({
    ...chunk,
    score: scoreChunk(chunk),
  }));
}
