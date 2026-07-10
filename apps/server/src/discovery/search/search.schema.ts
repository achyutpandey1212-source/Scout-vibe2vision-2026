import { z } from 'zod';

export const TavilySearchOptionsSchema = z.object({
  query: z.string().min(1),
  searchDepth: z.enum(['basic', 'advanced']).default('basic'),
  maxResults: z.number().int().min(1).max(20).default(3),
  includeAnswer: z.boolean().default(false),
  includeImages: z.boolean().default(false),
  includeRawContent: z.boolean().default(false),
});

export const TavilyResultItemSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  content: z.string(), // Snippet content
  score: z.number().optional(), // Relevance score from Tavily
});

export const TavilySearchResponseSchema = z.object({
  results: z.array(TavilyResultItemSchema),
});
