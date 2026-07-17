import { DiscoveryMission, MissionConfiguration, PlannedQuery } from '../types/query.types';

const KNOWN_COMPANIES = [
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
];

const STARTUP_ECOSYSTEM_COMPANIES: Record<string, string[]> = {
  'Y Combinator': ['OpenAI', 'Stripe', 'Airbnb', 'DoorDash', 'Instacart', 'Loom', 'Retool'],
  Techstars: ['SendGrid', 'Zayo', 'GraphPad', 'Next Big Thing'],
  Antler: ['TensorFlight', 'Covr', 'Hevo', 'EpiFi'],
  'Peak XV': ['Groww', 'Dream11', 'Gupshup', 'Licious', 'mCaffeine'],
  Accel: ['Flipkart', 'Swiggy', 'Zomato', 'Freshworks', 'BrowserStack'],
  Blume: ['Porter', 'Licious', 'OfBusiness', 'Unacademy'],
  'T-Hub': ['HealthifyMe', 'Gaana', 'Hike', 'Zeta'],
};

export class CompanyPlanner {
  static generate(
    mission: DiscoveryMission,
    config: MissionConfiguration,
    budgetRatio: number,
    maxQueries: number,
  ): PlannedQuery[] {
    if (!config.companyDiscoveryEnabled) {
      return [];
    }

    const queries: PlannedQuery[] = [];

    if (mission === 'ENGINEERING_INTERNSHIPS') {
      for (let i = 0; i < KNOWN_COMPANIES.length; i++) {
        const company = KNOWN_COMPANIES[i];
        queries.push({
          query: `${company} careers internship`.toLowerCase(),
          priority: 'high',
          category: 'INTERNSHIPS',
          tags: ['company', company.toLowerCase(), 'careers'],
          expectedOpportunityType: 'INTERNSHIP',
          strategy: 'COMPANY',
          expectedSourceType: 'COMPANY',
          reason: `Direct career page discovery for ${company}`,
          budget: budgetRatio,
          depth: 1,
        });

        queries.push({
          query: `${company} engineering intern hiring`.toLowerCase(),
          priority: 'high',
          category: 'INTERNSHIPS',
          tags: ['company', company.toLowerCase(), 'engineering'],
          expectedOpportunityType: 'INTERNSHIP',
          strategy: 'COMPANY',
          expectedSourceType: 'COMPANY',
          reason: `Engineering intern search for ${company}`,
          budget: budgetRatio,
          depth: 2,
        });

        if (queries.length >= maxQueries) break;
      }
    }

    if (mission === 'STARTUP_INTERNSHIPS') {
      for (const [ecosystem, companies] of Object.entries(STARTUP_ECOSYSTEM_COMPANIES)) {
        for (let i = 0; i < companies.length; i++) {
          const company = companies[i];
          queries.push({
            query: `${company} careers internship startup`.toLowerCase(),
            priority: 'high',
            category: 'STARTUP_INTERNSHIPS',
            tags: ['company', 'startup', company.toLowerCase(), ecosystem.toLowerCase()],
            expectedOpportunityType: 'INTERNSHIP',
            strategy: 'COMPANY',
            expectedSourceType: 'COMPANY',
            expectedEcosystem: ecosystem,
            reason: `${company} career page via ${ecosystem} ecosystem`,
            budget: budgetRatio,
            depth: 2,
          });

          if (queries.length >= maxQueries) break;
        }
        if (queries.length >= maxQueries) break;
      }

      if (queries.length < maxQueries) {
        const genericDomains = [
          'AI',
          'SaaS',
          'Developer Tools',
          'Cybersecurity',
          'Cloud',
          'DeepTech',
        ];
        const cities = config.priorityCities.slice(0, 5);
        for (let i = 0; i < genericDomains.length && queries.length < maxQueries; i++) {
          for (let j = 0; j < cities.length && queries.length < maxQueries; j++) {
            queries.push({
              query: `${genericDomains[i]} startup ${cities[j]} internship`.toLowerCase(),
              priority: 'medium',
              category: 'STARTUP_INTERNSHIPS',
              tags: [
                'company',
                'startup',
                genericDomains[i].toLowerCase(),
                cities[j].toLowerCase(),
              ],
              expectedOpportunityType: 'INTERNSHIP',
              strategy: 'COMPANY',
              expectedSourceType: 'COMPANY',
              expectedLocation: cities[j],
              reason: `Discover ${genericDomains[i]} startups hiring interns in ${cities[j]}`,
              budget: budgetRatio,
              depth: 2,
            });
          }
        }
      }
    }

    return queries.slice(0, maxQueries);
  }
}
