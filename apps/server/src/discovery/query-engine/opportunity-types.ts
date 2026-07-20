export interface OpportunityType {
  id: string;
  displayName: string;
  keywords: string[];
}

export const OPPORTUNITY_TYPES: Record<string, OpportunityType> = {
  INTERNSHIP: {
    id: 'INTERNSHIP',
    displayName: 'Internship',
    keywords: ['intern', 'internship', 'student placement'],
  },
  SUMMER_INTERNSHIP: {
    id: 'SUMMER_INTERNSHIP',
    displayName: 'Summer Internship',
    keywords: ['summer intern', 'summer internship', 'summer placement'],
  },
  WINTER_INTERNSHIP: {
    id: 'WINTER_INTERNSHIP',
    displayName: 'Winter Internship',
    keywords: ['winter intern', 'winter internship'],
  },
  CAMPUS_HIRING: {
    id: 'CAMPUS_HIRING',
    displayName: 'Campus Hiring',
    keywords: ['campus hiring', 'campus recruitment', 'university graduate'],
  },
  GRADUATE_PROGRAM: {
    id: 'GRADUATE_PROGRAM',
    displayName: 'Graduate Program',
    keywords: ['graduate program', 'grad program', 'associate program', 'graduate role'],
  },
  RESEARCH_INTERNSHIP: {
    id: 'RESEARCH_INTERNSHIP',
    displayName: 'Research Internship',
    keywords: ['research intern', 'research internship', 'phd intern'],
  },
  OPEN_SOURCE_PROGRAM: {
    id: 'OPEN_SOURCE_PROGRAM',
    displayName: 'Open Source Program',
    keywords: ['open source program', 'gsoc', 'outreachy', 'lfx mentor'],
  },
  HACKATHON: {
    id: 'HACKATHON',
    displayName: 'Hackathon',
    keywords: ['hackathon', 'competition', 'student hackathon', 'code challenge'],
  },
  FELLOWSHIP: {
    id: 'FELLOWSHIP',
    displayName: 'Fellowship',
    keywords: ['fellowship', 'fellow', 'student fellowship'],
  },
  TRAINING_PROGRAM: {
    id: 'TRAINING_PROGRAM',
    displayName: 'Training Program',
    keywords: ['trainee', 'apprentice', 'training program', 'vocational trainee'],
  },
  APPRENTICESHIP: {
    id: 'APPRENTICESHIP',
    displayName: 'Apprenticeship',
    keywords: ['apprentice', 'apprenticeship', 'technical apprentice'],
  },
};
