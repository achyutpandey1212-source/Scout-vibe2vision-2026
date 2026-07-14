/**
 * Stage 4.2.2 — Visual & UI Noise Removal
 * langchain/cleaner.ts — Deterministic boilerplate + visual noise stripper.
 *
 * Stage 4.2.2 additions on top of 4.2.1:
 *  - Markdown image removal  (![alt](url) → deleted)
 *  - Logo / asset filename detection and removal
 *  - Decorative image alt-text removal
 *  - Expanded homepage marketing / UI boilerplate patterns
 *  - Blank-line collapsing after visual element removal
 *  - Per-category removal counters for the optimization report
 *
 * Invariants:
 *  - Normal markdown hyperlinks ([text](url)) are ALWAYS preserved
 *  - Legitimate opportunity content is NEVER removed
 *  - No LLM, no external calls — 100% deterministic
 */

import { Document } from '@langchain/core/documents';
import { ScoutDocument } from './loader';

// ─── 1. Markdown Image Removal ────────────────────────────────────────────────

/**
 * Matches markdown images: ![any alt text](any url or path)
 * Does NOT match plain hyperlinks: [text](url)  ← the leading ! distinguishes them.
 */
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\([^)]*\)/g;

/**
 * Strip all markdown images from a line.
 * Returns the cleaned line and the number of images removed.
 */
function stripMarkdownImages(line: string): { cleaned: string; removed: number } {
  let removed = 0;
  const cleaned = line.replace(MARKDOWN_IMAGE_REGEX, () => {
    removed++;
    return '';
  });
  return { cleaned, removed };
}

// ─── 2. Logo / Asset Filename Detection ──────────────────────────────────────

/**
 * Patterns that indicate a line is a standalone asset filename or branding artifact
 * with no semantic opportunity content.
 *
 * Matched against the trimmed line (not lower-cased, to catch mixed-case filenames).
 */
const LOGO_ASSET_PATTERNS: RegExp[] = [
  // Explicit image file extensions standing alone
  /^[\w\s\-_.]+\.(svg|png|jpg|jpeg|gif|webp|ico|bmp|avif)$/i,

  // Common asset naming conventions (kebab-case, snake_case with numbers)
  /^(logo|icon|banner|hero|frame|asset|image|img|brand|graphic|illustration|thumbnail|avatar|favicon|sprite|placeholder)[-_\s]?[\w\d\-_.]*$/i,

  // RGB / colour suffix branding artifacts  e.g. GeorgiaTech_RGB, MIT_Blue
  /^[\w]+([-_])(rgb|cmyk|white|black|dark|light|color|colour|blue|red|green|gold|primary|secondary)[\w\d\-_.]*$/i,

  // Frame / numbered asset patterns  e.g. Frame-77, Asset-12, Layer-3
  /^(frame|asset|layer|group|vector|path|rect|circle|component)[-_\s]?\d+$/i,

  // Arrow / chevron / decoration filenames
  /^(icon|arrow|chevron|caret|bullet|dot|dash|line|divider|separator|star|check|cross|plus|minus)[-_][\w\d\-_.]*$/i,
];

function isLogoAssetLine(trimmed: string): boolean {
  return LOGO_ASSET_PATTERNS.some((re) => re.test(trimmed));
}

// ─── 3. Decorative Image Alt Text ────────────────────────────────────────────

/**
 * Lines that consist entirely of decorative image alt descriptions.
 * These appear when Firecrawl or Jina emits the alt text as standalone text
 * after stripping image markdown syntax.
 */
const DECORATIVE_ALT_TEXT_PATTERNS: RegExp[] = [
  /^(previous\s+)?(scholarship|fellowship|grant|program|opportunity)\s+winner[s]?$/i,
  /^hero\s*(image|banner|photo|graphic|illustration)?$/i,
  /^(student|candidate|applicant|person|people|team|group)\s*(smiling|studying|working|learning|sitting|standing|collaborating)?$/i,
  /^banner\s*(image|photo|graphic)?$/i,
  /^(decorative|illustration|graphic|visual|artwork|photo|photograph|image|picture)$/i,
  /^(company|organization|university|school|institute|program)\s*(logo|brand|icon|mark|symbol)?$/i,
  /^(partner|sponsor|supporter|collaborator|affiliate)\s*(logo|brand|icon)?$/i,
  /^profile\s*(photo|picture|image|pic|avatar)?$/i,
  /^(background|backdrop|cover|header|footer)\s*(image|photo|graphic)?$/i,
  /^(map|location|venue|campus|office)\s*(image|photo|graphic|illustration)?$/i,
  /^(chart|graph|table|diagram|infographic)\s*(image|photo|graphic)?$/i,
];

