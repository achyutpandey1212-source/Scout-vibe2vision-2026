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

export const PlannedQuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string(),
  tags: z.array(z.string()),
  expectedOpportunityType: z.string(),
  strategy: SearchStrategySchema,
  expectedSourceType: z.string(),
  expectedEcosystem: z.string().optional(),
  expectedLocation: z.string().optional(),
  expectedATS: z.string().optional(),
  reason: z.string(),
  budget: z.number(),
  depth: z.number(),
});

export const PlanMetaSchema = z.object({
  totalQueries: z.number(),
  searchIntents: z.number(),
  companyDiscoverySearches: z.number(),
  atsSearches: z.number(),
  officialSearches: z.number(),
  communitySearches: z.number(),
  expectedCompanies: z.number(),
  expectedEcosystems: z.number(),
  expectedCities: z.number(),
  estimatedSearchBudget: z.number(),
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
