import { describe, it, expect } from 'vitest';
import { OpportunityDetector } from './opportunity-detector';

describe('Task 4: Opportunity Detector Precision tests', () => {
  it('should reject generic homepage index URLs', () => {
    const res = OpportunityDetector.detect(
      'https://google.com/',
      'Google',
      'Homepage index content.',
    );
    expect(res.shouldExtract).toBe(false);
    expect(res.penalties).toContain('Root homepage or generic index path detected');
  });

  it('should reject static PDF resources', () => {
    const res = OpportunityDetector.detect(
      'https://example.com/reports/scholarship-announcement.pdf',
      'PDF report',
      'Downloadable PDF document.',
    );
    expect(res.shouldExtract).toBe(false);
    expect(res.penalties).toContain('Forbidden static file extension in URL: ".pdf"');
  });

  it('should reject noise paths like category archives', () => {
    const res = OpportunityDetector.detect(
      'https://example.com/blog/category/tech/archive',
      'Blog category archives',
      'Lists of articles.',
    );
    expect(res.shouldExtract).toBe(false);
    expect(res.penalties.some((p) => p.includes('Noise path query pattern matched'))).toBe(true);
  });
});