function isDecorativeAltText(trimmed: string): boolean {
  return DECORATIVE_ALT_TEXT_PATTERNS.some((re) => re.test(trimmed));
}

// ─── 4. Homepage Marketing / UI Boilerplate ───────────────────────────────────

/**
 * Generic UI / marketing phrases that appear on aggregator homepages and
 * opportunity listing hubs. These are removed only when they appear as standalone
 * lines — never when they're part of a longer sentence with opportunity context.
 *
 * CRITICAL: Do NOT add patterns that could match legitimate opportunity text
 * such as "Apply Now", "Official Website", "Registration Link", "Eligibility",
 * "Benefits", "Deadline". These must always be preserved.
 */
const UI_BOILERPLATE_LINE_PATTERNS: RegExp[] = [
  // Generic CTA / button labels (exact line match only — see regex anchors)
  /^join\s*(today|now|us|free)?$/i,
  /^get\s*started\s*(today|now|free)?$/i,
  /^see\s*(more|all|less)$/i,
  /^learn\s*more$/i,
  /^read\s*more$/i,
  /^show\s*more$/i,
  /^view\s*(all|more|details)?$/i,
  /^load\s*more$/i,
  /^explore\s*(more|now)?$/i,
  /^discover\s*(more|now)?$/i,
  /^continue\s*(reading)?$/i,
  /^click\s*here$/i,
  /^find\s*out\s*more$/i,

  // Auth / account UI
  /^(log\s*in|sign\s*in|sign\s*up|log\s*out|sign\s*out)$/i,
  /^create\s*(an?\s*)?account$/i,
  /^forgot\s*(your\s*)?password$/i,
  /^remember\s*me$/i,

  // Loading / spinner states
  /^loading\.{0,3}$/i,
  /^please\s*wait\.{0,3}$/i,
  /^calculating\s*(your\s*)?(matches|profile|results|score)\.{0,3}$/i,
  /^checking\s*(your\s*)?(profile|matches|eligibility)\.{0,3}$/i,
  /^fetching\s*(results|data|matches)\.{0,3}$/i,
  /^processing\.{0,3}$/i,

  // Pricing / marketing trust signals
  /^(100%\s*)?(completely\s*)?free(\s*forever|\s*to\s*use|\s*to\s*join)?$/i,
  /^no\s*(credit\s*card|payment|cost)\s*(required|needed)?$/i,
  /^trusted\s*(by\s*)?(millions|thousands|students|users|applicants)?$/i,
  /^verified\s*(opportunities|listings|scholarships)?$/i,
  /^rated\s*[\d.]+\s*(stars?|\/5|out\s*of\s*5)?$/i,

  // Newsletter / subscription (extending 4.2.1 rules)
  /^(subscribe|get updates?|stay\s*updated?|get\s*notified?)$/i,
  /^(unsubscribe|opt\s*out)$/i,
  /^notifications?\s*(on|off|settings?)?$/i,

  // Social proof one-liners
  /^\d+[k+]?\s*(students|users|applicants|members|subscribers|followers)\s*(enrolled|joined|trust\s*us|signed\s*up)?$/i,
  /^over\s*\d+[k+]?\s*(scholarships?|opportunities?|listings?|jobs?)\s*(available|listed)?$/i,

  // UI chrome
  /^(dark|light)\s*(mode|theme)$/i,
  /^(menu|close|open|expand|collapse|toggle)\s*(menu|sidebar|nav)?$/i,
  /^search\.{0,3}$/i,
  /^filter[s]?$/i,
  /^sort\s*(by)?$/i,
  /^(previous|next)\s*(page)?$/i,
  /^\d+\s*of\s*\d+\s*(results?|pages?|items?)?$/i,

  // Cookie / GDPR (additional granular catches on top of 4.2.1)
  /^(accept|reject|decline)\s*(all\s*)?(cookies?|tracking)?$/i,
  /^cookie\s*(preferences?|settings?|consent)$/i,
  /^manage\s*(cookies?|preferences?|consent)$/i,
];

function isUIBoilerplateLine(trimmed: string): boolean {
  return UI_BOILERPLATE_LINE_PATTERNS.some((re) => re.test(trimmed));
}

