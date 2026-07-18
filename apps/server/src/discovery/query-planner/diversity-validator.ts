import { PlannedQuery } from '../types/query.types';

export interface DiversityReport {
  totalQueries: number;
  uniqueEngineeringDomains: number;
  uniqueCities: number;
  atsProviders: number;
  strategiesUsed: number;
  duplicateQueriesRemoved: number;
  finalQueries: number;
  intentDiversity: number;
  locationDiversity: number;
  strategyDiversity: number;
  engineeringDomainDiversity: number;
  companyDiscoveryDiversity: number;
  atsDiversity: number;
}

const ENGINEERING_DOMAIN_KEYWORDS: Record<string, string[]> = {
  Backend: ['backend', 'node', 'java', 'python', 'go', 'rust', 'c++', 'database', 'sql'],
  Frontend: ['frontend', 'react', 'ui', 'ux', 'web', 'javascript', 'typescript', 'css'],
  'Full Stack': ['full stack', 'fullstack'],
  AI: [
    'ai ',
    ' artificial intelligence',
    'machine learning',
    ' ml ',
    'deep learning',
    'nlp',
    'computer vision',
  ],
  ML: [
    'ml ',
    'machine learning',
    'deep learning',
    'nlp',
    'computer vision',
    'tensorflow',
    'pytorch',
  ],
  Cloud: ['cloud', 'aws', 'azure', 'gcp', 'devops', 'kubernetes', 'docker'],
  DevOps: ['devops', 'ci/cd', 'sre', 'kubernetes', 'docker', 'terraform'],
  Cybersecurity: ['cybersecurity', 'security', 'pentest', 'ethical hacking', 'infosec'],
  Data: ['data engineering', 'data science', 'analytics', 'big data', 'spark', 'hadoop'],
  Mobile: ['mobile', 'android', 'ios', 'flutter', 'react native', 'swift'],
  Embedded: ['embedded', 'iot', 'firmware', 'hardware', 'microcontroller'],
  SRE: ['sre', 'site reliability', 'production engineer'],
  Platform: ['platform', 'infrastructure', 'backend'],
  Systems: ['systems', 'operating systems', 'distributed systems'],
  Robotics: ['robotics', 'ros', 'robot'],
  'Game Development': ['game development', 'gaming', 'unity', 'unreal'],
};

function extractEngineeringDomain(query: PlannedQuery): string {
  if (query.engineeringDomain) return query.engineeringDomain;
  const queryLower = query.query.toLowerCase();
  for (const [domain, keywords] of Object.entries(ENGINEERING_DOMAIN_KEYWORDS)) {
    if (keywords.some((kw) => queryLower.includes(kw))) {
      return domain;
    }
  }
  return 'General Engineering';
}

function extractIntentCategory(query: PlannedQuery): string {
  const tags = query.tags || [];
  if (tags.includes('ats')) return 'ATS';
  if (tags.includes('company')) return 'Company';
  if (tags.includes('ecosystem')) return 'Ecosystem';
  if (tags.includes('location')) return 'Location';
  if (tags.includes('intent')) return 'Intent';
  return query.strategy;
}

export class DiversityValidator {
  static validate(queries: PlannedQuery[]): DiversityReport {
    const totalQueries = queries.length;
    const cities = new Set(queries.map((q) => q.expectedLocation).filter(Boolean) as string[]);
    const atsProviders = new Set(queries.map((q) => q.expectedATS).filter(Boolean) as string[]);
    const strategies = new Set(queries.map((q) => q.strategy));
    const engineeringDomains = new Set(queries.map((q) => extractEngineeringDomain(q)));

    const intentCategories = new Set(queries.map((q) => extractIntentCategory(q)));
    const companyQueries = queries.filter((q) => q.strategy === 'COMPANY');

    const duplicateQueriesRemoved = 0;

    const intentDiversity = Math.min(
      100,
      Math.round((intentCategories.size / Math.max(1, totalQueries)) * 100),
    );
    const locationDiversity = Math.min(100, Math.round((cities.size / 10) * 100));
    const strategyDiversity = Math.min(100, Math.round((strategies.size / 6) * 100));
    const engineeringDomainDiversity = Math.min(
      100,
      Math.round((engineeringDomains.size / 5) * 100),
    );
    const companyDiscoveryDiversity = Math.min(
      100,
      Math.round((companyQueries.length / Math.max(1, totalQueries)) * 100),
    );
    const atsDiversity = Math.min(100, Math.round((atsProviders.size / 8) * 100));

    return {
      totalQueries,
      uniqueEngineeringDomains: engineeringDomains.size,
      uniqueCities: cities.size,
      atsProviders: atsProviders.size,
      strategiesUsed: strategies.size,
      duplicateQueriesRemoved,
      finalQueries: totalQueries,
      intentDiversity,
      locationDiversity,
      strategyDiversity,
      engineeringDomainDiversity,
      companyDiscoveryDiversity,
      atsDiversity,
    };
  }

  static formatReport(report: DiversityReport): string {
    return `
==================================
Planner Diversity Report
==================================

Total Queries         : ${report.totalQueries}
Unique Engineering Domains : ${report.uniqueEngineeringDomains}
Unique Cities         : ${report.uniqueCities}
ATS Providers         : ${report.atsProviders}
Strategies Used       : ${report.strategiesUsed}
Duplicate Queries Removed : ${report.duplicateQueriesRemoved}
Final Queries         : ${report.finalQueries}

----------------------------------
Diversity Scores
----------------------------------
Intent Diversity        : ${report.intentDiversity}%
Location Diversity      : ${report.locationDiversity}%
Strategy Diversity      : ${report.strategyDiversity}%
Engineering Domain Div  : ${report.engineeringDomainDiversity}%
Company Discovery Div   : ${report.companyDiscoveryDiversity}%
ATS Diversity           : ${report.atsDiversity}%
==================================
`;
  }
}
