/**
 * Deterministic, dependency-free sanitization + normalization layer for raw AI
 * JSON output, applied BEFORE any Zod validation.
 *
 * Responsibilities (per cleanup Task 6 / Task 2):
 *  - trim strings
 *  - remove markdown fences
 *  - repair trailing commas
 *  - remove JS-style comments
 *  - normalize enum casing
 *  - normalize placeholder values (NONE / none / null / never) to undefined
 *  - convert empty strings to undefined where appropriate
 *
 * No additional AI calls are made here.
 */

import { CrawlFrequency, CrawlStrategy, SourcePriority } from './source-registry.types';

const PLACEHOLDER_VALUES = new Set(['none', 'null', 'undefined', 'n/a', 'na', 'nil', '']);

function isPlaceholder(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value === 'string' && PLACEHOLDER_VALUES.has(value.trim().toLowerCase())) return true;
  return false;
}

const PRIORITY_VALUES: SourcePriority[] = ['critical', 'high', 'medium', 'low'];
const FREQUENCY_VALUES: CrawlFrequency[] = ['daily', 'weekly', 'monthly'];
const STRATEGY_VALUES: CrawlStrategy[] = ['direct', 'search', 'sitemap', 'rss'];

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (typeof value !== 'string') return undefined;
  const lower = value.trim().toLowerCase();
  const match = allowed.find((v) => v.toLowerCase() === lower);
  return match;
}

/**
 * Strip markdown fences, JS comments and trailing commas, then parse JSON.
 * Returns the parsed object (or the original value if it is not a string).
 */
function sanitizeRawJson(text: unknown): any {
  if (typeof text !== 'string') return text;

  let cleaned = text.trim();

  // Remove markdown code fences (```json ... ``` or ``` ... ```)
  if (cleaned.includes('```')) {
    const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    cleaned = fence && fence[1] ? fence[1].trim() : cleaned;
  }

  // Remove single-line and block comments (only outside strings is hard with
  // regex; strip whole-line comments and trailing // comments conservatively).
  cleaned = cleaned
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, ''))
    .join('\n');

  // Repair trailing commas before } or ]
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  // Extract first balanced JSON object if extra prose remains
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    return text;
  }
}

/**
 * Recursively sanitize a parsed AI object:
 *  - trim all string values
 *  - empty strings → undefined
 *  - normalize enum casing for the known opportunity fields
 *  - convert placeholder values (NONE/none/null/...) to undefined
 */
export function sanitizeAiOutput(input: unknown): any {
  const parsed = sanitizeRawJson(input);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return parsed;

  const result: Record<string, any> = {};

  for (const [key, rawValue] of Object.entries(parsed)) {
    let targetKey = key;
    if (key === 'category') targetKey = 'suggestedCategory';
    else if (key === 'trustScore') targetKey = 'suggestedTrustScore';
    else if (key === 'priority') targetKey = 'suggestedPriority';
    else if (key === 'crawlFrequency') targetKey = 'suggestedCrawlFrequency';
    else if (key === 'strategy') targetKey = 'suggestedStrategy';

    let value = rawValue;

    if (typeof value === 'string') {
      value = value.trim();
      if (value === '') {
        result[targetKey] = undefined;
        continue;
      }
      // Normalize enum-cased fields where applicable
      if (targetKey === 'suggestedPriority') value = normalizeEnum(value, PRIORITY_VALUES) ?? value;
      else if (targetKey === 'suggestedCrawlFrequency')
        value = normalizeEnum(value, FREQUENCY_VALUES) ?? value;
      else if (targetKey === 'suggestedStrategy')
        value = normalizeEnum(value, STRATEGY_VALUES) ?? value;
    }

    // Placeholder normalization → undefined
    if (isPlaceholder(value)) {
      result[targetKey] = undefined;
      continue;
    }

    // "never" specifically → monthly (valid enum) unless field is not required
    if (typeof value === 'string' && value.trim().toLowerCase() === 'never') {
      result[targetKey] = targetKey === 'suggestedCrawlFrequency' ? 'monthly' : undefined;
      continue;
    }

    result[targetKey] = value;
  }

  return result;
}
