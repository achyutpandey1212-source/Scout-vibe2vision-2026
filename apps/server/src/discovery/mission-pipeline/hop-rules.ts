import { HopType } from './hop.types';

export const HOP_RULES: Record<
  HopType,
  { allowedNext: HopType[]; skipIfBelow: number; terminateOn: string[] }
> = {
  SEARCH: {
    allowedNext: [
      'COMPANY',
      'PORTFOLIO',
      'DIRECTORY',
      'CAREERS',
      'ECOSYSTEM',
      'UNIVERSITY',
      'RESEARCH',
      'LAB',
      'PLATFORM',
      'ORGANIZATION',
    ],
    skipIfBelow: 50,
    terminateOn: [],
  },
  ECOSYSTEM: {
    allowedNext: ['PORTFOLIO', 'COMPANY', 'DIRECTORY'],
    skipIfBelow: 55,
    terminateOn: [],
  },
  PORTFOLIO: {
    allowedNext: ['COMPANY', 'CAREERS'],
    skipIfBelow: 60,
    terminateOn: [],
  },
  COMPANY: {
    allowedNext: ['CAREERS', 'ATS', 'DIRECTORY'],
    skipIfBelow: 65,
    terminateOn: [],
  },
  CAREERS: {
    allowedNext: ['ATS', 'OPPORTUNITY', 'INTERNSHIP'],
    skipIfBelow: 70,
    terminateOn: [],
  },
  ATS: {
    allowedNext: ['OPPORTUNITY', 'INTERNSHIP'],
    skipIfBelow: 75,
    terminateOn: [],
  },
  OPPORTUNITY: {
    allowedNext: [],
    skipIfBelow: 0,
    terminateOn: [],
  },
  DIRECTORY: {
    allowedNext: ['COMPANY', 'CAREERS', 'PORTFOLIO'],
    skipIfBelow: 50,
    terminateOn: [],
  },
  UNIVERSITY: {
    allowedNext: ['PROGRAM', 'CAREERS', 'RESEARCH'],
    skipIfBelow: 60,
    terminateOn: [],
  },
  RESEARCH: {
    allowedNext: ['LAB', 'PROGRAM'],
    skipIfBelow: 55,
    terminateOn: [],
  },
  PROGRAM: {
    allowedNext: ['APPLICATION', 'OPPORTUNITY', 'INTERNSHIP'],
    skipIfBelow: 60,
    terminateOn: [],
  },
  APPLICATION: {
    allowedNext: ['OPPORTUNITY', 'INTERNSHIP'],
    skipIfBelow: 65,
    terminateOn: [],
  },
  LAB: {
    allowedNext: ['PROJECT', 'CAREERS', 'OPPORTUNITY'],
    skipIfBelow: 55,
    terminateOn: [],
  },
  PROJECT: {
    allowedNext: ['CAREERS', 'OPPORTUNITY'],
    skipIfBelow: 55,
    terminateOn: [],
  },
  PLATFORM: {
    allowedNext: ['EVENT', 'REGISTRATION'],
    skipIfBelow: 60,
    terminateOn: [],
  },
  EVENT: {
    allowedNext: ['REGISTRATION', 'OPPORTUNITY'],
    skipIfBelow: 60,
    terminateOn: [],
  },
  REGISTRATION: {
    allowedNext: ['OPPORTUNITY'],
    skipIfBelow: 65,
    terminateOn: [],
  },
  ORGANIZATION: {
    allowedNext: ['PROGRAM', 'APPLICATION', 'CAREERS'],
    skipIfBelow: 55,
    terminateOn: [],
  },
  INTERNSHIP: {
    allowedNext: ['OPPORTUNITY'],
    skipIfBelow: 70,
    terminateOn: [],
  },
};

export function getHopRules(
  hopType: HopType,
): { allowedNext: HopType[]; skipIfBelow: number; terminateOn: string[] } | undefined {
  return HOP_RULES[hopType];
}

export function canHop(from: HopType, to: HopType): boolean {
  const rules = HOP_RULES[from];
  if (!rules) return false;
  return rules.allowedNext.includes(to);
}
