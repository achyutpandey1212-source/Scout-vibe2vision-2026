export type AudiencePersona = 'college-student' | 'postgraduate' | 'fresher';

export const AUDIENCE_PERSONAS: AudiencePersona[] = ['college-student', 'postgraduate', 'fresher'];

export const AUDIENCE_PERSONA_DESCRIPTIONS: Record<AudiencePersona, string> = {
  'college-student':
    'Currently enrolled undergraduate (1st–4th year) in an engineering discipline (CSE, AI/ML, Data Science, Cybersecurity, ECE, IT, BCA, MCA, Web Development, Cloud, DevOps, Mobile Development).',
  postgraduate: 'Currently enrolled in M.Tech / M.Sc / MCA / equivalent engineering program.',
  fresher: 'Within 12 months of completing an undergraduate or postgraduate engineering degree.',
};
