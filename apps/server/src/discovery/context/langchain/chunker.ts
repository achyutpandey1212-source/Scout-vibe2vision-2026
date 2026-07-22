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
  /\babout\b/i,
  /\babout\s+company\b/i,
  /\boverview\b/i,
  /\bdescription\b/i,
  /\bresponsibilities\b/i,
  /\brole\b/i,
  /\bwhat\s+you.?ll\s+do\b/i,
  /\brequirements\b/i,
  /\bqualifications\b/i,
  /\bskills(\s+required)?\b/i,
  /\bcompany\s+overview\b/i,
  /\borganization\b/i,
  /\babout\s+organization\b/i,
  /apply\s*(by|before|now)?/i,
  /application\s*(process|deadline|window|form|steps|instructions|link|portal|detail)?/i,
  /how to apply/i,
  /submit\s*(your|an?)?\s*application/i,
  /selection\s*(process|criteria|procedure)?/i,
  /shortlisting/i,
  /recruitment\s*(process|criteria)?/i,
  /timeline/i,
  /schedule/i,
  /deadline/i,
  /last date/i,
  /closing date/i,
  /due date/i,
  /important dates?/i,
];

const LOW_PRIORITY_PATTERNS: RegExp[] = [
  /related\s*(articles?|posts?|opportunities?|reads?)/i,
  /more\s*(opportunities?|articles?|from|by)/i,
  /recommended/i,
  /similar\s*(opportunities?|jobs?|roles?)/i,
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
  /comments?/i,
  /discussions?/i,
  /faqs?/i,
  /tags?$/i,
  /categories$/i,
];

const HEADING_REGEX = /^(#{1,3})\s+(.+)$/;

function classifyPriority(heading: string): ChunkPriority {
  if (HIGH_PRIORITY_PATTERNS.some((re) => re.test(heading))) return 'HIGH';
  if (LOW_PRIORITY_PATTERNS.some((re) => re.test(heading))) return 'LOW';
  return 'NORMAL';
}

function splitLargeChunk(chunk: Chunk, maxChunkSize = 1500): Chunk[] {
  if (chunk.content.length <= maxChunkSize) {
    return [chunk];
  }

  const subChunks: Chunk[] = [];
  const paragraphs = chunk.content.split(/\n\n+/);
  let currentSubContent = '';
  let currentStartLine = chunk.startLine;
  let subIndex = 1;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (currentSubContent.length + para.length + 2 > maxChunkSize && currentSubContent.length > 0) {
      const linesInSub = currentSubContent.split('\n').length;
      subChunks.push({
        heading: chunk.heading ? `${chunk.heading} (Part ${subIndex++})` : '',
        content: currentSubContent.trim(),
        score: 0,
        startLine: currentStartLine,
        endLine: currentStartLine + linesInSub - 1,
        priority: chunk.priority,
      });
      currentStartLine = currentStartLine + linesInSub;
      currentSubContent = para;
    } else {
      if (currentSubContent.length > 0) {
        currentSubContent += '\n\n' + para;
      } else {
        currentSubContent = para;
      }
    }
  }

  if (currentSubContent.trim().length > 0) {
    const linesInSub = currentSubContent.split('\n').length;
    subChunks.push({
      heading:
        chunk.heading && subIndex > 1 ? `${chunk.heading} (Part ${subIndex})` : chunk.heading,
      content: currentSubContent.trim(),
      score: 0,
      startLine: currentStartLine,
      endLine: currentStartLine + linesInSub - 1,
      priority: chunk.priority,
    });
  }

  return subChunks;
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

  const finalChunks: Chunk[] = [];
  for (const chunk of chunks) {
    finalChunks.push(...splitLargeChunk(chunk, 1500));
  }
  return finalChunks;
}
