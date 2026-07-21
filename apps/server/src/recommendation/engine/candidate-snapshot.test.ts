import { describe, it, expect, beforeEach } from 'vitest';
import { CandidateSnapshotBuilder } from './candidate-snapshot';

describe('CandidateSnapshotBuilder', () => {
  let builder: CandidateSnapshotBuilder;

  beforeEach(() => {
    builder = new CandidateSnapshotBuilder();
  });

  it('should build a normalized CandidateSnapshot from Profile and Resume', () => {
    const mockProfile = {
      persona: 'COLLEGE_STUDENT',
      degree: 'B.Tech',
      branch: 'Computer Science',
      currentYear: 3,
      expectedGraduation: 2026,
      technicalSkills: ['React.js', 'NodeJS', 'TypeScript', 'Mongo DB', 'Express.js', 'Firebase'],
      tools: ['Git', 'GitHub', 'Docker'],
      languages: ['JavaScript', 'Python'],
      preferredRoles: ['Full Stack Intern', 'Backend Intern'],
      careerGoals: ['First Internship'],
      primaryMotivation: 'Build real world apps',
      secondaryMotivations: ['Earn stipend', 'Gain experience'],
      hesitationLevel: 'Low',
      stretchPreference: 'High',
      applicationConfidence: 'High',
      womenOnlyPreference: false,
      startupPreference: true,
      governmentPreference: false,
      remotePreference: true,
      opportunityPreferences: {
        internships: true,
        hackathons: true,
        competitions: true,
        scholarships: false,
      },
    };

    const mockResume = {
      skills: ['LangGraph', 'Gemini', 'Redis', 'React', 'NodeJS'],
      education: [
        {
          degree: 'B.Tech',
          fieldOfStudy: 'Computer Science',
        },
      ],
      experience: [
        { company: 'Acme Corp', role: 'Software Intern' },
        { company: 'Beta Labs', role: 'Web Developer' },
      ],
      projects: [
        {
          title: 'Scout AI Agent',
          description:
            'Built an AI agent platform using LangGraph and Gemini for autonomous discovery',
          technologies: ['LangGraph', 'Gemini', 'TypeScript'],
        },
        {
          title: 'E-commerce API',
          description: 'Backend REST API built with Express and MongoDB',
          technologies: ['Express', 'MongoDB', 'NodeJS'],
        },
        {
          title: 'Web Extension',
          description: 'Chrome Extension for bookmarking',
          technologies: ['React', 'JavaScript'],
        },
      ],
    };

    const snapshot = builder.build(mockProfile, mockResume);

    // Verify Persona & Education
    expect(snapshot.persona).toBe('College Student');
    expect(snapshot.education.degree).toBe('B.Tech');
    expect(snapshot.education.branch).toBe('Computer Science');
    expect(snapshot.education.currentYear).toBe(3);
    expect(snapshot.education.graduationYear).toBe(2026);

    // Verify Technology Normalization
    expect(snapshot.technologies).toContain('react');
    expect(snapshot.technologies).toContain('nodejs');
    expect(snapshot.technologies).toContain('mongodb');
    expect(snapshot.technologies).toContain('express');
    expect(snapshot.technologies).toContain('typescript');
    expect(snapshot.technologies).toContain('langgraph');
    expect(snapshot.technologies).toContain('gemini');

    // Verify Strongest Technologies
    expect(snapshot.strongestTechnologies).toEqual(
      expect.arrayContaining([
        'express',
        'gemini',
        'langgraph',
        'mongodb',
        'nodejs',
        'react',
        'typescript',
      ]),
    );

    // Verify Projects & Categorization
    expect(snapshot.projects).toHaveLength(3);
    expect(snapshot.projects[0].category).toBe('AI Platform');
    expect(snapshot.projects[1].category).toBe('Backend System');
    expect(snapshot.projects[2].category).toBe('Browser Extension');

    // Verify Experience
    expect(snapshot.experience).toHaveLength(2);
    expect(snapshot.experience[0].company).toBe('Acme Corp');

    // Verify Strengths
    expect(snapshot.strengths).toContain('Full-stack development');
    expect(snapshot.strengths).toContain('AI application development');
    expect(snapshot.strengths).toContain('Cloud deployment');

    // Verify Opportunity Types
    expect(snapshot.opportunityTypes).toContain('Internship');
    expect(snapshot.opportunityTypes).toContain('Hackathon');
    expect(snapshot.opportunityTypes).toContain('Competition');

    // Verify Preferences
    expect(snapshot.preferences.startup).toBe(true);
    expect(snapshot.preferences.remote).toBe(true);
    expect(snapshot.preferences.womenOnly).toBe(false);
  });
});