// ─── 5. Legacy Boilerplate (carried from 4.2.1) ───────────────────────────────

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

const BOILERPLATE_PARAGRAPH_PATTERNS: RegExp[] = [
  /related (posts?|articles?|content|reads?)/i,
  /recommended (for you|articles?|posts?)/i,
  /you may also like/i,
  /more (from|by) (this|the) author/i,
  /advertisement/i,
  /sponsored content/i,
];

// ─── Cleaner Result ───────────────────────────────────────────────────────────

export interface CleanerResult {
  doc: Document;
  cleaningLatencyMs: number;
  charsRemoved: number;
  /** Number of markdown images removed (![alt](url)) */
  visualElementsRemoved: number;
  /** Number of standalone logo/asset filename lines removed */
  logoAssetsRemoved: number;
  /** Number of UI/marketing boilerplate lines removed */
  uiBoilerplateRemoved: number;
}

// ─── Main Cleaner ─────────────────────────────────────────────────────────────

/**
 * Strips visual noise, boilerplate lines, and duplicate paragraphs from a LangChain Document.
 *
 * Pass order (applied per line, then per paragraph):
 *  1. Strip inline markdown images (track count)
 *  2. Skip logo/asset filename lines (track count)
 *  3. Skip decorative alt-text lines (counted with logoAssets)
 *  4. Skip UI/marketing boilerplate lines (track count)
 *  5. Skip legacy boilerplate (cookie, privacy, nav, etc.)
 *  6. Collapse consecutive blank lines
 *  7. Deduplicate paragraphs
 *  8. Remove paragraph-level boilerplate blocks
 */
export function cleanDocument(doc: ScoutDocument): CleanerResult {
  const startTime = Date.now();
  const originalLength = doc.pageContent.length;

  let visualElementsRemoved = 0;
  let logoAssetsRemoved = 0;
  let uiBoilerplateRemoved = 0;

  const lines = doc.pageContent.split('\n');
  const cleanedLines: string[] = [];

  for (let line of lines) {
    // ── Step 1: Strip inline markdown images ──────────────────────────────
    const { cleaned: imageStripped, removed: imagesInLine } = stripMarkdownImages(line);
    if (imagesInLine > 0) {
      visualElementsRemoved += imagesInLine;
      line = imageStripped;
    }

    const trimmed = line.trim();

    // ── Collapse consecutive blank lines ──────────────────────────────────
    if (trimmed === '') {
      const lastAdded = cleanedLines[cleanedLines.length - 1];
      if (lastAdded !== undefined && lastAdded.trim() === '') {
        continue; // Drop consecutive blanks
      }
      cleanedLines.push(line);
      continue;
    }

    // ── Step 2: Logo / asset filename lines ───────────────────────────────
    if (isLogoAssetLine(trimmed)) {
      logoAssetsRemoved++;
      continue;
    }

    // ── Step 3: Decorative alt-text lines ────────────────────────────────
    if (isDecorativeAltText(trimmed)) {
      logoAssetsRemoved++;
      continue;
    }

    // ── Step 4: UI / marketing boilerplate ───────────────────────────────
    if (isUIBoilerplateLine(trimmed)) {
      uiBoilerplateRemoved++;
      continue;
    }

    // ── Step 5: Legacy boilerplate ────────────────────────────────────────
    const isLegacyBoilerplate = BOILERPLATE_LINE_PATTERNS.some((p) => p.test(trimmed));
    if (isLegacyBoilerplate) {
      uiBoilerplateRemoved++;
      continue;
    }

    cleanedLines.push(line);
  }

  // ── Paragraph-level: deduplicate + block boilerplate ─────────────────────
  const joined = cleanedLines.join('\n');
  const paragraphs = joined.split(/\n\n+/);
  const seenParagraphs = new Set<string>();
  const cleanedParagraphs: string[] = [];

  for (const para of paragraphs) {
    const normalized = para.trim().toLowerCase().replace(/\s+/g, ' ');

    if (!normalized || normalized.length < 3) continue;
    if (seenParagraphs.has(normalized)) continue;

    const isParagraphBoilerplate = BOILERPLATE_PARAGRAPH_PATTERNS.some((p) => p.test(normalized));
    if (isParagraphBoilerplate) {
      uiBoilerplateRemoved++;
      continue;
    }

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

  return {
    doc: cleanedDoc,
    cleaningLatencyMs,
    charsRemoved,
    visualElementsRemoved,
    logoAssetsRemoved,
    uiBoilerplateRemoved,
  };
}
