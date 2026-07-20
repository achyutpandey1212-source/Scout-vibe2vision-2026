export interface GoldCompanyProfile {
  company: string;
  tier: 1 | 2;
  aliases: string[];
  ecosystem?: string;
  priorityMultiplier: number;
  hiringWeight: number;
}

export const GOLD_COMPANY_REGISTRY: Record<string, GoldCompanyProfile> = {
  Google: {
    company: 'Google',
    tier: 1,
    aliases: ['google', 'alphabet'],
    priorityMultiplier: 2.0,
    hiringWeight: 95,
  },
  Microsoft: {
    company: 'Microsoft',
    tier: 1,
    aliases: ['microsoft'],
    priorityMultiplier: 2.0,
    hiringWeight: 95,
  },
  Meta: {
    company: 'Meta',
    tier: 1,
    aliases: ['meta', 'facebook'],
    priorityMultiplier: 2.0,
    hiringWeight: 95,
  },
  Amazon: {
    company: 'Amazon',
    tier: 1,
    aliases: ['amazon', 'aws'],
    priorityMultiplier: 1.8,
    hiringWeight: 90,
  },
  NVIDIA: {
    company: 'NVIDIA',
    tier: 1,
    aliases: ['nvidia'],
    priorityMultiplier: 2.0,
    hiringWeight: 95,
  },
  Razorpay: {
    company: 'Razorpay',
    tier: 2,
    aliases: ['razorpay'],
    priorityMultiplier: 1.5,
    hiringWeight: 85,
  },
  PhonePe: {
    company: 'PhonePe',
    tier: 2,
    aliases: ['phonepe'],
    priorityMultiplier: 1.5,
    hiringWeight: 85,
  },
  Groww: {
    company: 'Groww',
    tier: 2,
    aliases: ['groww'],
    priorityMultiplier: 1.4,
    hiringWeight: 80,
  },
  Meesho: {
    company: 'Meesho',
    tier: 2,
    aliases: ['meesho'],
    priorityMultiplier: 1.4,
    hiringWeight: 80,
  },
  CRED: {
    company: 'CRED',
    tier: 2,
    aliases: ['cred'],
    priorityMultiplier: 1.4,
    hiringWeight: 80,
  },
  Flipkart: {
    company: 'Flipkart',
    tier: 2,
    aliases: ['flipkart'],
    priorityMultiplier: 1.5,
    hiringWeight: 85,
  },
  Atlassian: {
    company: 'Atlassian',
    tier: 2,
    aliases: ['atlassian'],
    priorityMultiplier: 1.6,
    hiringWeight: 90,
  },
  Postman: {
    company: 'Postman',
    tier: 2,
    aliases: ['postman'],
    priorityMultiplier: 1.5,
    hiringWeight: 85,
  },
  BrowserStack: {
    company: 'BrowserStack',
    tier: 2,
    aliases: ['browserstack'],
    priorityMultiplier: 1.4,
    hiringWeight: 80,
  },
};
export default GOLD_COMPANY_REGISTRY;
