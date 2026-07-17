export type TargetAudience = 'UNDERGRAD_ENGINEERING_STUDENTS';

export const CANONICAL_TARGET_AUDIENCE: TargetAudience = 'UNDERGRAD_ENGINEERING_STUDENTS';

export const TARGET_AUDIENCE_DESCRIPTION =
  'Undergraduate engineering students (1st–4th year) in India, primarily women, seeking technical internships and portfolio-building opportunities.';

export const ELIGIBLE_BRANCHES = [
  'CSE',
  'AI/ML',
  'Data Science',
  'Cybersecurity',
  'ECE',
  'IT',
  'BCA',
  'MCA',
  'Web Development',
  'Cloud',
  'DevOps',
  'Mobile Development',
] as const;

export const ELIGIBLE_YEARS = ['1st', '2nd', '3rd', '4th', 'Fresher'] as const;

export type EligibleYear = (typeof ELIGIBLE_YEARS)[number];
export type EligibleBranch = (typeof ELIGIBLE_BRANCHES)[number];

export const MISSION_INVARIANT = `
Scout is not LinkedIn. Scout is not Indeed. Scout is not a generic careers platform. Scout is not a women opportunities portal.

Scout's Discovery Engine exists for one audience:
Undergraduate engineering students (1st–4th year) in India, primarily women, seeking technical internships and portfolio-building opportunities.

No component may broaden the mission. Only narrow it.
`;

export const OPPORTUNITY_ACCEPTANCE_PRINCIPLE = `
An opportunity must satisfy ALL of the following:
1. Technically Relevant — involves engineering/technology
2. Student Accessible — accessible to 1st-4th year engineering students
3. Currently Active — has an active application process
4. Actionable — has a clear application mechanism
5. Trusted — from a legitimate source
6. Valuable — provides genuine career value

If ANY fail, REJECT.
`;

export const NEGATIVE_MISSION_STATEMENT = `
Scout intentionally rejects:
- Executive hiring (full-time jobs, senior positions, experienced-hire roles)
- Experienced professionals (MBA, career returners, 3+ years experience)
- Non-engineering programs (marketing, HR, finance, sales, operations, consulting, design, content, education, policy)
- Founder accelerators and CEO residencies
- Generic conferences, meetups, career fairs without student-specific opportunities
- Career blogs, news articles, generic online courses
- Volunteer work (unpaid, non-technical)
- Anything outside engineering students
`;
