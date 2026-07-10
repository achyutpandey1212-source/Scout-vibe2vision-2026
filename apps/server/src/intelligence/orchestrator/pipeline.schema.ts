import { z } from 'zod';

export const IntelligencePipelineOptionsSchema = z.object({
  force: z.boolean().default(false),
  batchSize: z.number().int().positive().default(100),
});
