import {
  Opportunity,
  OpportunityType,
} from '../../../discovery/extraction/types/opportunity.types';

const EMOJI_TYPE_MAP: Record<string, OpportunityType> = {
  '🌱 Internship': 'INTERNSHIP',
  '💼 Job': 'JOB',
  '🎓 Scholarship': 'SCHOLARSHIP',
  '💻 Freelancing': 'FREELANCE',
  '❤️ Volunteering': 'VOLUNTEER',
  '✨ Competitions': 'COMPETITION',
  '📚 Courses': 'COURSE',
  '💰 Grants': 'GRANT',
  '🏆 Fellowships': 'FELLOWSHIP',
};

export function matchOpportunityType(userExcitedTypes: string[], opportunity: Opportunity) {
  if (!userExcitedTypes || userExcitedTypes.length === 0) {
    return { score: 100, matched: [] as string[], missing: [] as string[] };
  }

  const mappedUserTypes = userExcitedTypes
    .map((typeStr) => EMOJI_TYPE_MAP[typeStr])
    .filter((t): t is OpportunityType => t !== undefined);

  const matched = mappedUserTypes.includes(opportunity.opportunityType);

  const score = matched ? 100 : 0;

  return {
    score,
    matched: matched ? [opportunity.opportunityType] : [],
    missing: !matched ? [opportunity.opportunityType] : [],
  };
}
