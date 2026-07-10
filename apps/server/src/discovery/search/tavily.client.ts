import { env } from '../../config/env';
import { TavilySearchResponseSchema } from './search.schema';
import { z } from 'zod';

export type TavilySearchResult = z.infer<typeof TavilySearchResponseSchema>;

export class TavilyClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.tavily.com/search';

  constructor() {
    this.apiKey = env.TAVILY_API_KEY;
    if (!this.apiKey) {
      throw new Error('Missing TAVILY_API_KEY in environment configuration');
    }
  }

  /**
   * Performs search query using Tavily API.
   */
  async search(query: string, maxResults = 3, timeoutMs = 10000): Promise<TavilySearchResult> {
    const body = {
      api_key: this.apiKey,
      query,
      max_results: maxResults,
      search_depth: 'basic',
      include_answer: false,
      include_images: false,
      include_raw_content: false,
    };

    const maxAttempts = 3; // 1 initial + 2 retries
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
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          const text = await response.text().catch(() => 'No response body');

          // Retry on transient 5xx errors or 429 rate limits
          if (status >= 500 || status === 429) {
            console.warn(
              `[Tavily Client] Transient error (HTTP ${status}) on attempt ${attempt}. Retrying... Details: ${text}`,
            );
            if (attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
              continue;
            }
          }
          throw new Error(`Tavily API responded with HTTP error ${status}: ${text}`);
        }

        const data = await response.json();
        const parseResult = TavilySearchResponseSchema.safeParse(data);
        if (!parseResult.success) {
          throw new Error(`Invalid schema returned by Tavily: ${parseResult.error.message}`);
        }

        return parseResult.data;
      } catch (error: any) {
        clearTimeout(timeoutId);

        const isAbort = error.name === 'AbortError';
        const errorMsg = isAbort ? `Request timed out after ${timeoutMs}ms` : error.message;

        if (attempt < maxAttempts) {
          console.warn(
            `[Tavily Client] Failed attempt ${attempt}/${maxAttempts}: ${errorMsg}. Retrying...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw new Error(
          `Failed to retrieve results from Tavily after ${maxAttempts} attempts. Error: ${errorMsg}`,
        );
      }
    }

    throw new Error('Tavily Client failed to search due to unexpected execution flow');
  }
}
