import { z } from 'zod';

export const SingleCareerReportSchema = z.object({
  executiveSummary: z.string().max(500),
  whyScoutPickedThis: z.string().max(950),
  strongestStrengths: z.array(z.string()).max(5),
  missingSkills: z.array(z.string()).max(5),
  resumeImprovements: z.array(z.string()).max(5),
  interviewPrep: z.array(z.string()).max(5),
  applicationConfidence: z.object({
    level: z.string(),
    explanation: z.string().max(380),
  }),
  nextAction: z.string().max(350),
  scoutVerdict: z.object({
    verdict: z.string(),
    explanation: z.string().max(380),
  }),
  personalizedReason: z.string().max(250),
  whyNow: z.string().max(150),
  firstAction: z.string().max(150),
  confidenceMessage: z.string().max(150),
  projectEvidence: z.string().max(300).optional(),
  whyYou: z.string().max(250).optional(),
  whyCompany: z.string().max(250).optional(),

  // New Career Report fields
  strengths: z.array(z.string()).max(5).optional(),
  challenges: z.array(z.string()).max(5).optional(),
  applicationStrategy: z.string().max(500).optional(),
  preparationChecklist: z.array(z.string()).max(6).optional(),
});

export const AIPersonalizationItemSchema = SingleCareerReportSchema;

export const AIPersonalizationResponseSchema = z.object({
  todayMission: z.string().max(120),
  aiSummary: z.string().max(500),
  recommendationsBySlot: z.record(z.string(), AIPersonalizationItemSchema),
});
