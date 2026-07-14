/**
 * Stage 4.2.1 — Context Optimization Layer (Final Iteration)
 * Unit tests for: cleaner, chunker (3-tier priority), scorer, compressor (staged budget),
 * and the new adaptive routing / budget resolution helpers.
 */

import { describe, it, expect } from 'vitest';
import { Document } from '@langchain/core/documents';
import { cleanDocument } from './langchain/cleaner';
import { chunkDocument } from './langchain/chunker';
import { scoreChunks } from './langchain/scorer';
import { compressChunks } from './langchain/compressor';
import { DEFAULT_OPTIMIZATION_PROFILE, Chunk, classifyPageSize, getPageBudgets } from './metrics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDoc(content: string): Document {
  return new Document({
    pageContent: content,
    metadata: { url: 'https://example.com', title: 'Test' },
  });
}

function makeChunk(overrides: Partial<Chunk>): Chunk {
  return {
    heading: '',
    content: '',
    score: 0,
    startLine: 0,
    endLine: 0,
    priority: 'NORMAL',
    ...overrides,
  };
}

// ─── Cleaner Tests ────────────────────────────────────────────────────────────

describe('cleanDocument', () => {
  it('removes cookie banner lines', () => {
    const doc = makeDoc(
      '## Hello\n\nThis is content.\n\nWe use cookies to improve your experience.\n\nMore content here.',
    );
    const { doc: cleaned } = cleanDocument(doc as any);
    expect(cleaned.pageContent).not.toContain('We use cookies');
    expect(cleaned.pageContent).toContain('More content here');
  });

  it('removes privacy policy lines', () => {
    const doc = makeDoc('## Title\n\nContent.\n\nprivacy policy\n\nMore.');
    const { doc: cleaned } = cleanDocument(doc as any);
    expect(cleaned.pageContent).not.toMatch(/privacy policy/i);
  });

  it('removes "share on Facebook" lines', () => {
    const doc = makeDoc('## Apply\n\nDeadline: Dec 31.\n\nShare on Facebook\n\nMore info.');
    const { doc: cleaned } = cleanDocument(doc as any);
    expect(cleaned.pageContent).not.toContain('Share on Facebook');
    expect(cleaned.pageContent).toContain('Deadline: Dec 31');
  });

  it('removes duplicate paragraphs', () => {
    const para = 'This is an important paragraph about the program.';
    const doc = makeDoc(`${para}\n\n${para}\n\nUnique content here.`);
    const { doc: cleaned } = cleanDocument(doc as any);
    const occurrences = (cleaned.pageContent.match(new RegExp(para, 'g')) || []).length;
    expect(occurrences).toBe(1);
  });

  it('preserves legitimate opportunity content', () => {
    const content =
      '## Eligibility\n\nApplicants must be enrolled in a graduate program.\n\nDeadline: January 15, 2027.';
    const doc = makeDoc(content);
    const { doc: cleaned } = cleanDocument(doc as any);
    expect(cleaned.pageContent).toContain('Eligibility');
    expect(cleaned.pageContent).toContain('graduate program');
    expect(cleaned.pageContent).toContain('Deadline');
  });

  it('collapses consecutive blank lines', () => {
    const doc = makeDoc('Line 1\n\n\n\nLine 2');
    const { doc: cleaned } = cleanDocument(doc as any);
    expect(cleaned.pageContent).not.toMatch(/\n{3,}/);
  });

  it('returns cleaningLatencyMs as a non-negative number', () => {
    const doc = makeDoc('Short content.');
    const { cleaningLatencyMs } = cleanDocument(doc as any);
    expect(cleaningLatencyMs).toBeGreaterThanOrEqual(0);
  });
});

// ─── Chunker Tests (three-tier priority) ─────────────────────────────────────

