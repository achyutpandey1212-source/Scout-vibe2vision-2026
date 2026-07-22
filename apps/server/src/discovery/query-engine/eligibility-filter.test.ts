import { describe, it, expect } from 'vitest';
import { EligibilityFilter } from './eligibility-filter';

describe('EligibilityFilter', () => {
  it('qualifies in.indeed.com based on hostname without requiring India in page content', () => {
    const result = EligibilityFilter.isEligible(
      'Generic job description text without explicit location keyword',
      'https://in.indeed.com/jobs?q=internships',
      'Software Developer',
    );
    expect(result.eligible).toBe(true);
  });

  it('qualifies .co.in, naukri.com, internshala.com, unstop.com hostnames automatically', () => {
    expect(
      EligibilityFilter.isEligible('Careers page', 'https://company.co.in/careers', 'Careers')
        .eligible,
    ).toBe(true);
    expect(
      EligibilityFilter.isEligible('Jobs page', 'https://www.naukri.com/jobs', 'Jobs').eligible,
    ).toBe(true);
    expect(
      EligibilityFilter.isEligible(
        'Internships',
        'https://internshala.com/internships',
        'Internships',
      ).eligible,
    ).toBe(true);
  });

  it('rejects explicit US citizen / US location restrictions even if hostname is in.indeed.com', () => {
    const result = EligibilityFilter.isEligible(
      'US citizen only required',
      'https://in.indeed.com/jobs?q=internships',
      'Software Engineer',
    );
    expect(result.eligible).toBe(false);
  });
});
