import { z } from 'zod';

export const DiscoveryMissionSchema = z.enum([
  'ENGINEERING_INTERNSHIPS',
  'STARTUP_INTERNSHIPS',
  'GOVERNMENT_TECH_INTERNSHIPS',
  'RESEARCH_INTERNSHIPS',
  'HACKATHONS',
]);

export const SearchStrategySchema = z.enum([
  'INTENT',
  'ECOSYSTEM',
  'LOCATION',
  'COMPANY',
  'ATS',
  'OFFICIAL',
  'COMMUNITY',
]);

export const QueryPurposeSchema = z.enum([
  'DISCOVER_COMPANIES',
  'DISCOVER_CAREERS',
  'DISCOVER_ATS',
  'DISCOVER_INTERNSHIPS',
  'DISCOVER_PORTFOLIO',
  'DISCOVER_EVENTS',
  'DISCOVER_COMMUNITIES',
  'DISCOVER_PROGRAMS',
]);

export const PlannedQuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  priority: z.enum(['high', 'medium', 'low']),
  priorityScore: z.number(),
  category: z.string(),
  tags: z.array(z.string()),
  expectedOpportunityType: z.string(),
  strategy: SearchStrategySchema,
  purpose: QueryPurposeSchema,
  expectedSourceType: z.string(),
  expectedEcosystem: z.string().optional(),
  expectedLocation: z.string().optional(),
  expectedATS: z.string().optional(),
  reason: z.string(),
  explanation: z.string(),
  budget: z.number(),
  depth: z.number(),
});

export const DiversitySchema = z.object({
  intent: z.number(),
  location: z.number(),
  strategy: z.number(),
  engineeringDomain: z.number(),
  companyDiscovery: z.number(),
  ats: z.number(),
});

export const PlanMetaSchema = z.object({
  mission: DiscoveryMissionSchema,
  totalGenerated: z.number(),
  duplicatesRemoved: z.number(),
  finalQueries: z.number(),
  averagePriority: z.number(),
  averageBudget: z.number(),
  strategiesUsed: z.record(z.string(), z.number()),
  citiesCovered: z.array(z.string()),
  engineeringDomainsCovered: z.array(z.string()),
  atsProviders: z.array(z.string()),
  companiesExpected: z.number(),
  ecosystemsCovered: z.array(z.string()),
  budgetUtilization: z.number(),
  missionCoverage: z.number(),
  diversity: DiversitySchema,
});

export const MissionConfigurationSchema = z.object({
  mission: DiscoveryMissionSchema,
  searchIntents: z.array(z.string()),
  prioritySources: z.array(z.string()),
  priorityEcosystems: z.array(z.string()),
  priorityCities: z.array(z.string()),
  preferredATS: z.array(z.string()),
  searchBudget: z.number(),
  maxSearchDepth: z.number(),
  companyDiscoveryEnabled: z.boolean(),
  multiHopEnabled: z.boolean(),
  engineeringDomains: z.array(z.string()),
  explanationTemplates: z.object({
    ats: z.string(),
    company: z.string(),
    ecosystem: z.string(),
    location: z.string(),
    intent: z.string(),
  }),
});

export const PrioritizedSearchPlanSchema = z.object({
  mission: DiscoveryMissionSchema,
  configuration: MissionConfigurationSchema,
  queries: z.array(z.string()),
  plannedQueries: z.array(PlannedQuerySchema),
  meta: PlanMetaSchema,
});

export const DetailedQueryPlannerOutputSchema = z.object({
  queries: z.array(PlannedQuerySchema),
});

export const SimpleQueryPlannerResponseSchema = z.object({
  queries: z.array(z.string()),
});
