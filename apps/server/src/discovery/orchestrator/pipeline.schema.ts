import { z } from 'zod';

export const DiscoveryOptionsSchema = z.object({
  skipSearch: z.boolean().optional().default(false),
  skipCrawl: z.boolean().optional().default(false),
  skipExtract: z.boolean().optional().default(false),
});

export const DiscoveryContextSchema = z.object({
  categories: z.array(z.string()).min(1, 'At least one category is required'),
  targetAudience: z.string().min(1, 'Target audience is required'),
  country: z.string().min(1, 'Country is required'),
  maxQueries: z.number().optional(),
});
