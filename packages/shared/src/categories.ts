export type SourceCategory =
  | 'INTERNSHIPS'
  | 'STARTUP_INTERNSHIPS'
  | 'HACKATHONS'
  | 'SCHOLARSHIPS'
  | 'FELLOWSHIPS'
  | 'GOVERNMENT_INTERNSHIP'
  | 'RESEARCH_INTERNSHIP'
  | 'CAMPUS_AMBASSADOR'
  | 'STUDENT_COMPETITION'
  | 'OPEN_SOURCE_PROGRAM'
  | 'SUMMER_SCHOOL'
  | 'BOOTCAMP'
  | 'WOMEN_IN_TECH'
  | 'GENERAL'
  | 'TECH_CAREERS'
  | 'ENTREPRENEURSHIP'
  | 'SKILL_DEVELOPMENT'
  | 'GOVERNMENT'
  | 'RESEARCH';

export interface CategoryMetadata {
  id: SourceCategory;
  name: string;
  isActive: boolean;
  priority: number; // For search planning priority & crawl budget allocation
  description: string;
}

export const CATEGORY_REGISTRY: CategoryMetadata[] = [
  {
    id: 'INTERNSHIPS',
    name: 'Internships',
    isActive: true,
    priority: 100,
    description: 'High-priority engineering student internships, including tech and startups.',
  },
  {
    id: 'STARTUP_INTERNSHIPS',
    name: 'Startup Internships',
    isActive: true,
    priority: 98,
    description:
      'Niche startup engineering student internships (early-stage, Series A/B, YC, SaaS).',
  },
  {
    id: 'GOVERNMENT_INTERNSHIP',
    name: 'Government Internship',
    isActive: true,
    priority: 95,
    description: 'Student opportunities and internships at government agencies/departments.',
  },
  {
    id: 'RESEARCH_INTERNSHIP',
    name: 'Research Internship',
    isActive: true,
    priority: 92,
    description: 'Academic and scientific research internships for engineering students.',
  },
  {
    id: 'HACKATHONS',
    name: 'Hackathons',
    isActive: true,
    priority: 90,
    description: 'Student coding hackathons and developer building challenges.',
  },
  {
    id: 'STUDENT_COMPETITION',
    name: 'Student Competition',
    isActive: true,
    priority: 88,
    description: 'National and international technology innovation challenges.',
  },
  {
    id: 'OPEN_SOURCE_PROGRAM',
    name: 'Open Source Program',
    isActive: true,
    priority: 85,
    description: 'Structured open-source mentorship programs (e.g. GSoC, Outreachy, LFX).',
  },
  {
    id: 'CAMPUS_AMBASSADOR',
    name: 'Campus Ambassador',
    isActive: true,
    priority: 82,
    description: 'Student campus representative and developer advocate roles.',
  },
  {
    id: 'SCHOLARSHIPS',
    name: 'Scholarships',
    isActive: true,
    priority: 80,
    description: 'Educational scholarship opportunities for technology students.',
  },
  {
    id: 'SUMMER_SCHOOL',
    name: 'Summer School',
    isActive: true,
    priority: 78,
    description: 'Academic and scientific summer programs and workshops.',
  },
  {
    id: 'BOOTCAMP',
    name: 'Bootcamp',
    isActive: true,
    priority: 75,
    description: 'Structured technical training bootcamps and workshops.',
  },
  {
    id: 'WOMEN_IN_TECH',
    name: 'Women in Tech',
    isActive: true,
    priority: 72,
    description: 'Diversity scholarship programs, mentorship drives, and hackathons.',
  },
  {
    id: 'FELLOWSHIPS',
    name: 'Fellowships',
    isActive: true,
    priority: 70,
    description: 'Professional and academic fellowship cohorts for students.',
  },
  {
    id: 'GENERAL',
    name: 'General',
    isActive: false,
    priority: 0,
    description: 'Generic opportunity category (inactive).',
  },
  {
    id: 'TECH_CAREERS',
    name: 'Tech Careers',
    isActive: false,
    priority: 0,
    description:
      'Early-career software opportunities including graduate, trainee, apprentice, and returnship programs (inactive).',
  },
  {
    id: 'ENTREPRENEURSHIP',
    name: 'Entrepreneurship',
    isActive: false,
    priority: 0,
    description: 'Student startup accelerator and incubator programs (inactive).',
  },
  {
    id: 'SKILL_DEVELOPMENT',
    name: 'Skill Development',
    isActive: false,
    priority: 0,
    description: 'Professional and vocational skills courses (inactive).',
  },
  {
    id: 'GOVERNMENT',
    name: 'Government Schemes',
    isActive: false,
    priority: 0,
    description:
      'Student-focused government opportunities including internships, innovation challenges, ministry programs, and fellowships (inactive).',
  },
  {
    id: 'RESEARCH',
    name: 'Research',
    isActive: false,
    priority: 0,
    description:
      'Academic research ecosystem, including labs, summer schools, fellowships, and research internships (inactive).',
  },
];
