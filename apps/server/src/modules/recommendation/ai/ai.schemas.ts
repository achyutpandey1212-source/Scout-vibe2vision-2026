import { z } from 'zod';

export const AIPersonalizationItemSchema = z.object({
  personalizedReason: z.string().max(300),
  projectEvidence: z.string().max(300).optional(),
  whyYou: z.string().max(250).optional(),
  whyCompany: z.string().max(250).optional(),
  whyNow: z.string().max(200).optional(),
  missingSkills: z.array(z.string()).max(3),
  firstAction: z.string().max(150),
  confidenceMessage: z.string().max(150),
});

export const AIPersonalizationResponseSchema = z.object({
  todayMission: z.string().max(120),
  aiSummary: z.string().max(500),
  recommendationsBySlot: z.record(z.string(), AIPersonalizationItemSchema),
});
