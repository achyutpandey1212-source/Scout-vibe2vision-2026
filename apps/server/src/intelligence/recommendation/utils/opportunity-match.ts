import {
  Opportunity,
  OpportunityType,
} from '../../../discovery/extraction/types/opportunity.types';

const EMOJI_TYPE_MAP: Record<string, OpportunityType> = {
  '🌱 Internship': 'INTERNSHIP',
  '🚀 Startup Internship': 'STARTUP_INTERNSHIP',
  '🏛️ Government Internship': 'GOVERNMENT_INTERNSHIP',
  '🔬 Research Internship': 'RESEARCH_INTERNSHIP',
  '💻 Hackathon': 'HACKATHON',
  '🏆 Competition': 'COMPETITION',
  '🌐 Open Source': 'OPEN_SOURCE_PROGRAM',
  '📢 Campus Ambassador': 'CAMPUS_AMBASSADOR',
  '🎓 Scholarship': 'SCHOLARSHIP',
  '🏕️ Summer School': 'SUMMER_SCHOOL',
  '🔥 Bootcamp': 'BOOTCAMP',
  '💎 Fellowship': 'FELLOWSHIP',
  '👩‍💻 Women in Tech': 'WOMEN_IN_TECH',
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
