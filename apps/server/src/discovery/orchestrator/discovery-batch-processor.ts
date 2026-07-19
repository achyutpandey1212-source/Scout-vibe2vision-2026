import { Stage1Discovery, CandidateURL } from '../stages/stage1';
import { Stage2Crawling, CrawledPage } from '../stages/stage2';
import { Stage3Extraction } from '../stages/stage3';
import { Stage4QualityAcceptance } from '../stages/stage4';
import { Stage5Persistence } from '../stages/stage5';
import { ISourceRegistryEntry } from '../sources/source-registry.types';
import { DiscoveryContext } from '../types/query.types';
import { DiscoveryOptions } from './pipeline.types';
import { sourceRegistryService } from '../sources/source-registry.service';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { RawPageModel } from '../firecrawl/raw-page.model';
import crypto from 'crypto';

export interface BatchProcessorOptions {
  batchNumber: number;
  totalBatches: number;
  sources: ISourceRegistryEntry[];
  context: DiscoveryContext;
  options?: DiscoveryOptions;
}

export interface BatchMetrics {
  batchNumber: number;
  sourcesCount: number;
  urlsFound: number;
  pagesCrawled: number;
  extractedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  reviewCount: number;
  duplicateCount: number;
  savedCount: number;
  durationMs: number;
}

function extractDomain(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    return host;
  } catch {
    return null;
  }
}

/**
 * DiscoveryBatchProcessor
 *
 * Thin orchestrator coordinating existing pipeline stages (Stage 1 to Stage 5)
 * for a single batch of sources without absorbing their business logic.
 */
export class DiscoveryBatchProcessor {
  private candidates: CandidateURL[] = [];
  private crawledPages: CrawledPage[] = [];
  private evaluatedOpps: any[] = [];

  async processBatch(params: BatchProcessorOptions): Promise<BatchMetrics> {
    const { batchNumber, totalBatches, sources, context, options } = params;
    const startTime = Date.now();

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Batch Controller] Starting Batch ${batchNumber}/${totalBatches} (${sources.length} Sources)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    let acceptedCount = 0;
    let rejectedCount = 0;
    let reviewCount = 0;
    let savedCount = 0;
    let duplicateCount = 0;
    let extractedCount = 0;

    try {
      // Stage 1: Candidate Resolution for Batch Sources
      const stage1 = new Stage1Discovery();
      this.candidates = await stage1.executeForSources(sources, context);

      // Stage 2: Concurrent Crawl
      const stage2 = new Stage2Crawling();
      this.crawledPages = await stage2.execute(this.candidates, {
        maxExtractions: (options as any)?.maxExtractions || 15,
      });

      // Raw Page Persistence Audit
      await this.persistRawPagesCompatibility(this.crawledPages);

      // Stage 3: Concurrent AI Extraction
      const stage3 = new Stage3Extraction();
      const extractions = await stage3.execute(this.crawledPages, options);
      extractedCount = extractions.length;

      // Stage 4: Concurrent Quality & Acceptance
      const stage4 = new Stage4QualityAcceptance();
      this.evaluatedOpps = await stage4.execute(extractions, options);

      acceptedCount = this.evaluatedOpps.filter((o) => o.decision === 'ACCEPT').length;
      rejectedCount = this.evaluatedOpps.filter((o) => o.decision === 'REJECT').length;
      reviewCount = this.evaluatedOpps.filter((o) => o.decision === 'REVIEW').length;

      // Stage 5: Deduplicate & Persist Batch
      const stage5 = new Stage5Persistence();
      const runResult = await stage5.execute(this.evaluatedOpps, {
        startedAt: new Date(startTime),
        urlsFound: this.candidates.length,
        crawledPagesCount: this.crawledPages.length,
        crawledPages: this.crawledPages,
        detectorSkipped: DashboardStateInstance.getState().detectorSkipped,
        aiProcessed: DashboardStateInstance.getState().aiProcessed,
        geminiCalls: 0,
        groqCalls: 0,
        cacheHits: this.crawledPages.filter((p) => p.fetchMethod === 'cache').length,
        MERGE_THRESHOLD: 95,
        REVIEW_THRESHOLD: 80,
      });

      savedCount = (runResult.insertedCount || 0) + (runResult.updatedCount || 0);
      duplicateCount = runResult.archivedCount || 0;
    } finally {
      // Immediate Registry Updates per batch (markCrawled / markFailed)
      await this.updateDomainCrawlStates(
        sources,
        this.candidates,
        this.crawledPages,
        this.evaluatedOpps,
      );
    }

