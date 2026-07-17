import { describe, it, expect } from 'vitest';
import { Stage4QualityAcceptance } from './stage4';
import { Opportunity } from '../extraction/types/opportunity.types';

describe('Stage4QualityAcceptance Category Alignment', () => {
  const stage4 = new Stage4QualityAcceptance();

  const baseOpportunity: Opportunity = {
    title: 'Software Engineer Intern',
    description:
      'A great 6-month software engineering student internship program. Develop features, build APIs, and work with cloud infrastructure.',
    summary: 'SWE Intern.',
    organization: 'Google',
    opportunityType: 'INTERNSHIP',
    category: 'Engineering',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    remote: false,
    applicationUrl: 'https://careers.google.com/internship',
    officialWebsite: 'https://google.com',
    deadline: '2026-09-30',
    startDate: '2026-11-01',
    endDate: null,
    salary: null,
    stipend: 50000,
    currency: 'INR',
    duration: '6 Months',
    eligibility: 'Open to B.Tech students',
    minimumQualification: 'B.Tech',
    skills: ['TS', 'Node'],
    experienceLevel: 'Entry',
    ageLimit: null,
    genderEligibility: 'FEMALE',
    documentsRequired: [],
    selectionProcess: null,
    benefits: 'Mentorship and stipend',
    tags: ['internship'],
    sourceURL: 'https://careers.google.com/internship',
    sourceDomain: 'google.com',
    sourceType: 'COMPANY',
    confidence: 0.95,
    rawPageId: 'mock_raw',
    aiMetadata: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      latencyMs: 500,
      extractionVersion: 'v1.0',
    },
    hash: 'mock_hash',
  };

  it('accepts legitimate student internship in Internship run', async () => {
    const results = await stage4.execute([baseOpportunity], { categories: ['INTERNSHIPS'] });
    expect(results[0].decision).toBe('ACCEPT');
    expect(results[0].penalties).not.toContain(
      expect.stringContaining('Experienced-hire title mismatch'),
    );
  });

  it('penalizes senior experienced-hire positions in Internship run', async () => {
    const seniorOpp = {
      ...baseOpportunity,
      title: 'Senior Software Engineer',
    };
    const results = await stage4.execute([seniorOpp], { categories: ['INTERNSHIPS'] });
    expect(results[0].decision).toBe('REJECT');
    expect(results[0].penalties.some((p) => p.includes('Experienced-hire title mismatch'))).toBe(
      true,
    );
  });

  it('penalizes non-research opportunities in Research Internship run', async () => {
    const results = await stage4.execute([baseOpportunity], {
      categories: ['RESEARCH_INTERNSHIP'],
    });
    expect(results[0].penalties.some((p) => p.includes('Non-research opportunity mismatch'))).toBe(
      true,
    );
  });

  it('penalizes government/public sector domains in Startup Internship run', async () => {
    const govOpp = {
      ...baseOpportunity,
      sourceType: 'GOVERNMENT' as const,
      sourceDomain: 'nic.in',
    };
    const results = await stage4.execute([govOpp], { categories: ['STARTUP_INTERNSHIPS'] });
    expect(results[0].penalties.some((p) => p.includes('Government/public sector mismatch'))).toBe(
      true,
    );
  });

  it('rewards student-friendly learning and stack boosts, and penalizes corporate leadership content', async () => {
    const learningOpp = {
      ...baseOpportunity,
      description: 'Mentorship and github portfolio building program in react and typescript.',
    };
    const results = await stage4.execute([learningOpp], { categories: ['INTERNSHIPS'] });
    expect(results[0].positiveReasons).toContain(
      'Student-friendly learning/mentorship language detected',
    );
    expect(results[0].positiveReasons).toContain('Engineering stack details available');

    const corporateOpp = {
      ...baseOpportunity,
      description: 'Corporate leadership executive hiring program.',
    };
    const results2 = await stage4.execute([corporateOpp], { categories: ['INTERNSHIPS'] });
    expect(
      results2[0].penalties.some((p) =>
        p.includes('Corporate leadership/non-engineering domain mismatch'),
      ),
    ).toBe(true);
  });
});
