import { PlannedQuery } from '../types/query.types';

export const KNOWN_ATS = new Set([
  'Greenhouse',
  'Lever',
  'Ashby',
  'SmartRecruiters',
  'Workable',
  'BambooHR',
  'Comeet',
  'Rippling',
]);

export const KNOWN_COMPANIES = new Set([
  'Google',
  'Microsoft',
  'Amazon',
  'Meta',
  'Apple',
  'NVIDIA',
  'Adobe',
  'Oracle',
  'Salesforce',
  'Atlassian',
  'Uber',
  'Stripe',
  'Databricks',
  'Cloudflare',
  'OpenAI',
  'Anthropic',
  'Perplexity',
  'Mistral',
  'Flipkart',
  'Swiggy',
  'Zomato',
  'Paytm',
  'Razorpay',
  'Cred',
  'PhonePe',
  'Ola',
  'Byju',
  'Unacademy',
  'InMobi',
  'Hotstar',
]);

export const KNOWN_ECOSYSTEMS = new Set([
  'Y Combinator',
  'Techstars',
  'Antler',
  'Entrepreneur First',
  '500 Global',
  'T-Hub',
  'Startup India',
  'NSRCEL',
  'CIIE',
  'Kerala Startup Mission',
  'StartupTN',
  'iCreate',
  'NASSCOM',
  '100X.VC',
  'Peak XV',
  'Accel',
  'Blume',
  'Surge',
]);

export const HIGH_PRIORITY_CITIES = new Set([
  'bengaluru',
  'bangalore',
  'hyderabad',
  'pune',
  'gurugram',
  'gurgaon',
]);

export const MEDIUM_PRIORITY_CITIES = new Set([
  'noida',
  'chennai',
  'mumbai',
  'ahmedabad',
  'kochi',
  'indore',
]);

const GOV_ORGS = new Set([
  'isro',
  'drdo',
  'cdac',
  'nic',
  'bisag',
  'bel',
  'bhel',
  'hal',
  'ecil',
  'meity',
  'aicte',
  'dst',
  'iisc',
  'iit',
  'iiit',
  'nit',
]);

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

export class PriorityScorer {
  static score(query: PlannedQuery): number {
    const queryLower = query.query.toLowerCase();

    let score = 0;

    if (query.strategy === 'ATS') {
      score += 88;
      if (query.expectedATS && KNOWN_ATS.has(query.expectedATS)) score += 5;
    } else if (query.strategy === 'COMPANY') {
      score += 72;
      const knownCompany = [...KNOWN_COMPANIES].find((c) => queryLower.includes(c.toLowerCase()));
      if (knownCompany) score += 8;
    } else if (query.strategy === 'ECOSYSTEM') {
      score += 68;
      const knownEcosystem = [...KNOWN_ECOSYSTEMS].find((e) =>
        queryLower.includes(e.toLowerCase()),
      );
      if (knownEcosystem) score += 6;
    } else if (query.strategy === 'LOCATION') {
      score += 55;
    } else if (query.strategy === 'INTENT') {
      score += 45;
    } else if (query.strategy === 'OFFICIAL') {
      score += 65;
    } else if (query.strategy === 'COMMUNITY') {
      score += 60;
    }

    for (const [, keywords] of Object.entries(ENGINEERING_DOMAIN_KEYWORDS)) {
      if (keywords.some((kw) => queryLower.includes(kw))) {
        score += 5;
        break;
      }
    }

    if (
      queryLower.includes('intern') ||
      queryLower.includes('internship') ||
      queryLower.includes('fresher')
    ) {
      score += 3;
    }

    if (
      HIGH_PRIORITY_CITIES.has(queryLower) ||
      [...HIGH_PRIORITY_CITIES].some((c) => queryLower.includes(c))
    ) {
      score += 4;
    } else if (
      MEDIUM_PRIORITY_CITIES.has(queryLower) ||
      [...MEDIUM_PRIORITY_CITIES].some((c) => queryLower.includes(c))
    ) {
      score += 2;
    }

    if (query.expectedATS && KNOWN_ATS.has(query.expectedATS)) {
      score += 2;
    }

    if (query.expectedLocation && GOV_ORGS.has(query.expectedLocation.toLowerCase())) {
      score += 3;
    }

    const freshnessKeywords = ['2026', 'summer', 'winter', 'off-cycle', 'fall'];
    if (freshnessKeywords.some((kw) => queryLower.includes(kw))) {
      score += 2;
    }

    return Math.min(100, Math.max(0, score));
  }

  static getScoreBand(score: number): string {
    if (score >= 95) return 'ATS / Official';
    if (score >= 90) return 'Official Careers';
    if (score >= 88) return 'Known Startup Careers';
    if (score >= 82) return 'Known Startup Ecosystems';
    if (score >= 70) return 'Community / Specialized';
    if (score >= 55) return 'Generic Search';
    return 'Low Priority';
  }
}
