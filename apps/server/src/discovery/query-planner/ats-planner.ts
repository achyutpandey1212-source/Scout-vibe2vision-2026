import { DiscoveryMission, MissionConfiguration, PlannedQuery } from '../types/query.types';
import { SourceCategory } from '@scout/shared';

const ATS_DOMAINS: Record<string, string> = {
  Greenhouse: 'boards.greenhouse.io',
  Lever: 'jobs.lever.co',
  Ashby: 'jobs.ashbyhq.com',
  SmartRecruiters: 'jobs.smartrecruiters.com',
  Workable: 'apply.workable.com',
  BambooHR: 'bamboohr.com',
  Comeet: 'comeet.com',
  Rippling: 'rippling.com',
};

const ATS_KEYWORDS: Record<string, string[]> = {
  ENGINEERING_INTERNSHIPS: [
    'software engineer intern',
    'backend intern',
    'frontend intern',
    'engineering intern',
    'developer intern',
    'summer intern',
    'internship',
  ],
  STARTUP_INTERNSHIPS: [
    'intern',
    'software engineer intern',
    'startup intern',
    'engineering intern',
    'summer intern',
  ],
};

const ATS_KEYWORD_DOMAINS: Record<string, string> = {
  'software engineer intern': 'General Engineering',
  'backend intern': 'Backend',
  'frontend intern': 'Frontend',
  'engineering intern': 'General Engineering',
  'developer intern': 'General Engineering',
  'summer intern': 'General Engineering',
  internship: 'General Engineering',
  intern: 'General Engineering',
  'startup intern': 'General Engineering',
};

export class ATSPlanner {
  static generate(
    mission: DiscoveryMission,
    config: MissionConfiguration,
    budgetRatio: number,
    maxQueries: number,
  ): PlannedQuery[] {
    if (config.preferredATS.length === 0) {
      return [];
    }

    const queries: PlannedQuery[] = [];
    const atsSystems = config.preferredATS;
    const keywords = ATS_KEYWORDS[mission] || ['intern', 'internship'];
    const category = mission === 'STARTUP_INTERNSHIPS' ? 'STARTUP_INTERNSHIPS' : 'INTERNSHIPS';
    const opportunityType = mission === 'HACKATHONS' ? 'HACKATHON' : 'INTERNSHIP';

    for (let i = 0; i < atsSystems.length; i++) {
      const ats = atsSystems[i];
      const domain = ATS_DOMAINS[ats];
      if (!domain) continue;

      const keyword = keywords[i % keywords.length];
      const engineeringDomain = ATS_KEYWORD_DOMAINS[keyword] || 'General Engineering';

      queries.push({
        query: `site:${domain} ${keyword}`.toLowerCase(),
        priority: 'high',
        priorityScore: 0,
        category: category as SourceCategory,
        tags: ['ats', ats.toLowerCase(), keyword.replace(/\s+/g, '-')],
        expectedOpportunityType: opportunityType,
        strategy: 'ATS',
        purpose: 'DISCOVER_ATS',
        expectedSourceType: 'ATS',
        expectedATS: ats,
        engineeringDomain,
        reason: `Direct ATS search on ${ats} for ${keyword}`,
        explanation:
          config.explanationTemplates?.ats ||
          'Official ATS search with historically high internship yield.',
        budget: budgetRatio,
        depth: 1,
      });

      if (queries.length >= maxQueries) break;
    }

    return queries.slice(0, maxQueries);
  }
}
