import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Stage2Crawling } from './stage2';
import { JobBoardExtractor } from '../query-engine/job-board-extractor';
import { redis } from '../../config/redis';

vi.mock('../../config/redis', () => {
  const getMock = vi.fn().mockResolvedValue(null);
  const setexMock = vi.fn().mockResolvedValue('OK');
  return {
    redis: {
      getClient: () => ({
        get: getMock,
        setex: setexMock,
      }),
    },
  };
});

vi.mock('../firecrawl/firecrawl.client', () => {
  return {
    FirecrawlClient: class {
      scrape = vi.fn().mockResolvedValue({
        data: {
          markdown: `
            [Job Opportunity 1](https://www.indeed.com/rc/clk?jk=job1)
            [Job Opportunity 2](https://www.indeed.com/rc/clk?jk=job2)
            Location: India remote
            Published: July 2026
          `,
          metadata: { title: 'Jobs Search' },
        },
      });
    },
  };
});

describe('Stage2Crawling - Multi-Listing Board Crawler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect a board page, harvest listings, populate opportunityQueue, and skip AI extraction on the board page', async () => {
    const crawler = new Stage2Crawling();

    // Indeed search page URL to trigger board classification
    const candidates = [
      {
        url: 'https://www.indeed.com/jobs?q=backend&l=remote',
        source: 'Indeed',
        query: 'test',
        snippet: '',
        score: 8,
        discoveredAt: new Date().toISOString(),
      },
    ];

    const results = await crawler.execute(candidates);

    // Assert that the board page itself is marked as SKIPPED to bypass Stage 3 AI extraction
    const boardResult = results.find((r) => r.url.includes('indeed.com/jobs'));
    expect(boardResult).toBeDefined();
    expect(boardResult?.crawlStatus).toBe('SKIPPED');

    // Verify that the individual opportunities from the board were queued
    // and processed immediately in the same crawl session
    const opportunity1Result = results.find((r) => r.url.includes('jk=job1'));
    const opportunity2Result = results.find((r) => r.url.includes('jk=job2'));

    expect(opportunity1Result).toBeDefined();
    expect(opportunity2Result).toBeDefined();

    // Direct opportunities should be crawled successfully (SUCCESS status) so they can proceed to Stage 3
    expect(opportunity1Result?.crawlStatus).toBe('SUCCESS');
    expect(opportunity2Result?.crawlStatus).toBe('SUCCESS');
  });
});
