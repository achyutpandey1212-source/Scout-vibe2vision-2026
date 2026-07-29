import { z } from 'zod';
import { SourceCategory, ACTIVE_SOURCE_CATEGORIES } from '@scout/shared';

export const OpportunityTypeSchema = z.enum([
  'INTERNSHIP',
  'STARTUP_INTERNSHIP',
  'GOVERNMENT_INTERNSHIP',
  'RESEARCH_INTERNSHIP',
  'HACKATHON',
  'COMPETITION',
  'OPEN_SOURCE_PROGRAM',
  'CAMPUS_AMBASSADOR',
  'SCHOLARSHIP',
  'SUMMER_SCHOOL',
  'BOOTCAMP',
  'FELLOWSHIP',
  'WOMEN_IN_TECH',
]);

export const SourceTypeSchema = z.enum([
  'GOVERNMENT',
  'COMPANY',
  'UNIVERSITY',
  'NGO',
  'FOUNDATION',
  'COMMUNITY',
  'OTHER',
]);

export const OrganizationTypeSchema = z.enum([
  'GOVERNMENT',
  'MNC',
  'STARTUP',
  'NGO',
  'UNIVERSITY',
  'FOUNDATION',
  'COMMUNITY',
  'OTHER',
]);

export const ExperienceRequiredSchema = z.enum(['NONE', 'SOME', 'EXPERIENCED']);

export const FundingTypeSchema = z.enum(['FULLY_FUNDED', 'PARTIALLY_FUNDED', 'PAID', 'UNPAID']);

export const AudiencePersonaSchema = z.enum(['college-student', 'postgraduate', 'fresher']);

export const GoldReasonSchema = z.enum([
  'fully-funded',
  'government',
  'low-competition',
  'international',
  'travel-sponsored',
  'stipend',
  'mentorship',
  'networking',
  'certificate',
  'placement',
  'equity',
  'prestigious',
]);

export const CompetitionLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN']);

export const ApplicationDifficultySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'VERY_HIGH',
  'UNKNOWN',
]);

export const EngineeringDomainSchema = z.enum([
  // Technical / Engineering
  'ai-ml',
  'backend',
  'frontend',
  'fullstack',
  'cloud',
  'devops',
  'cybersecurity',
  'data-science',
  'mobile',
  'embedded',
  'robotics',
  'semiconductor',
  'blockchain',
  'game-dev',
  'qa-testing',
  'ui-ux',

  // Marketing & Creative
  'digital-marketing',
  'content-marketing',
  'social-media',
  'video-editing',
  'graphic-design',
  'content-writing',
  'copywriting',
  'public-relations',
  'event-management',
  'animation',
  'fashion',
  'media',
  'communications',

  // Business, Sales & Consulting
  'finance',
  'accounting',
  'sales',
  'business-development',
  'customer-success',
  'operations',
  'human-resources',
  'legal',
  'consulting',
  'product-management',
  'project-management',
  'entrepreneurship',
  'general-business',

  // Other Professional Disciplines
  'education',
  'teaching',
  'research',
  'biotechnology',
  'healthcare',
  'pharmaceutical',
  'supply-chain',
  'manufacturing',
  'electronics',
  'mechanical',
  'civil',
  'chemical',
  'architecture',
  'hospitality',
]);

export const OpportunitySchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    summary: z.string().min(1, 'Summary is required'),
    organization: z.string().nullable().default(null),
    opportunityType: OpportunityTypeSchema,
    category: z.enum(ACTIVE_SOURCE_CATEGORIES as [SourceCategory, ...SourceCategory[]]),
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

    audiencePersonas: z.array(AudiencePersonaSchema).default([]),
    educationEligibility: z.array(z.string()).default([]),
    professionalDomains: z.array(EngineeringDomainSchema).default([]),
    experienceRequired: ExperienceRequiredSchema.default('NONE'),
    fundingType: FundingTypeSchema.nullable().default(null),
    estimatedCompetition: CompetitionLevelSchema.nullable().default(null),
    organizationType: OrganizationTypeSchema.nullable().default(null),

    applicationDifficulty: ApplicationDifficultySchema.nullable().default(null),

    goldReasons: z.array(GoldReasonSchema).default([]),

    trustScore: z.number().default(0),

    expiresAt: z.string().nullable().default(null),
    archived: z.boolean().default(false),

    trustLevel: z.enum(['VERIFIED', 'OFFICIAL', 'COMMUNITY', 'UNKNOWN']).default('UNKNOWN'),
    qualityScore: z.number().default(0),
    qualityBreakdown: z
      .object({
        officialSource: z.boolean().default(false),
        deadlinePresent: z.boolean().default(false),
        applicationLink: z.boolean().default(false),
        richDescription: z.boolean().default(false),
        benefitsPresent: z.boolean().default(false),
        stipendPresent: z.boolean().default(false),
      })
      .default({}),

    workMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).nullable().default(null),
    fundingStatus: z.enum(['PAID', 'UNPAID']).nullable().default(null),
    visaSponsored: z.boolean().default(false),
    travelFunded: z.boolean().default(false),

    eligibleBranches: z.array(z.string()).default([]),
    eligibleYears: z.array(z.string()).default([]),
    womenFocused: z.boolean().default(false),

    deadlineIntelligence: z
      .object({
        rawText: z.string().nullable().default(null),
        type: z
          .enum(['FIXED_DATE', 'ROLLING', 'UNTIL_FILLED', 'IMMEDIATE', 'ONGOING', 'UNKNOWN'])
          .default('UNKNOWN'),
        normalizedDate: z.string().nullable().default(null),
        timezone: z.string().nullable().default(null),
        confidence: z.number().default(0.2),
        daysRemaining: z.number().nullable().default(null),
        expired: z.boolean().default(false),
        displayLabel: z.string().default('Deadline Unknown'),
      })
      .nullable()
      .optional()
      .default(null),

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
  })
  .refine(
    (data) => {
      const title = data.title || '';
      const lower = title.toLowerCase();

      // Non-technical indicators (Do NOT require)
      const nonTechKeywords = [
        'campus ambassador',
        'marketing',
        'hr',
        'human resource',
        'operations',
        'sales',
        'community',
        'content',
        'business',
        'design',
        'ui/ux',
        'graphic',
        'product management',
        'finance',
        'law',
        'legal',
        'social media',
        'creative',
        'digital-marketing',
        'video-editing',
        'content-marketing',
        'sales',
        'business-development',
        'operations',
        'finance',
        'graphic-design',
        'content-writing',
        'reel creator',
        'ambassador',
      ];
      const isExplicitNonTech = nonTechKeywords.some((kw) => lower.includes(kw));
      if (isExplicitNonTech) {
        return true;
      }

      // Technical indicators (Require)
      const techKeywords = [
        'software',
        'sde',
        'developer',
        'engineer',
        'backend',
        'frontend',
        'fullstack',
        'full stack',
        'ai',
        'ml',
        'machine learning',
        'artificial intelligence',
        'data science',
        'data scientist',
        'data analyst',
        'cybersecurity',
        'security',
        'cloud',
        'devops',
        'mobile',
        'android',
        'ios',
        'qa',
        'automation',
        'embedded',
        'robotics',
        'semiconductor',
        'blockchain',
        'game-dev',
        'testing',
      ];
      const isTech = techKeywords.some((kw) => lower.includes(kw));

      if (isTech) {
        return data.professionalDomains && data.professionalDomains.length >= 1;
      }

      return true;
    },
    {
      message: 'At least one engineering domain is required for technical opportunities',
      path: ['professionalDomains'],
    },
  );
