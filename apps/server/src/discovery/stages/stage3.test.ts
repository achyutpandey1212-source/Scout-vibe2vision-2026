import { describe, it, expect, vi } from 'vitest';
import { Stage3Extraction } from './stage3';
import { CrawledPage } from './stage2';

describe('Stage 3 Extraction Metrics', () => {
  it('correctly records Skipped Pages and zero Parser Failures when a page is skipped pre-extraction', async () => {
    const stage3 = new Stage3Extraction();

    const failedPage: CrawledPage = {
      url: 'https://failed-page.com/job',
      title: 'Failed Page',
      markdown: '',
      metadata: {},
      fetchMethod: 'firecrawl',
      crawlStatus: 'FAILED',
      crawlTime: 100,
      tokenEstimate: 0,
      source: 'Failed Page',
      crawlReason: 'Direct custom URL',
      failureReason: 'PROVIDER_FAILURE',
    };

    const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});

    const extractions = await stage3.execute([failedPage]);

    expect(extractions).toEqual([]);

    const logOutput = spyLog.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(logOutput).toContain('Skipped Pages:           1');
    expect(logOutput).toContain('Parser Failures:         0');

    spyLog.mockRestore();
  });
});
