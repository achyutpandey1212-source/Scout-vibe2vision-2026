/**
 * Stage 4.2 — Context Optimization Layer
 * langchain/cleaner.ts — Deterministic boilerplate stripper.
 *
 * Removes content that survives Firecrawl/Jina but is irrelevant to
 * opportunity extraction: cookie banners, privacy blocks, login prompts,
 * newsletter signups, footer navigation, social links, empty sections,
 * repeated separators, and duplicate paragraphs.
 *
 * Fully deterministic — no LLM, no external calls.
 */

import { Document } from '@langchain/core/documents';
import { ScoutDocument } from './loader';

// ─── Boilerplate Patterns ────────────────────────────────────────────────────

/**
 * Line-level patterns to discard entirely.
 * Each regex is tested against a trimmed line.
 */
const BOILERPLATE_LINE_PATTERNS: RegExp[] = [
  // Cookie / GDPR
  /cookie[s]?\s*(policy|consent|banner|settings|notice|preferences)/i,
  /we use cookies/i,
  /accept (all )?cookies/i,
  /gdpr/i,
  /your privacy (choices|settings)/i,

  // Privacy / Legal
  /privacy\s*policy/i,
  /terms (of\s*(service|use))?/i,
  /\bterms\s*&\s*conditions\b/i,
  /all rights reserved/i,
  /copyright\s*©?\s*\d{4}/i,
  /disclaimer:/i,

  // Navigation boilerplate
  /^(home|about|contact|login|sign\s*in|sign\s*up|register|menu|navigation|skip to (main )?content)\s*$/i,
  /^(back to top|scroll to top|go to top)\s*$/i,

  // Social / Share
  /share (on|via|to)\s*(facebook|twitter|linkedin|whatsapp|instagram|telegram)/i,
  /follow\s*us\s*(on|@)/i,
  /^(tweet|share|like|pin|email)\s*$/i,

  // Newsletter / CTA spam
  /subscribe\s*(to\s*)?(our\s*)?(newsletter|updates|mailing list)/i,
  /enter your email/i,
  /get (the )?latest (updates|news|offers)/i,
  /unsubscribe\s*(from|anytime)/i,

  // Login / Auth prompts
  /^(log\s*in|sign\s*in|create an account|forgot password)\s*$/i,
  /you must be logged in/i,

  // Footer nav patterns
  /^(sitemap|accessibility|careers|press|blog|help|support|faq)\s*$/i,

  // Separator lines (3+ repeated dashes/asterisks/underscores)
  /^[-*_]{3,}\s*$/,

  // Empty markdown image alt or broken link placeholders
  /^\[?\s*\]?\s*\(?\s*\)?\s*$/,
];

/**
 * Paragraph-level patterns to discard blocks of text.
 * Tested against the full paragraph content (lower-cased).
 */
const BOILERPLATE_PARAGRAPH_PATTERNS: RegExp[] = [
  /related (posts?|articles?|content|reads?)/i,
  /recommended (for you|articles?|posts?)/i,
  /you may also like/i,
  /more (from|by) (this|the) author/i,
  /advertisement/i,
  /sponsored content/i,
];

// ─── Cleaner ─────────────────────────────────────────────────────────────────

export interface CleanerResult {
  doc: Document;
  cleaningLatencyMs: number;
  charsRemoved: number;
}

/**
 * Strips boilerplate lines and duplicate paragraphs from a LangChain Document.
 * Returns a new Document with cleaned pageContent, preserving all metadata.
 */
export function cleanDocument(doc: ScoutDocument): CleanerResult {
  const startTime = Date.now();
  const originalLength = doc.pageContent.length;

  const lines = doc.pageContent.split('\n');
  const cleanedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Drop empty lines only when consecutive (preserve single blank lines)
    if (trimmed === '') {
      const lastAdded = cleanedLines[cleanedLines.length - 1];
      if (lastAdded !== undefined && lastAdded.trim() === '') {
        continue; // Skip consecutive blank lines
      }
      cleanedLines.push(line);
      continue;
    }

    // Check against boilerplate line patterns
    const isBoilerplate = BOILERPLATE_LINE_PATTERNS.some((pattern) => pattern.test(trimmed));
    if (isBoilerplate) continue;

    cleanedLines.push(line);
  }

  // Paragraph-level deduplication and boilerplate block removal
  const joined = cleanedLines.join('\n');
  const paragraphs = joined.split(/\n\n+/);
  const seenParagraphs = new Set<string>();
  const cleanedParagraphs: string[] = [];

  for (const para of paragraphs) {
    const normalized = para.trim().toLowerCase().replace(/\s+/g, ' ');

    if (!normalized || normalized.length < 3) continue;

    // Skip duplicate paragraphs
    if (seenParagraphs.has(normalized)) continue;

    // Skip paragraph-level boilerplate blocks
    const isParagraphBoilerplate = BOILERPLATE_PARAGRAPH_PATTERNS.some((p) => p.test(normalized));
    if (isParagraphBoilerplate) continue;

    seenParagraphs.add(normalized);
    cleanedParagraphs.push(para.trim());
  }

  const cleanedContent = cleanedParagraphs.join('\n\n');
  const charsRemoved = originalLength - cleanedContent.length;
  const cleaningLatencyMs = Date.now() - startTime;

  const cleanedDoc = new Document({
    pageContent: cleanedContent,
    metadata: { ...doc.metadata },
  });

  return { doc: cleanedDoc, cleaningLatencyMs, charsRemoved };
}
