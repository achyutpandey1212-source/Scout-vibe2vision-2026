import { describe, it, expect } from 'vitest';
import { OpportunityEnrichmentPipeline } from './enrichment-pipeline';

describe('OpportunityEnrichmentPipeline', () => {
  const pipeline = new OpportunityEnrichmentPipeline();

  it('should correctly normalize and enrich general opportunity details', () => {
    const opp = {
      title: 'Software Developer Intern',
      description:
        'Join our team for a part-time remote opportunity working with React and Node.js. Learn modern software development.',
      skills: ['reactjs', 'Node.js', 'git', 'communication'],
      opportunityType: 'INTERNSHIP',
      eligibility: 'Open to all engineering branch students.',
      applicationUrl: 'https://testcompany.com/apply',
      organization: 'Test Company',
      sourceURL: 'https://testcompany.com/jobs/1',
      deadline: '2026-12-31',
    };

    const sourceEntry = {
      ecosystemType: 'STARTUP',
      trustScore: 85,
    };

    pipeline.enrich(opp as any, sourceEntry);

    const enrichedOpp: any = opp;

    // Stage 1 Verification
    expect(enrichedOpp.commitment).toBe('PART_TIME');
    expect(enrichedOpp.workMode).toBe('REMOTE');

    // Stage 2 Verification
    expect(enrichedOpp.skillsTechnical).toContain('react');
    expect(enrichedOpp.skillsTechnical).toContain('nodejs');
    expect(enrichedOpp.skillsTools).toContain('git');
    expect(enrichedOpp.skillsSoft).toContain('communication');
    expect(enrichedOpp.domains).toContain('Frontend');
    expect(enrichedOpp.domains).toContain('Backend');

    // Stage 3 Verification
    expect(enrichedOpp.suitableFirstYear).toBe(true);
    expect(enrichedOpp.suitableSecondYear).toBe(true);

    // Stage 4 Verification
    expect(enrichedOpp.organizationType).toBe('STARTUP');
    expect(enrichedOpp.organizationStage).toBe('EARLY_STARTUP');
    expect(enrichedOpp.competitionEstimate).toBe('LOW');

    // Stage 5 Verification
    expect(enrichedOpp.qualityScore).toBeGreaterThanOrEqual(60);
    expect(enrichedOpp.hiddenGemScore).toBeGreaterThanOrEqual(70);
    expect(enrichedOpp.deadlineStatus).toBe('OPEN');

    // Stage 6 Verification
    expect(enrichedOpp.goldReasons?.length).toBeGreaterThan(0);

    // Stage 7 Verification
    expect(enrichedOpp.readinessScore).toBeGreaterThanOrEqual(80);
    expect(enrichedOpp.readinessStatus).toBe('READY');
  });
});
