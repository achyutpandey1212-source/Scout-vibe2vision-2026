import { HopResult, HopType } from './hop.types';
import { getHopPriority, isTransitionAllowed } from './hop-registry';

export interface DispatcherInput {
  hopType: HopType;
  url: string;
  depth: number;
  priority: number;
  reason: string;
  confidence: number;
}

export class HopDispatcher {
  dispatch(input: DispatcherInput): HopResult | null {
    if (!isTransitionAllowed('SEARCH', input.hopType)) {
      return null;
    }
    if (input.priority < 50) {
      return null;
    }
    return {
      hopType: input.hopType,
      url: input.url,
      depth: input.depth,
      priority: input.priority,
      status: 'visited',
      discoveredBy: input.reason,
      targetType: input.hopType,
      children: [],
      metadata: { confidence: input.confidence },
    };
  }

  classifyAndDispatch(
    url: string,
    depth: number,
  ): { result: HopResult | null; classification: { hopType: HopType; confidence: number } | null } {
    const classification = classifyUrl(url, []);
    if (!classification) {
      return { result: null, classification: null };
    }
    const priority = getHopPriority(classification.hopType);
    const result = this.dispatch({
      hopType: classification.hopType,
      url,
      depth,
      priority,
      reason: `URL classification: ${classification.hopType}`,
      confidence: classification.confidence,
    });
    return { result, classification };
  }

  shouldCrawl(hopType: HopType, depth: number, maxDepth: number): boolean {
    if (depth >= maxDepth) return false;
    if (hopType === 'OPPORTUNITY' || hopType === 'INTERNSHIP') return true;
    if (hopType === 'ATS' || hopType === 'CAREERS' || hopType === 'REGISTRATION') return true;
    if (hopType === 'SEARCH') return depth === 0;
    if (hopType === 'PORTFOLIO' || hopType === 'DIRECTORY') return depth < 2;
    return false;
  }

  isTerminal(hopType: HopType): boolean {
    return hopType === 'OPPORTUNITY' || hopType === 'INTERNSHIP';
  }
}

function classifyUrl(
  url: string,
  _atsPatterns: unknown[],
): { hopType: HopType; confidence: number } | null {
  const lower = url.toLowerCase();
  if (lower.includes('/careers') || lower.includes('/jobs') || lower.includes('/hiring')) {
    return { hopType: 'CAREERS', confidence: 90 };
  }
  if (
    lower.includes('boards.greenhouse.io') ||
    lower.includes('jobs.lever.co') ||
    lower.includes('jobs.ashbyhq.com') ||
    lower.includes('smartrecruiters.com') ||
    lower.includes('workable.com') ||
    lower.includes('jobvite.com') ||
    lower.includes('teamtailor.com') ||
    lower.includes('bamboohr.com') ||
    lower.includes('rippling.com') ||
    lower.includes('comeet.com')
  ) {
    return { hopType: 'ATS', confidence: 95 };
  }
  if (lower.includes('/about') || lower.includes('/company')) {
    return { hopType: 'COMPANY', confidence: 70 };
  }
  if (lower.includes('/portfolio') || lower.includes('/companies')) {
    return { hopType: 'PORTFOLIO', confidence: 85 };
  }
  if (lower.includes('/program') || lower.includes('/internship-program')) {
    return { hopType: 'PROGRAM', confidence: 80 };
  }
  if (lower.includes('/apply') || lower.includes('/application')) {
    return { hopType: 'APPLICATION', confidence: 85 };
  }
  if (lower.includes('/lab') || lower.includes('/research-lab')) {
    return { hopType: 'LAB', confidence: 75 };
  }
  if (lower.includes('/event') || lower.includes('/hackathon') || lower.includes('/competition')) {
    return { hopType: 'EVENT', confidence: 80 };
  }
  if (lower.includes('/register') || lower.includes('/registration')) {
    return { hopType: 'REGISTRATION', confidence: 85 };
  }
  if (lower.includes('/university') || lower.includes('/campus')) {
    return { hopType: 'UNIVERSITY', confidence: 80 };
  }
  if (lower.includes('/organization') || lower.includes('/organisation')) {
    return { hopType: 'ORGANIZATION', confidence: 70 };
  }
  if (lower.includes('intern') || lower.includes('internship')) {
    return { hopType: 'INTERNSHIP', confidence: 88 };
  }
  if (lower.includes('/directory') || lower.includes('/list')) {
    return { hopType: 'DIRECTORY', confidence: 60 };
  }
  return null;
}
