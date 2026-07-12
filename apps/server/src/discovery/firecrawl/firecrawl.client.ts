import { env } from '../../config/env';
import { DISCOVERY_CONFIG } from '../config/discovery.config';
import { FirecrawlScrapeResponseSchema } from './extraction.schema';
import { z } from 'zod';

export type FirecrawlScrapeResponse = z.infer<typeof FirecrawlScrapeResponseSchema>;

export class FirecrawlClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.firecrawl.dev/v1/scrape';

  constructor() {
    this.apiKey = env.FIRECRAWL_API_KEY;
    if (!this.apiKey) {
      throw new Error('Missing FIRECRAWL_API_KEY in environment configuration');
    }
  }

  /**
   * Scrapes webpage content using Firecrawl.
   */
  async scrape(url: string): Promise<FirecrawlScrapeResponse> {
    const body = {
      url,
      formats: ['markdown'],
      onlyMainContent: true,
    };

    const maxAttempts = DISCOVERY_CONFIG.FIRECRAWL_RETRIES + 1;
    const timeoutMs = DISCOVERY_CONFIG.FIRECRAWL_TIMEOUT;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          const text = await response.text().catch(() => 'No body content');

          if (status === 401) {
            throw new Error(`Firecrawl API responded with HTTP error 401: Unauthorized API Key`);
          }

          if (status >= 500 || status === 429) {
            console.warn(
              `[Firecrawl Client] Transient error (HTTP ${status}) on attempt ${attempt}. Retrying... Details: ${text}`,
            );
            if (attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
              continue;
            }
          }
          throw new Error(`Firecrawl API responded with HTTP error ${status}: ${text}`);
        }

        const data = await response.json();
        const parseResult = FirecrawlScrapeResponseSchema.safeParse(data);
        if (!parseResult.success) {
          throw new Error(`Invalid schema returned by Firecrawl: ${parseResult.error.message}`);
        }

        return parseResult.data;
      } catch (error: any) {
        clearTimeout(timeoutId);
        const isAbort = error.name === 'AbortError';
        const errorMsg = isAbort ? `Request timed out after ${timeoutMs}ms` : error.message;

        if (attempt < maxAttempts) {
          console.warn(
            `[Firecrawl Client] Failed attempt ${attempt}/${maxAttempts}: ${errorMsg}. Retrying...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw new Error(
          `Failed to crawl page via Firecrawl after ${maxAttempts} attempts. Error: ${errorMsg}`,
        );
      }
    }

    throw new Error('Firecrawl Client failed to scrape due to unexpected execution flow');
  }
}
