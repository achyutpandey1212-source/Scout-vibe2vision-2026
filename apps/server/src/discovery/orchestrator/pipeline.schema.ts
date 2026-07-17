import { z } from 'zod';
import { SourceCategory, ACTIVE_SOURCE_CATEGORIES } from '@scout/shared';

export const DiscoveryOptionsSchema = z.object({
  skipSearch: z.boolean().optional().default(false),
  skipCrawl: z.boolean().optional().default(false),
  skipExtract: z.boolean().optional().default(false),
});

export const DiscoveryContextSchema = z.object({
  categories: z
    .array(z.enum(ACTIVE_SOURCE_CATEGORIES as [SourceCategory, ...SourceCategory[]]))
    .min(1, 'At least one category is required'),
  targetAudience: z.literal('UNDERGRAD_ENGINEERING_STUDENTS'),
  country: z.string().min(1, 'Country is required'),
  maxQueries: z.number().optional(),
});
