/**
 * Helper utilities for deterministic text processing.
 */

/**
 * Normalizes all whitespace (tabs, newlines, multiple spaces) to a single space, and trims the ends.
 */
export function normalizeWhitespace(text: string): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Removes standard punctuation from text.
 */
export function removePunctuation(text: string): string {
  if (!text) return '';
  return text.replace(new RegExp('[.,/#!$%^&*;:{}=_`~()?"\'-]', 'g'), '');
}

/**
 * Clean text to prepare for comparison: lowercase, normalized whitespace, trimmed.
 */
export function cleanText(text: string): string {
  if (!text) return '';
  return normalizeWhitespace(text.toLowerCase());
}

/**
 * Split text into tokens (lowercase words), omitting empty strings.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const cleaned = cleanText(text);
  return cleaned.split(/\s+/).filter(Boolean);
}

/**
 * Check if the text contains any of the provided keywords (case-insensitive).
 * Supports word-boundary checking to prevent false positives (e.g. "ai" matching "paid").
 */
export function containsAny(text: string, keywords: string[], useWordBoundary = true): boolean {
  if (!text || !keywords || keywords.length === 0) return false;
  const cleanedText = cleanText(text);

  return keywords.some((keyword) => {
    const cleanedKeyword = cleanText(keyword);
    if (!cleanedKeyword) return false;

    if (useWordBoundary) {
      // Escape regex special chars using RegExp constructor to avoid escaping slash in literal
      const escaped = cleanedKeyword.replace(new RegExp('[-\\/\\\\^$*+?.()|[\\]{}]', 'g'), '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(cleanedText);
    }

    return cleanedText.includes(cleanedKeyword);
  });
}
