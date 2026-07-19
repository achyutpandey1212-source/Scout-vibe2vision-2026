import { z } from 'zod';

export const AIPersonalizationItemSchema = z.object({
  personalizedReason: z.string().max(300),
  missingSkills: z.array(z.string()).max(3),
  firstAction: z.string().max(150),
  confidenceMessage: z.string().max(150),
});

export const AIPersonalizationResponseSchema = z.object({
  todayMission: z.string().max(120),
  aiSummary: z.string().max(500),
  recommendationsBySlot: z.record(z.string(), AIPersonalizationItemSchema),
});
