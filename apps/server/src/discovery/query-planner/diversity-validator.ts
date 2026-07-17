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

export class DiversityValidator {
  static validate(queries: PlannedQuery[]): DiversityReport {
    const totalQueries = queries.length;
    const cities = new Set(queries.map((q) => q.expectedLocation).filter(Boolean) as string[]);
    const atsProviders = new Set(queries.map((q) => q.expectedATS).filter(Boolean) as string[]);
    const strategies = new Set(queries.map((q) => q.strategy));
    const domains = new Set(queries.map((q) => q.category));

    const intentQueries = queries.filter((q) => q.strategy === 'INTENT');
    const companyQueries = queries.filter((q) => q.strategy === 'COMPANY');

    const duplicateQueriesRemoved = 0;

    const intentDiversity = Math.min(
      100,
      Math.round((intentQueries.length / Math.max(1, totalQueries)) * 100),
    );
    const locationDiversity = Math.min(100, Math.round((cities.size / 10) * 100));
    const strategyDiversity = Math.min(100, Math.round((strategies.size / 6) * 100));
    const engineeringDomainDiversity = Math.min(100, Math.round((domains.size / 5) * 100));
    const companyDiscoveryDiversity = Math.min(
      100,
      Math.round((companyQueries.length / Math.max(1, totalQueries)) * 100),
    );
    const atsDiversity = Math.min(100, Math.round((atsProviders.size / 8) * 100));

    return {
      totalQueries,
      uniqueEngineeringDomains: domains.size,
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