describe('chunkDocument', () => {
  it('splits on H2 headings', () => {
    const doc = makeDoc('## Section A\n\nContent A.\n\n## Section B\n\nContent B.');
    const chunks = chunkDocument(doc as any);
    expect(chunks.length).toBe(2);
    expect(chunks[0].heading).toBe('Section A');
    expect(chunks[1].heading).toBe('Section B');
  });

  it('marks eligibility sections as HIGH priority', () => {
    const doc = makeDoc('## Eligibility Criteria\n\nMust be 18 or older.');
    const chunks = chunkDocument(doc as any);
    expect(chunks[0].priority).toBe('HIGH');
  });

  it('marks deadline sections as HIGH priority', () => {
    const doc = makeDoc('## Application Deadline\n\nJanuary 31, 2027.');
    const chunks = chunkDocument(doc as any);
    expect(chunks[0].priority).toBe('HIGH');
  });

  it('marks stipend sections as HIGH priority', () => {
    const doc = makeDoc('## Stipend and Benefits\n\n$2000/month.');
    const chunks = chunkDocument(doc as any);
    expect(chunks[0].priority).toBe('HIGH');
  });

  it('marks "Important Dates" sections as HIGH priority', () => {
    const doc = makeDoc('## Important Dates\n\nOpening: Jan 1. Closing: Mar 1.');
    const chunks = chunkDocument(doc as any);
    expect(chunks[0].priority).toBe('HIGH');
  });

  it('marks "Who Can Apply" sections as HIGH priority', () => {
    const doc = makeDoc('## Who Can Apply\n\nOpen to students worldwide.');
    const chunks = chunkDocument(doc as any);
    expect(chunks[0].priority).toBe('HIGH');
  });

  it('marks generic org sections as NORMAL priority', () => {
    const doc = makeDoc('## About the Organization\n\nWe are a nonprofit.');
    const chunks = chunkDocument(doc as any);
    expect(chunks[0].priority).toBe('NORMAL');
  });

  // Stage 4.2.1: LOW priority classification
  it('marks "Related Articles" sections as LOW priority', () => {
    const doc = makeDoc('## Related Articles\n\nSee also: fellowship guide.');
    const chunks = chunkDocument(doc as any);
    expect(chunks[0].priority).toBe('LOW');
  });

  it('marks "Newsletter" sections as LOW priority', () => {
    const doc = makeDoc('## Newsletter\n\nSubscribe to get updates.');
    const chunks = chunkDocument(doc as any);
    expect(chunks[0].priority).toBe('LOW');
  });

  it('marks "Cookie Policy" sections as LOW priority', () => {
    const doc = makeDoc('## Cookie Policy\n\nWe use cookies.');
    const chunks = chunkDocument(doc as any);
    expect(chunks[0].priority).toBe('LOW');
  });

  it('returns a single chunk when there are no headings', () => {
    const doc = makeDoc('Some plain text with no headings at all.');
    const chunks = chunkDocument(doc as any);
    expect(chunks.length).toBe(1);
    expect(chunks[0].heading).toBe('');
  });

  it('preserves startLine and endLine metadata', () => {
    const doc = makeDoc('## Section A\n\nLine 2\nLine 3\n\n## Section B\n\nLine 6');
    const chunks = chunkDocument(doc as any);
    expect(chunks[0].startLine).toBe(0);
    expect(chunks[1].startLine).toBeGreaterThan(chunks[0].startLine);
  });

  it('returns empty array for empty document', () => {
    const doc = makeDoc('');
    const chunks = chunkDocument(doc as any);
    expect(chunks.length).toBe(0);
  });
});

// ─── Scorer Tests ─────────────────────────────────────────────────────────────

