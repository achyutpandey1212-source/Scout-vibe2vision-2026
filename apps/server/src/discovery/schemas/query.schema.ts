import { z } from 'zod';

export const PlannedQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Query cannot be empty')
    .transform((str) => str.trim()),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string(),
  tags: z.array(z.string()),
  expectedOpportunityType: z.string(),
});

export const DetailedQueryPlannerOutputSchema = z.object({
  queries: z.array(PlannedQuerySchema),
});

export const SimpleQueryPlannerResponseSchema = z.object({
  queries: z.array(z.string()),
});
