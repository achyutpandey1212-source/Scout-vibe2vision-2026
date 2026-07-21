import { describe, it, expect } from 'vitest';
import { CandidateSnapshotBuilder } from './candidate-snapshot';
import { RecommendationPortfolioBuilder } from './recommendation-portfolio';
import { RecommendationQualityService } from '../../modules/recommendation/quality/recommendation-quality.service';
import { RecommendationPackBuilder } from '../../modules/recommendation/builder/recommendation-pack.builder';
import { ResponseValidator } from '../../modules/recommendation/ai/response-validator';
import { FallbackPersonalization } from '../../modules/recommendation/ai/fallback-personalization';

describe('Recommendation Engine V2: Critical Bug Fix Sprint Verification', () => {
  const mockProfile = {
    fullName: 'Achyut Pandey',
    persona: 'COLLEGE_STUDENT',
    degree: 'B.Tech',
    branch: 'Computer Science',
    currentYear: 4,
    technicalSkills: ['React', 'Node.js', 'Express', 'MongoDB'],
    tools: ['Git'],
    preferredRoles: ['Full Stack Intern'],
    careerGoals: ['First Internship'],
    opportunityPreferences: { internships: true, hackathons: true },
  };

  const mockResume = {
    skills: ['React', 'Node.js', 'Express', 'MongoDB'],
    projects: [
      {
        title: 'Full Stack App',
        description: 'E-commerce app with React, Express, MongoDB',
        technologies: ['React', 'Express', 'MongoDB'],
      },
    ],
  };

  const snapshotBuilder = new CandidateSnapshotBuilder();
  const snapshot = snapshotBuilder.build(mockProfile, mockResume);

  it('Bug 1: should not crash when evaluating quality or building pack for candidates with missing organization or diversificationTags', () => {
    const incompleteCandidates: any[] = [
      {
        opportunity: {
          id: '1',
          title: 'Full Stack Developer',
          organization: undefined,
          company: undefined,
        },
        totalScore: 85,
      },
    ];

    expect(() =>
      RecommendationQualityService.evaluatePack(incompleteCandidates as any),
    ).not.toThrow();
    const qualityScore = RecommendationQualityService.evaluatePack(incompleteCandidates as any);
    expect(qualityScore).toBeGreaterThanOrEqual(0);

    const pack = RecommendationPackBuilder.build(
      '507f1f77bcf86cd799439011',
      'hash123',
      'DAILY_SCHEDULE' as any,
      incompleteCandidates,
      {
        todayMission: 'Test',
        aiSummary: 'Summary',
        recommendationsBySlot: {},
      },
      {
        provider: 'test',
        model: 'test',
        latencyMs: 10,
        promptVersion: 'v1',
        schemaVersion: '1',
        engineVersion: '1',
        fallbackUsed: false,
        repairUsed: false,
        promptLength: 10,
        responseLength: 10,
        promptHash: 'hash',
      },
      'control',
      qualityScore,
    );

    expect(pack).toBeDefined();
    expect(pack.perfectMatch).toBeDefined();
  });

  it('Bug 2: should strictly forbid duplicate opportunity IDs and duplicate application URLs across portfolio slots', () => {
    const portfolioBuilder = new RecommendationPortfolioBuilder();
    const duplicatesPool = [
      {
        opportunity: { id: 'opp_same', applyUrl: 'https://apply.com/same', title: 'Role 1' },
        totalScore: 95,
      },
      {
        opportunity: { id: 'opp_same', applyUrl: 'https://apply.com/same', title: 'Role 1 Dup' },
        totalScore: 90,
      },
      {
        opportunity: { id: 'opp_2', applyUrl: 'https://apply.com/other1', title: 'Role 2' },
        totalScore: 85,
      },
      {
        opportunity: { id: 'opp_3', applyUrl: 'https://apply.com/other2', title: 'Role 3' },
        totalScore: 80,
      },
      {
        opportunity: { id: 'opp_4', applyUrl: 'https://apply.com/other3', title: 'Role 4' },
        totalScore: 75,
      },
      {
        opportunity: { id: 'opp_5', applyUrl: 'https://apply.com/other4', title: 'Role 5' },
        totalScore: 70,
      },
    ];

    const portfolio = portfolioBuilder.buildPortfolio(duplicatesPool, snapshot);
    const selectedIds = portfolio.selectedCandidates.map((c) => c.opportunity.id);

    expect(selectedIds).toHaveLength(5);
    const uniqueIds = new Set(selectedIds);
    expect(uniqueIds.size).toBe(5);
  });

  it('Bug 5: should correctly classify role families across all required domains', () => {
    expect(
      RecommendationPortfolioBuilder.inferRoleFamily({ title: 'Senior Backend API Engineer' }),
    ).toBe('Backend');
    expect(
      RecommendationPortfolioBuilder.inferRoleFamily({ title: 'React Frontend Developer' }),
    ).toBe('Frontend');
    expect(RecommendationPortfolioBuilder.inferRoleFamily({ title: 'Full Stack Developer' })).toBe(
      'Full Stack',
    );
    expect(
      RecommendationPortfolioBuilder.inferRoleFamily({ title: 'LLM Agent AI Specialist' }),
    ).toBe('AI');
    expect(RecommendationPortfolioBuilder.inferRoleFamily({ title: 'PyTorch ML Researcher' })).toBe(
      'ML',
    );
    expect(RecommendationPortfolioBuilder.inferRoleFamily({ title: 'AWS Cloud Architect' })).toBe(
      'Cloud',
    );
    expect(
      RecommendationPortfolioBuilder.inferRoleFamily({ title: 'DevOps Kubernetes Engineer' }),
    ).toBe('DevOps');
    expect(
      RecommendationPortfolioBuilder.inferRoleFamily({ title: 'Flutter Mobile App Engineer' }),
    ).toBe('Mobile');
    expect(
      RecommendationPortfolioBuilder.inferRoleFamily({ title: 'Data Pipeline Analytics Engineer' }),
    ).toBe('Data');
    expect(
      RecommendationPortfolioBuilder.inferRoleFamily({ title: 'Cyber Security Specialist' }),
    ).toBe('Security');
    expect(
      RecommendationPortfolioBuilder.inferRoleFamily({ title: 'Hackathon Challenge 2026' }),
    ).toBe('Hackathon');
    expect(
      RecommendationPortfolioBuilder.inferRoleFamily({ title: 'Open Source GSoC Contributor' }),
    ).toBe('Open Source');
  });

  it('Bug 6: should safely truncate over-length LLM strings before schema validation', () => {
    const rawOverlengthJson = JSON.stringify({
      todayMission: 'X'.repeat(300),
      aiSummary: 'Y'.repeat(1000),
      recommendationsBySlot: {
        perfectMatch: {
          personalizedReason: 'Z'.repeat(800),
          missingSkills: ['Skill1', 'Skill2'],
          firstAction: 'Action'.repeat(50),
          confidenceMessage: 'Encouragement'.repeat(50),
        },
      },
    });

    expect(() => ResponseValidator.validate(rawOverlengthJson)).not.toThrow();
    const result = ResponseValidator.validate(rawOverlengthJson);
    expect(result.todayMission.length).toBeLessThanOrEqual(120);
    expect(result.aiSummary.length).toBeLessThanOrEqual(400);
    expect(
      result.recommendationsBySlot['perfectMatch'].personalizedReason.length,
    ).toBeLessThanOrEqual(250);
  });

  it('Bug 7: should gracefully generate fallback response per slot if single candidate is passed', () => {
    const singleCand = [
      {
        opportunity: { id: 'opp_single', title: 'Backend Intern', organization: 'Acme' },
        totalScore: 88,
      },
    ];

    const fallback = FallbackPersonalization.generate(
      singleCand,
      mockProfile,
      mockResume,
      snapshot,
    );
    expect(fallback.recommendationsBySlot['perfectMatch']).toBeDefined();
    expect(fallback.recommendationsBySlot['perfectMatch'].projectEvidence).toBeTruthy();
  });
});