describe('scoreChunks', () => {
  it('assigns higher score to chunks with more opportunity keywords', () => {
    const chunks = [
      makeChunk({
        heading: 'How to Apply',
        content:
          'Submit your application before the deadline. Eligibility: undergraduate students. Stipend provided.',
        priority: 'HIGH',
      }),
      makeChunk({
        heading: 'About Us',
        content: 'We are a research institute founded in 1990.',
        priority: 'NORMAL',
      }),
    ];
    const scored = scoreChunks(chunks);
    expect(scored[0].score).toBeGreaterThan(scored[1].score);
  });

  it('gives HIGH priority chunks a score advantage via base bonus', () => {
    const chunks = [
      makeChunk({ heading: 'Deadline', content: 'Apply now.', priority: 'HIGH' }),
      makeChunk({ heading: 'Contact', content: 'Apply now.', priority: 'NORMAL' }),
    ];
    const scored = scoreChunks(chunks);
    expect(scored[0].score).toBeGreaterThan(scored[1].score);
  });

  it('returns scores in range [0, 100]', () => {
    const chunks = [
      makeChunk({
        content:
          'apply application deadline eligibility fellowship scholarship hackathon prize stipend salary selection benefits qualification registration grant'.repeat(
            5,
          ),
        priority: 'HIGH',
      }),
    ];
    const scored = scoreChunks(chunks);
    expect(scored[0].score).toBeGreaterThanOrEqual(0);
    expect(scored[0].score).toBeLessThanOrEqual(100);
  });

  it('does not mutate input chunks', () => {
    const chunk = makeChunk({ heading: 'Test', content: 'Apply here.', score: 0 });
    scoreChunks([chunk]);
    expect(chunk.score).toBe(0);
  });
});

// ─── Compressor Tests (staged budget) ────────────────────────────────────────

describe('compressChunks', () => {
  it('respects maxChars budget', () => {
    const chunks: Chunk[] = Array.from({ length: 10 }, (_, i) =>
      makeChunk({
        heading: `Section ${i}`,
        content: 'x'.repeat(2000),
        score: 50,
        priority: 'NORMAL',
      }),
    );
    const profile = { ...DEFAULT_OPTIMIZATION_PROFILE, maxChars: 5000, maxNormalChunks: 10 };
    const result = compressChunks(chunks, profile);
    expect(result.content.length).toBeLessThanOrEqual(5200); // slight tolerance for heading text
  });

  // Stage 4.2.1: staged budget — HIGH always first
  it('always retains HIGH chunks before NORMAL when preserveCriticalSections=true', () => {
    const highChunk = makeChunk({
      heading: 'Eligibility',
      content: 'Must be enrolled.',
      score: 10,
      priority: 'HIGH',
    });
    const normalChunk = makeChunk({
      heading: 'About',
      content: 'x'.repeat(11000),
      score: 90,
      priority: 'NORMAL',
    });
    const profile = { ...DEFAULT_OPTIMIZATION_PROFILE, maxChars: 12000 };
    const result = compressChunks([highChunk, normalChunk], profile);
    expect(result.content).toContain('Eligibility');
    expect(result.highChunksRetained).toBe(1);
  });

  // Stage 4.2.1: LOW chunks discarded by default
  it('discards LOW priority chunks when maxLowChunks=0', () => {
    const chunks = [
      makeChunk({
        heading: 'Eligibility',
        content: 'Must apply by Jan.',
        score: 80,
        priority: 'HIGH',
      }),
      makeChunk({
        heading: 'Related Articles',
        content: 'See other scholarships.',
        score: 30,
        priority: 'LOW',
      }),
    ];
    const profile = { ...DEFAULT_OPTIMIZATION_PROFILE, maxChars: 12000 };
    const result = compressChunks(chunks, profile);
    expect(result.content).not.toContain('Related Articles');
    expect(result.lowChunksDiscarded).toBe(1);
  });

  it('retains LOW chunks when maxLowChunks > 0', () => {
    const chunks = [
      makeChunk({ heading: 'Eligibility', content: 'Criteria.', score: 80, priority: 'HIGH' }),
      makeChunk({ heading: 'Tags', content: 'fellowship scholarship', score: 5, priority: 'LOW' }),
    ];
    const profile = { ...DEFAULT_OPTIMIZATION_PROFILE, maxChars: 12000, maxLowChunks: 1 };
    const result = compressChunks(chunks, profile);
    expect(result.content).toContain('Tags');
    expect(result.lowChunksDiscarded).toBe(0);
  });

  it('caps HIGH chunks at maxHighChunks', () => {
    const chunks: Chunk[] = Array.from({ length: 10 }, (_, i) =>
      makeChunk({
        heading: `Eligibility ${i}`,
        content: 'Criteria.',
        score: 80,
        priority: 'HIGH',
        startLine: i * 5,
      }),
    );
    const profile = { ...DEFAULT_OPTIMIZATION_PROFILE, maxChars: 100000, maxHighChunks: 3 };
    const result = compressChunks(chunks, profile);
    expect(result.highChunksRetained).toBeLessThanOrEqual(3);
  });

  it('caps NORMAL chunks at maxNormalChunks', () => {
    const chunks: Chunk[] = Array.from({ length: 10 }, (_, i) =>
      makeChunk({
        heading: `Section ${i}`,
        content: 'Content.',
        score: 50,
        priority: 'NORMAL',
        startLine: i * 5,
      }),
    );
    const profile = { ...DEFAULT_OPTIMIZATION_PROFILE, maxChars: 100000, maxNormalChunks: 2 };
    const result = compressChunks(chunks, profile);
    expect(result.normalChunksRetained).toBeLessThanOrEqual(2);
  });

  it('reconstructs chunks in original document order (by startLine)', () => {
    const chunks: Chunk[] = [
      makeChunk({
        heading: 'B Section',
        content: 'B content',
        score: 90,
        startLine: 10,
        priority: 'NORMAL',
      }),
      makeChunk({
        heading: 'A Section',
        content: 'A content',
        score: 10,
        startLine: 0,
        priority: 'NORMAL',
      }),
    ];
    const result = compressChunks(chunks, DEFAULT_OPTIMIZATION_PROFILE);
    const aPos = result.content.indexOf('A Section');
    const bPos = result.content.indexOf('B Section');
    expect(aPos).toBeLessThan(bPos);
  });

  it('returns empty string for empty chunk array', () => {
    const result = compressChunks([], DEFAULT_OPTIMIZATION_PROFILE);
    expect(result.content).toBe('');
    expect(result.chunksGenerated).toBe(0);
    expect(result.chunksRetained).toBe(0);
  });

  it('reports correct counts', () => {
    const chunks: Chunk[] = [
      makeChunk({ heading: 'Eligibility', content: 'Criteria.', priority: 'HIGH', startLine: 0 }),
      makeChunk({ heading: 'About', content: 'Info.', priority: 'NORMAL', startLine: 5 }),
      makeChunk({ heading: 'Newsletter', content: 'Subscribe.', priority: 'LOW', startLine: 10 }),
    ];
    const profile = {
      ...DEFAULT_OPTIMIZATION_PROFILE,
      maxChars: 10000,
      maxHighChunks: 6,
      maxNormalChunks: 3,
      maxLowChunks: 0,
    };
    const result = compressChunks(chunks, profile);
    expect(result.chunksGenerated).toBe(3);
    expect(result.highChunksRetained).toBe(1);
    expect(result.normalChunksRetained).toBe(1);
    expect(result.lowChunksDiscarded).toBe(1);
  });
});

