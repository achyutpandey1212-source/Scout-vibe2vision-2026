import { z } from 'zod';

export const FirecrawlScrapeMetadataSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    language: z.string().optional(),
    author: z.string().optional(),
    publishedDate: z.string().optional(),
    ogImage: z.string().optional(),
    domain: z.string().optional(),
  })
  .catchall(z.any()); // Support growth of additional key-values

export const FirecrawlScrapeDataSchema = z.object({
  markdown: z.string().min(1, 'Scraped markdown cannot be empty'),
  metadata: FirecrawlScrapeMetadataSchema.default({}),
});

export const FirecrawlScrapeResponseSchema = z.object({
  success: z.boolean(),
  data: FirecrawlScrapeDataSchema,
});
