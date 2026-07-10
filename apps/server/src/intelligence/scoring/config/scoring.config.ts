import { ScoringConfig } from '../types/scoring.types';

export const SCORING_CONFIG: ScoringConfig = {
  trustWeights: {
    governmentSuffixes: ['.gov', '.gov.in', '.nic.in', '.gov.uk', '.gov.us', 'gov.in'],
    universitySuffixes: ['.edu', '.edu.in', '.ac.in', '.ac.uk', '.edu.co', 'ac.nz', 'college.edu'],
    trustedAggregators: [
      'linkedin.com',
      'internshala.com',
      'wellfound.com',
      'devfolio.co',
      'unstop.com',
      'ycombinator.com/jobs',
      'angellist.com',
    ],
    ngoSuffixes: ['.org', '.ngo.in', 'unesco.org', 'unicef.org', 'who.int'],
    trustedDomains: {
      'google.com': 100,
      'microsoft.com': 100,
      'meta.com': 100,
      'amazon.jobs': 100,
      'careers.google.com': 100,
      'jobs.microsoft.com': 100,
      'apple.com': 100,
    },
    untrustedDomains: ['spamblog.com', 'getrichquick.in', 'randomjobsblog.net', 'makeeasymoney.co'],
    blogDomains: ['.blogspot.com', '.wordpress.com', 'medium.com', 'substack.com'],
    baseScore: 50,
  },

  popularityWeights: {
    orgWeights: {
      Google: 100,
      Microsoft: 100,
      Meta: 100,
      Amazon: 100,
      Apple: 100,
      Internshala: 80,
      LinkedIn: 90,
      'Government of India': 70,
    },
    domainTypeWeights: {
      GOVERNMENT: 60,
      UNIVERSITY: 40,
      AGGREGATOR: 85,
      COMPANY: 50,
      NGO: 30,
      COMMUNITY: 45,
      OTHER: 25,
    },
    baseScore: 20,
  },

  hiddenBoosts: {
    lowPopularityMultiplier: 0.8, // multiplier for (100 - popularity)
    womenFocusedBoost: 25,
    governmentSchemeBoost: 20,
    ngoBoost: 15,
    scholarshipBoost: 15,
    regionalBoost: 10,
    nicheBoost: 10,
    bigTechPenalty: {
      Google: 80,
      Microsoft: 80,
      Meta: 80,
      Amazon: 80,
      Apple: 80,
    },
    baseScore: 20,
  },

  qualityWeights: {
    hasDeadline: 20,
    hasApplicationUrl: 25,
    hasOfficialWebsite: 10,
    hasEligibility: 15,
    hasBenefits: 10,
    hasSalaryOrStipend: 10,
    descriptionLengthBonus: 10, // given if desc > 300 chars
    baseScore: 0,
  },
};