// ─── Adaptive Budget Tests ────────────────────────────────────────────────────

describe('classifyPageSize', () => {
  it('classifies pages under 5000 chars as SMALL', () => {
    expect(classifyPageSize(4999)).toBe('SMALL');
    expect(classifyPageSize(100)).toBe('SMALL');
  });

  it('classifies pages 5000–11999 chars as MEDIUM', () => {
    expect(classifyPageSize(5000)).toBe('MEDIUM');
    expect(classifyPageSize(11999)).toBe('MEDIUM');
  });

  it('classifies pages 12000–24999 chars as LARGE', () => {
    expect(classifyPageSize(12000)).toBe('LARGE');
    expect(classifyPageSize(24999)).toBe('LARGE');
  });

  it('classifies pages >= 25000 chars as HUGE', () => {
    expect(classifyPageSize(25000)).toBe('HUGE');
    expect(classifyPageSize(100000)).toBe('HUGE');
  });
});

describe('getPageBudgets', () => {
  it('returns default budgets when env vars are not set', () => {
    const budgets = getPageBudgets();
    expect(budgets.SMALL).toBe(3500);
    expect(budgets.MEDIUM).toBe(5000);
    expect(budgets.LARGE).toBe(7000);
    expect(budgets.HUGE).toBe(9000);
  });
});
