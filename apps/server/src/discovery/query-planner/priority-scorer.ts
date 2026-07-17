import { PlannedQuery } from '../types/query.types';

export class PriorityScorer {
  static score(query: PlannedQuery): number {
    let score = 0;

    if (query.strategy === 'ATS') score += 25;
    if (query.strategy === 'COMPANY') score += 20;
    if (query.strategy === 'ECOSYSTEM') score += 18;
    if (query.strategy === 'LOCATION') score += 12;
    if (query.strategy === 'INTENT') score += 10;

    if (query.expectedATS) score += 10;
    if (query.expectedEcosystem) score += 8;
    if (query.expectedLocation) score += 6;
    if (query.expectedSourceType === 'COMPANY') score += 8;
    if (query.expectedSourceType === 'ATS') score += 8;

    const engKeywords = [
      'software engineer',
      'backend',
      'frontend',
      'full stack',
      'ai',
      'ml',
      'cloud',
      'devops',
      'cybersecurity',
      'data',
      'mobile',
      'embedded',
      'sre',
      'platform',
      'systems',
      'robotics',
      'intern',
    ];
    const queryLower = query.query.toLowerCase();
    if (engKeywords.some((kw) => queryLower.includes(kw))) score += 10;

    const indiaKeywords = [
      'india',
      'bangalore',
      'bengaluru',
      'hyderabad',
      'pune',
      'chennai',
      'mumbai',
      'gurugram',
      'noida',
      'startup india',
      't-hub',
      'nsrcel',
    ];
    if (indiaKeywords.some((kw) => queryLower.includes(kw))) score += 5;

    const startupKeywords = [
      'startup',
      'yc',
      'y combinator',
      'techstars',
      'antler',
      'peak xv',
      'accel',
      'blume',
      'seed',
      'series a',
    ];
    if (startupKeywords.some((kw) => queryLower.includes(kw))) score += 5;

    const locationPriorities: Record<string, number> = {
      bengaluru: 5,
      bangalore: 5,
      hyderabad: 4,
      pune: 4,
      gurugram: 4,
      gurgaon: 4,
      noida: 3,
      chennai: 3,
      mumbai: 3,
      ahmedabad: 2,
      kochi: 2,
      indore: 2,
    };
    for (const [city, priority] of Object.entries(locationPriorities)) {
      if (queryLower.includes(city)) {
        score += priority;
        break;
      }
    }

    const internshipDensityKeywords = [
      'careers',
      'jobs',
      'hiring',
      'internship',
      'intern',
      'fresher',
    ];
    if (internshipDensityKeywords.some((kw) => queryLower.includes(kw))) score += 5;

    const freshnessKeywords = ['2026', 'summer', 'winter', 'off-cycle', 'fall'];
    if (freshnessKeywords.some((kw) => queryLower.includes(kw))) score += 3;

    return Math.min(100, Math.max(0, score));
  }
}