    const durationMs = Date.now() - startTime;
    const batchMetrics: BatchMetrics = {
      batchNumber,
      sourcesCount: sources.length,
      urlsFound: this.candidates.length,
      pagesCrawled: this.crawledPages.length,
      extractedCount,
      acceptedCount,
      rejectedCount,
      reviewCount,
      duplicateCount,
      savedCount,
      durationMs,
    };

    // Concise Batch Log Summary
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Batch ${batchNumber} / ${totalBatches}

Sources:      ${batchMetrics.sourcesCount}
Accepted:     ${batchMetrics.acceptedCount}
Rejected:     ${batchMetrics.rejectedCount}
Duplicates:   ${batchMetrics.duplicateCount}
Saved:        ${batchMetrics.savedCount}
Duration:     ${(durationMs / 1000).toFixed(1)} s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Emit progress event
    DashboardStateInstance.updateState({
      crawlCompleted: batchNumber,
      pagesCrawled: DashboardStateInstance.getState().pagesCrawled + this.crawledPages.length,
      aiProcessed: DashboardStateInstance.getState().aiProcessed + extractedCount,
      inserted: DashboardStateInstance.getState().inserted + savedCount,
    });

    return batchMetrics;
  }

  /**
   * Explicit memory cleanup after batch processing completes.
   */
  clear(): void {
    this.candidates = [];
    this.crawledPages = [];
    this.evaluatedOpps = [];
  }

  private async updateDomainCrawlStates(
    sources: ISourceRegistryEntry[],
    candidates: CandidateURL[],
    crawledPages: CrawledPage[],
    evaluatedOpps: any[],
  ): Promise<void> {
    const domainMap = new Map<string, { pages: CrawledPage[]; oppsCount: number }>();

    for (const s of sources) {
      const cleanDom = s.domain.toLowerCase().trim();
      domainMap.set(cleanDom, { pages: [], oppsCount: 0 });
    }

    for (const page of crawledPages) {
      const dom = extractDomain(page.url);
      if (!dom) continue;
      const cleanDom = dom.toLowerCase().trim();
      if (domainMap.has(cleanDom)) {
        domainMap.get(cleanDom)!.pages.push(page);
      }
    }

    for (const opp of evaluatedOpps) {
      const dom = extractDomain(opp.opportunityUrl || opp.sourceUrl || '');
      if (!dom) continue;
      const cleanDom = dom.toLowerCase().trim();
      if (domainMap.has(cleanDom)) {
        domainMap.get(cleanDom)!.oppsCount++;
      }
    }

    for (const [dom, data] of domainMap.entries()) {
      const hasSuccessfulPage = data.pages.some((p) => p.crawlStatus === 'SUCCESS');
      if (hasSuccessfulPage || data.pages.length > 0) {
        await sourceRegistryService.markCrawled(dom, {
          pagesCrawled: data.pages.length,
          opportunitiesFound: data.oppsCount,
        });
      } else {
        await sourceRegistryService.markFailed(dom);
      }
    }
  }

  private async persistRawPagesCompatibility(crawledPages: CrawledPage[]): Promise<void> {
    for (const page of crawledPages) {
      if (page.crawlStatus === 'SUCCESS') {
        try {
          const hash = crypto.createHash('sha256').update(page.markdown).digest('hex');
          await RawPageModel.findOneAndUpdate(
            { url: page.url },
            {
              url: page.url,
              title: page.title,
              markdown: page.markdown,
              metadata: page.metadata,
              crawledAt: new Date(),
              hash,
            },
            { upsert: true, new: true },
          );
        } catch (dbErr: any) {
          console.error(
            `[DB Error] Failed to persist legacy RawPage for ${page.url}:`,
            dbErr.message,
          );
        }
      }
    }
  }
}
