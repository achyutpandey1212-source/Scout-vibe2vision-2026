import { describe, it, expect } from 'vitest';
import { RecommendationScorer } from './recommendation-score';
import { CandidateSnapshot } from './candidate-snapshot';

describe('RecommendationScorer Deadline Intelligence Urgency Integration', () => {
  const dummySnapshot: CandidateSnapshot = {
    persona: 'College Student',
    education: {
      degree: 'B.Tech',
      branch: 'Computer Science',
    },
    goals: ['internship'],
    motivations: ['learning'],
    preferredRoles: ['Software Engineering Intern'],
    opportunityTypes: ['Internship'],
    technicalSkills: ['typescript', 'react'],
    technologies: ['node', 'mongo'],
    strongestTechnologies: ['typescript', 'react'],
    projects: [
      {
        title: 'Project A',
        technologies: ['typescript', 'react'],
        category: 'Full Stack Web App',
        summary: 'A full stack application built with React and Typescript.',
      },
    ],
    experience: [],
    strengths: ['Problem solving'],
    confidenceProfile: {
      hesitation: 'Medium',
      stretch: 'Medium',
      applicationConfidence: 'Medium',
    },
    preferences: {
      remote: true,
      womenOnly: false,
      startup: true,
      government: false,
    },
  };

  const dummyBaseOpportunity = {
    title: 'Frontend React Intern',
    description: 'We are looking for a frontend react developer who knows typescript.',
    skills: ['react', 'typescript'],
    tags: ['frontend'],
    opportunityType: 'INTERNSHIP',
    experienceRequired: 'NONE',
    remote: true,
    stipend: '10000',
    deadline: '2026/08/15',
  };

  const scorer = new RecommendationScorer();

  it('should reject expired opportunities immediately', () => {
    const opp = {
      ...dummyBaseOpportunity,
      deadlineIntelligence: {
        rawText: 'Closed yesterday',
        type: 'FIXED_DATE',
        normalizedDate: '2026/07/28',
        daysRemaining: -1,
        expired: true,
        displayLabel: 'Closed yesterday',
      },
    };

    const res = scorer.score(dummySnapshot, opp);
    expect(res).toBeNull();
  });

  it('should give high urgency score boost to closes today opportunities (daysRemaining = 0)', () => {
    const oppToday = {
      ...dummyBaseOpportunity,
      deadlineIntelligence: {
        rawText: 'Ends in few hours',
        type: 'FIXED_DATE',
        normalizedDate: '2026/07/29',
        daysRemaining: 0,
        expired: false,
        displayLabel: 'Closes today',
      },
    };

    const res = scorer.score(dummySnapshot, oppToday);
    expect(res).not.toBeNull();
    expect(res?.scoreBreakdown.deadline).toBe(10);
    expect(res?.reasons).toContain(
      'This opportunity closes today, so applying immediately is recommended.',
    );
  });

  it('should give moderate urgency score boost to closes in 2-3 days opportunities', () => {
    const opp3Days = {
      ...dummyBaseOpportunity,
      deadlineIntelligence: {
        rawText: 'Apply in 3 days',
        type: 'FIXED_DATE',
        normalizedDate: '2026/08/01',
        daysRemaining: 3,
        expired: false,
        displayLabel: '3 days left',
      },
    };

    const res = scorer.score(dummySnapshot, opp3Days);
    expect(res).not.toBeNull();
    expect(res?.scoreBreakdown.deadline).toBe(6);
    expect(res?.reasons).toContain(
      'This opportunity closes in 3 days, so applying soon is recommended.',
    );
  });

  it('should apply rolling boost or ongoing neutral weights correctly', () => {
    const oppRolling = {
      ...dummyBaseOpportunity,
      deadlineIntelligence: {
        rawText: 'Rolling applications',
        type: 'ROLLING',
        normalizedDate: null,
        daysRemaining: null,
        expired: false,
        displayLabel: 'Rolling basis',
      },
    };

    const res = scorer.score(dummySnapshot, oppRolling);
    expect(res).not.toBeNull();
    expect(res?.scoreBreakdown.deadline).toBe(3);
    expect(res?.reasons).toContain(
      'Applications are accepted on a rolling basis, giving you more flexibility.',
    );
  });
});
