import { z } from 'zod';

export const OpportunityTypeSchema = z.enum([
  'JOB',
  'INTERNSHIP',
  'SCHOLARSHIP',
  'FELLOWSHIP',
  'GRANT',
  'FREELANCE',
  'COMPETITION',
  'BOOTCAMP',
  'COURSE',
  'VOLUNTEER',
  'EVENT',
  'PROGRAM',
  'OTHER',
]);

export const SourceTypeSchema = z.enum([
  'GOVERNMENT',
  'COMPANY',
  'UNIVERSITY',
  'NGO',
  'FOUNDATION',
  'AGGREGATOR',
  'COMMUNITY',
  'OTHER',
]);

export const OpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  summary: z.string().min(1, 'Summary is required'),
  organization: z.string().nullable().default(null),
  opportunityType: OpportunityTypeSchema,
  category: z.string().nullable().default(null),
  country: z.string().nullable().default(null),
  state: z.string().nullable().default(null),
  city: z.string().nullable().default(null),
  remote: z.boolean().default(false),
  applicationUrl: z.string().url('Must be a valid URL').nullable().default(null),
  officialWebsite: z.string().url('Must be a valid URL').nullable().default(null),
  deadline: z.string().nullable().default(null),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  salary: z.number().nullable().default(null),
  stipend: z.number().nullable().default(null),
  currency: z.string().nullable().default(null),
  duration: z.string().nullable().default(null),
  eligibility: z.string().nullable().default(null),
  minimumQualification: z.string().nullable().default(null),
  skills: z.array(z.string()).default([]),
  experienceLevel: z.string().nullable().default(null),
  ageLimit: z.number().nullable().default(null),
  genderEligibility: z.enum(['FEMALE', 'ALL', 'OTHER']).nullable().default(null),
  documentsRequired: z.array(z.string()).default([]),
  selectionProcess: z.string().nullable().default(null),
  benefits: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  sourceURL: z.string().url('Must be a valid URL').nullable().default(null),
  sourceDomain: z.string().nullable().default(null),
  sourceType: SourceTypeSchema,
  confidence: z.number().min(0).max(1).default(0.5),
  intelligence: z
    .object({
      normalizedOrganization: z.string().nullable().default(null),
      normalizedDeadline: z.string().nullable().default(null),
      daysRemaining: z.number().nullable().default(null),
      expired: z.boolean().default(false),
      metadata: z
        .object({
          country: z.string().nullable().default(null),
          state: z.string().nullable().default(null),
          city: z.string().nullable().default(null),
          isGovernment: z.boolean().default(false),
          isRemote: z.boolean().default(false),
          isPaid: z.boolean().default(false),
          hasDeadline: z.boolean().default(false),
          requiresResume: z.boolean().default(false),
          requiresPortfolio: z.boolean().default(false),
          requiresExperience: z.boolean().default(false),
          requiresDegree: z.boolean().default(false),
        })
        .nullable()
        .default(null),
      version: z.string().default('1.0'),
      enriched: z.boolean().default(false),
      lastEnrichedAt: z
        .preprocess((arg) => {
          if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
          return arg;
        }, z.date())
        .nullable()
        .default(null),
      lastProcessedAt: z
        .preprocess((arg) => {
          if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
          return arg;
        }, z.date())
        .nullable()
        .optional()
        .default(null),
      scores: z
        .object({
          trust: z.number().default(0),
          popularity: z.number().default(0),
          hidden: z.number().default(0),
          quality: z.number().default(0),
        })
        .optional(),
      scoreBreakdown: z
        .object({
          trustFactors: z.record(z.string(), z.number()).default({}),
          popularityFactors: z.record(z.string(), z.number()).default({}),
          hiddenFactors: z.record(z.string(), z.number()).default({}),
          qualityFactors: z.record(z.string(), z.number()).default({}),
        })
        .optional(),
    })
    .nullable()
    .optional(),
});
