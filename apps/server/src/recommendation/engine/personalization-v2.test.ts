import { describe, it, expect } from 'vitest';
import { CandidateSnapshotBuilder } from './candidate-snapshot';
import { ResumeContextBuilder } from './resume-context-builder';
import { PromptManager } from '../../modules/recommendation/ai/prompt-manager';
import { FallbackPersonalization } from '../../modules/recommendation/ai/fallback-personalization';

describe('Recommendation Engine V2 Stage 3: Deep Resume-Aware Personalization', () => {
  const mockProfile = {
    fullName: 'Achyut Pandey',
    persona: 'COLLEGE_STUDENT',
    degree: 'B.Tech',
    branch: 'Computer Science',
    currentYear: 4,
    technicalSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Express', 'Redis'],
    tools: ['Git', 'GitHub', 'Docker'],
    preferredRoles: ['Backend Intern', 'Full Stack Intern'],
    careerGoals: ['First Internship'],
    opportunityPreferences: {
      internships: true,
      hackathons: true,
    },
  };

  const mockResume = {
    skills: ['LangGraph', 'Gemini', 'Redis', 'React', 'Node.js'],
    projects: [
      {
        title: 'Scout AI Platform',
        description:
          'Built autonomous opportunity crawler with LangGraph, Gemini and Redis caching',
        technologies: ['LangGraph', 'Gemini', 'Redis', 'Node.js', 'MongoDB'],
      },
      {
        title: 'Zenkai Calendar System',
        description: 'Multi-agent AI calendar automation deployed on Cloud Run',
        technologies: ['React', 'Express', 'Cloud Run'],
      },
    ],
  };

  it('should build structured project evidence and resume context formatted string', () => {
    const snapshotBuilder = new CandidateSnapshotBuilder();
    const snapshot = snapshotBuilder.build(mockProfile, mockResume);

    const contextBuilder = new ResumeContextBuilder();
    const context = contextBuilder.build(snapshot);

    expect(context.topProjects).toHaveLength(2);
    expect(context.topProjects[0].title).toBe('Scout AI Platform');
    expect(context.topProjects[0].category).toBe('AI Platform');
    expect(context.topProjects[0].highlights.length).toBeGreaterThan(0);

    expect(context.formattedContext).toContain('Scout AI Platform');
    expect(context.formattedContext).toContain('LangGraph, Gemini');
    expect(context.formattedContext).toContain('Candidate Summary');
  });

  it('should build prompt V2 with injected Resume Context and mentor persona instructions', () => {
    const systemInstruction = PromptManager.getSystemInstructions();
    expect(systemInstruction).toContain('STRICT ANTI-HALLUCINATION');
    expect(systemInstruction).toContain('projectEvidence');
    expect(systemInstruction).toContain('DO NOT CHANGE RANKING');

    const mockTopCandidates = [
      {
        opportunity: {
          title: 'Backend Engineering Intern',
          organization: 'Acme Corp',
          opportunityType: 'INTERNSHIP',
          skills: ['Node.js', 'MongoDB', 'Redis'],
        },
        score: 92,
        matchedProjects: ['Scout AI Platform'],
        matchedSkills: ['nodejs', 'mongodb', 'redis'],
        recommendationStrength: 'excellent',
      },
    ];

    const prompt = PromptManager.buildPrompt(mockProfile as any, mockResume, mockTopCandidates);

    expect(prompt).toContain('========== Candidate Summary ==========');
    expect(prompt.toLowerCase()).toContain('scout ai platform');
    expect(prompt).toContain('Backend Engineering Intern');
  });

  it('should generate fallback personalization populated with projectEvidence and 4-question mentor responses', () => {
    const mockTopCandidates = [
      {
        opportunity: {
          title: 'Backend Engineering Intern',
          organization: 'Google',
          opportunityType: 'INTERNSHIP',
          skills: ['Node.js', 'MongoDB', 'Redis'],
        },
        score: 95,
        matchedProjects: ['Scout AI Platform'],
        matchedSkills: ['nodejs', 'mongodb'],
        recommendationStrength: 'excellent',
      },
    ];

    const response = FallbackPersonalization.generate(mockTopCandidates, mockProfile, mockResume);

    expect(response.todayMission).toBeTruthy();
    expect(response.aiSummary).toContain('Scout AI Platform');
    expect(response.recommendationsBySlot['perfectMatch']).toBeDefined();

    const rec = response.recommendationsBySlot['perfectMatch'];
    expect(rec.projectEvidence).toContain('Scout AI Platform');
    expect(rec.whyYou).toBeTruthy();
    expect(rec.whyCompany).toContain('Google');
    expect(rec.firstAction).toContain('30 minutes');
    expect(rec.missingSkills.length).toBeGreaterThan(0);
  });
});
