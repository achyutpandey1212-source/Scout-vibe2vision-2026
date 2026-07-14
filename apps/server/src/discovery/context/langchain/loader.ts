/**
 * Stage 4.2 — Context Optimization Layer
 * langchain/loader.ts — Converts a CrawledPage into a LangChain Document.
 *
 * Uses @langchain/core/documents — the only LangChain import in the entire
 * context module. No chains, agents, retrievers, or vector stores.
 *
 * Responsibilities:
 *  - Preserve metadata (URL, title, domain, timing)
 *  - No business logic
 *  - Pure data transformation
 */

import { Document } from '@langchain/core/documents';
import { CrawledPage } from '../../stages/stage2';

export type ScoutDocument = Document<{
  url: string;
  title: string;
  domain: string;
  crawlTime: number;
  fetchMethod: string;
  crawlReason: string;
}>;

/**
 * Converts a CrawledPage (with its content pre-cleaned by the chosen provider)
 * into a LangChain Document carrying full crawl metadata.
 */
export function loadDocument(page: CrawledPage, providerContent: string): ScoutDocument {
  return new Document({
    pageContent: providerContent,
    metadata: {
      url: page.url,
      title: page.title,
      domain: new URL(page.url).hostname,
      crawlTime: page.crawlTime,
      fetchMethod: page.fetchMethod,
      crawlReason: page.crawlReason,
    },
  });
}
