/**
 * Stage 4.2.1 — Context Optimization Layer (Final Iteration)
 * langchain/chunker.ts — Opportunity-aware section chunker.
 *
 * Splits a cleaned Document into logical Chunks on H1–H3 markdown headings.
 * Each chunk carries rich metadata: heading, content, startLine, endLine,
 * and a priority level (HIGH / NORMAL / LOW) based on heading classification.
 *
 * Priority drives the compressor's staged budget strategy:
 *  HIGH   — Always retain (eligibility, deadline, benefits, application process, …)
 *  NORMAL — Keep if budget allows (org overview, FAQ, event details, …)
 *  LOW    — Discard (related articles, newsletter, footer, legal, …)
 *
 * Avoids arbitrary splitting — always respects section boundaries.
 */

import { Document } from '@langchain/core/documents';
import { Chunk, ChunkPriority } from '../metrics';

// ─── HIGH Priority Section Keywords ──────────────────────────────────────────

const HIGH_PRIORITY_PATTERNS: RegExp[] = [
  /eligib/i,
  /deadline/i,
  /last date/i,
  /closing date/i,
  /due date/i,
  /important dates?/i,
  /apply\s*(by|before|now)?/i,
  /application\s*(process|deadline|window|form|steps|instructions|link|portal|detail)?/i,
  /how to apply/i,
  /submit\s*(your|an?)?\s*application/i,
  /benefits?/i,
  /stipend/i,
  /salary/i,
  /compensation/i,
  /remuneration/i,
  /prize/i,
  /reward/i,
  /perks?/i,
  /fellowship/i,
  /scholarship/i,
  /selection\s*(process|criteria|procedure)?/i,
  /shortlisting/i,
  /recruitment\s*(process|criteria)?/i,
  /requirement/i,
  /qualification/i,
  /responsibilities/i,
  /your\s*role/i,
  /what you.ll do/i,
  /job\s*(description|profile|duties)/i,
  /timeline/i,
  /schedule/i,
  /duration/i,
  /registration/i,
  /program\s*overview/i,
  /about\s*(the\s*)?(program|opportunity|internship|fellowship|scholarship|role|position)/i,
  /overview/i,
  /who\s*(can|should|is eligible)/i,
  /who\s*can\s*apply/i,
  /funded/i,
  /grant/i,
];

// ─── LOW Priority Section Keywords ───────────────────────────────────────────

const LOW_PRIORITY_PATTERNS: RegExp[] = [
  /related\s*(articles?|posts?|opportunities?|reads?)/i,
  /more\s*(opportunities?|articles?|from|by)/i,
  /recommended/i,
  /you\s*may\s*also\s*(like|be\s*interested)/i,
  /newsletter/i,
  /subscribe/i,
  /follow\s*us/i,
  /social\s*(media|links?)/i,
  /footer/i,
  /sitemap/i,
  /cookie/i,
  /privacy\s*policy/i,
  /terms\s*(of\s*(service|use))?/i,
  /disclaimer/i,
  /copyright/i,
  /advertis/i,
  /sponsored/i,
  /share\s*(this|on)/i,
  /comment/i,
  /tags?$/i,
  /categories$/i,
];

const HEADING_REGEX = /^(#{1,3})\s+(.+)$/;

function classifyPriority(heading: string): ChunkPriority {
  if (HIGH_PRIORITY_PATTERNS.some((re) => re.test(heading))) return 'HIGH';
  if (LOW_PRIORITY_PATTERNS.some((re) => re.test(heading))) return 'LOW';
  return 'NORMAL';
}

// ─── Chunker ─────────────────────────────────────────────────────────────────

/**
 * Splits a cleaned Document into Chunk[] on H1–H3 markdown headings.
 * Content before the first heading is captured as a preamble chunk (NORMAL priority).
 */
export function chunkDocument(doc: Document): Chunk[] {
  const lines = doc.pageContent.split('\n');
  const chunks: Chunk[] = [];

  let currentHeading = '';
  let currentPriority: ChunkPriority = 'NORMAL';
  let currentLines: string[] = [];
  let currentStartLine = 0;

  const flushChunk = (endLine: number): void => {
    const content = currentLines.join('\n').trim();
    if (content.length === 0) return;

    chunks.push({
      heading: currentHeading,
      content,
      score: 0,
      startLine: currentStartLine,
      endLine,
      priority: currentPriority,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = HEADING_REGEX.exec(line);

    if (headingMatch) {
      flushChunk(i - 1);
      currentHeading = headingMatch[2].trim();
      currentPriority = classifyPriority(currentHeading);
      currentLines = [line];
      currentStartLine = i;
    } else {
      currentLines.push(line);
    }
  }

  flushChunk(lines.length - 1);

  // No headings at all — return the entire content as one NORMAL chunk
  if (chunks.length === 0 && doc.pageContent.trim().length > 0) {
    chunks.push({
      heading: '',
      content: doc.pageContent.trim(),
      score: 0,
      startLine: 0,
      endLine: lines.length - 1,
      priority: 'NORMAL',
    });
  }

  return chunks;
}
