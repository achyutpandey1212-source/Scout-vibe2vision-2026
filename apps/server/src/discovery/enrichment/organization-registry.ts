import { OrganizationType, OrganizationStage } from '../extraction/types/opportunity.types';

export interface RegistryOrgEntry {
  name: string;
  type: OrganizationType;
  stage: OrganizationStage | null;
  aliases: string[];
  domains: string[];
}

export const ORGANIZATION_REGISTRY: RegistryOrgEntry[] = [
  {
    name: 'Google',
    type: 'MNC',
    stage: 'ENTERPRISE',
    aliases: ['google inc', 'google llc', 'google india', 'google research', 'alphabet'],
    domains: ['google.com', 'google.jobs', 'careers.google.com'],
  },
  {
    name: 'Microsoft',
    type: 'MNC',
    stage: 'ENTERPRISE',
    aliases: ['microsoft corporation', 'microsoft india', 'microsoft research'],
    domains: ['microsoft.com', 'careers.microsoft.com'],
  },
  {
    name: 'Amazon',
    type: 'MNC',
    stage: 'ENTERPRISE',
    aliases: ['amazon web services', 'aws', 'amazon dev centre', 'amazon development centre'],
    domains: ['amazon.com', 'amazon.jobs', 'careers.amazon.com'],
  },
  {
    name: 'Meta',
    type: 'MNC',
    stage: 'ENTERPRISE',
    aliases: ['facebook', 'facebook inc', 'meta platforms'],
    domains: ['meta.com', 'facebook.com', 'metacareers.com'],
  },
  {
    name: 'Apple',
    type: 'MNC',
    stage: 'ENTERPRISE',
    aliases: ['apple inc', 'apple india'],
    domains: ['apple.com', 'careers.apple.com'],
  },
  {
    name: 'Netflix',
    type: 'MNC',
    stage: 'ENTERPRISE',
    aliases: ['netflix inc', 'netflix streaming'],
    domains: ['netflix.com', 'jobs.netflix.com'],
  },
  {
    name: 'GitHub',
    type: 'MNC',
    stage: 'ENTERPRISE',
    aliases: ['github inc'],
    domains: ['github.com', 'github.jobs'],
  },
  {
    name: 'Stripe',
    type: 'MNC',
    stage: 'SCALE_UP',
    aliases: ['stripe inc', 'stripe payments'],
    domains: ['stripe.com'],
  },
  {
    name: 'Uber',
    type: 'MNC',
    stage: 'ENTERPRISE',
    aliases: ['uber technologies'],
    domains: ['uber.com'],
  },
  {
    name: 'LinkedIn',
    type: 'MNC',
    stage: 'ENTERPRISE',
    aliases: ['linkedin corporation'],
    domains: ['linkedin.com'],
  },
  {
    name: 'Cursor',
    type: 'STARTUP',
    stage: 'GROWTH_STARTUP',
    aliases: ['anysphere', 'cursor ai'],
    domains: ['cursor.com', 'cursor.sh', 'anysphere.co'],
  },
  {
    name: 'OpenAI',
    type: 'STARTUP',
    stage: 'SCALE_UP',
    aliases: ['openai inc', 'openai gp'],
    domains: ['openai.com'],
  },
  {
    name: 'Anthropic',
    type: 'STARTUP',
    stage: 'SCALE_UP',
    aliases: ['anthropic PBC', 'anthropic ai'],
    domains: ['anthropic.com'],
  },
  {
    name: 'T-Hub',
    type: 'STARTUP',
    stage: 'GROWTH_STARTUP',
    aliases: ['t hub', 'thub'],
    domains: ['t-hub.co', 'thub.org'],
  },
  {
    name: 'Y Combinator',
    type: 'STARTUP',
    stage: 'GROWTH_STARTUP',
    aliases: ['ycombinator', 'yc'],
    domains: ['ycombinator.com', 'yc.co'],
  },
  // Research Organizations
  {
    name: 'ISRO',
    type: 'GOVERNMENT',
    stage: 'GOVERNMENT',
    aliases: ['indian space research organisation', 'isro headquarters', 'vssc', 'ursc', 'sac'],
    domains: ['isro.gov.in'],
  },
  {
    name: 'DRDO',
    type: 'GOVERNMENT',
    stage: 'GOVERNMENT',
    aliases: ['defence research and development organisation', 'drdo lab'],
    domains: ['drdo.gov.in'],
  },
  {
    name: 'CERN',
    type: 'UNIVERSITY',
    stage: 'ACADEMIC',
    aliases: ['european organization for nuclear research'],
    domains: ['cern.ch', 'home.cern'],
  },
];
