import { describe, it, expect } from 'vitest';
import { sanitizeAiOutput } from './ai-output-sanitizer';

describe('sanitizeAiOutput (Task 6)', () => {
  it('strips markdown fences', () => {
    const raw = '```json\n{"isOpportunitySource": false, "confidence": 95}\n```';
    expect(sanitizeAiOutput(raw)).toMatchObject({
      isOpportunitySource: false,
      confidence: 95,
    });
  });

  it('normalizes placeholder values (NONE/null/none) to undefined', () => {
    const raw = {
      isOpportunitySource: false,
      confidence: 80,
      reason: 'n/a',
      suggestedCategory: 'NONE',
      suggestedStrategy: 'null',
    };
    const out = sanitizeAiOutput(raw);
    expect(out.reason).toBeUndefined();
    expect(out.suggestedCategory).toBeUndefined();
    expect(out.suggestedStrategy).toBeUndefined();
  });

  it('maps "never" on crawlFrequency to monthly, else undefined', () => {
    const raw = {
      isOpportunitySource: true,
      confidence: 70,
      reason: 'ok',
      suggestedCrawlFrequency: 'never',
      suggestedStrategy: 'never',
    };
    const out = sanitizeAiOutput(raw);
    expect(out.suggestedCrawlFrequency).toBe('monthly');
    expect(out.suggestedStrategy).toBeUndefined();
  });

  it('repairs trailing commas and trims strings', () => {
    const raw =
      '{\n  "isOpportunitySource": false,\n  "confidence": 90,\n  "reason": "  foo  ",\n}';
    const out = sanitizeAiOutput(raw);
    expect(out.reason).toBe('foo');
    expect(out.isOpportunitySource).toBe(false);
  });

  it('normalizes enum casing', () => {
    const raw = {
      isOpportunitySource: true,
      confidence: 60,
      reason: 'x',
      suggestedPriority: 'MEDIUM',
      suggestedCrawlFrequency: 'WEEKLY',
      suggestedStrategy: 'Direct',
    };
    const out = sanitizeAiOutput(raw);
    expect(out.suggestedPriority).toBe('medium');
    expect(out.suggestedCrawlFrequency).toBe('weekly');
    expect(out.suggestedStrategy).toBe('direct');
  });

  it('converts empty strings to undefined', () => {
    const raw = {
      isOpportunitySource: false,
      confidence: 50,
      reason: '',
    };
    const out = sanitizeAiOutput(raw);
    expect(out.reason).toBeUndefined();
  });
});
