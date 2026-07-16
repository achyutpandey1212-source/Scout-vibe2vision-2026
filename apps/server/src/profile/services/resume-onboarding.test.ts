import { describe, it, expect } from 'vitest';
import { ResumeSectionParser } from './resume-section-parser';
import { SkillNormalizer } from './skill-normalizer';
import { ProfileMergeEngine } from './profile-merge-engine';

describe('Resume Onboarding Services', () => {
  describe('ResumeSectionParser', () => {
    it('should parse section headers and extract graduation year & links', () => {
      const rawText = `
        Maya Malhotra
        Education:
        B.Tech in Computer Science
        Delhi Technological University, 2027
        Skills:
        React, Next.js, Node.js, Python, Git
        Projects:
        Scout App - React platform
        Links:
        https://github.com/mayamalhotra
      `;

      const result = ResumeSectionParser.parse(rawText);

      expect(result.detectedDegree).toBe('B.Tech');
      expect(result.detectedGraduationYear).toBe(2027);
      expect(result.detectedLinks).toContainEqual({
        label: 'GitHub',
        url: 'https://github.com/mayamalhotra',
      });
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0.5);
      expect(result.warnings.length).toBeLessThanOrEqual(2);
    });

    it('should parse complex resume texts containing engineering branches, project list and experience details', () => {
      const complexText = `
        Maya Malhotra
        Education:
        Delhi Technological University, 2027
        B.Tech in Electronics and Communication Engineering
        
        Skills:
        React, Next.js, Node.js, Python, Git, MongoDB, Firebase
        
        Projects:
        Zenkai
        Built a dashboard app using React and MongoDB to track metrics.
        https://github.com/maya/zenkai
        
        Nikshep
        Implemented a local waste collection system with Node.js and Firebase.
        
        Instagram Clone
        React application mimicking social media feed.
        
        Experience:
        Google Student Ambassador (Jan 2025 - Present)
        Google developer group lead and coordinator for university events.
        
        HackHazard Campus Ambassador
        Lead coordinator and promoter for national hackathons.
      `;

      const result = ResumeSectionParser.parse(complexText);

      expect(result.detectedFieldOfStudy).toBe('Electronics and Communication Engineering');

      expect(result.detectedProjects.length).toBe(3);
      expect(result.detectedProjects[0].title).toBe('Zenkai');
      expect(result.detectedProjects[0].technologies).toContain('react');
      expect(result.detectedProjects[0].technologies).toContain('mongodb');
      expect(result.detectedProjects[0].githubLink).toBeUndefined();
      expect(result.detectedProjects[1].title).toBe('Nikshep');
      expect(result.detectedProjects[2].title).toBe('Instagram Clone');

      expect(result.detectedExperience.length).toBe(2);
      expect(result.detectedExperience[0].role).toBe('Google Student Ambassador');
      expect(result.detectedExperience[0].organization).toBe('Google');
      expect(result.detectedExperience[0].startDate).toBe('Jan 2025');
      expect(result.detectedExperience[0].endDate).toBe('Present');
      expect(result.detectedExperience[1].role).toBe('HackHazard Campus Ambassador');
      expect(result.detectedExperience[1].organization).toBe('HackHazard');
    });

    it('should add warnings and lower confidence if fields are missing', () => {
      const rawText = 'Maya Malhotra';
      const result = ResumeSectionParser.parse(rawText);

      expect(result.overallConfidence).toBe(0);
      expect(result.warnings).toContain('Could not confidently detect college institution');
      expect(result.warnings).toContain('Could not confidently detect engineering branch');
      expect(result.warnings).toContain('Projects section missing');
    });

    it('should parse projects correctly from achyut_resume(2) sample format', () => {
      const sampleText = `
Projects
1. Zenkai — AI Growth Operating System
GitHub |Live Demo|Google Docs
Tech: Next.js • React • TypeScript • Node.js • MongoDB • Gemini • LangGraph-inspired Multi-Agent Architecture •
Firebase Auth • Google Calendar API • Docker • Google Cloud Run • Resend
• Built an AI Growth Operating System using a multi-agent architecture for planning, scheduling, memory, identity evolution, and
reflection.
• Designed persistent memory and adaptive scheduling that continuously evolve based on user conversations and long-term goals.
• Built a modern command palette with deterministic slash commands for instant task and schedule management while preserving
conversational AI for strategic reasoning.
• Integrated Google Calendar synchronization, automated email briefings, and persistent memory across multiple AI workflows..
• Architected a provider-agnostic LLM layer supporting multiple AI providers through a unified interface, enabling seamless model
switching and future extensibility.
2. Nikshep — Personal AI Memory System
GitHub | Live Demo
Tech: React, Node.js, Express, MongoDB, Embeddings, AI API
• Built browser extension for one-click capture of webpages
• Implemented semantic search using embeddings for context-based retrieval
• Designed scalable backend APIs for ingestion, AI enrichment, and retrieval pipeline
• Integrated AI for metadata cleaning, tagging, and contextual resurfacing
• Optimized performance achieving 100/100 Lighthouse score
• Improved reliability using fallback extraction system
3. Instagram Clone — MERN Social Media App
GitHub | Live Demo
Tech: React, Node.js, Express, MongoDB, JWT, SCSS, ImageKit, Multer
• Built a MERN-stack social media platform with authentication, user profiles, and post feeds.
• Implemented JWT cookie authentication with bcrypt password hashing.
• Built REST APIs using Express and MongoDB with Mongoose.
• Implemented social features including posts, likes, nested comments, bookmarks, and follow requests.
• Integrated ImageKit for cloud image storage and deployed the application on Render.
      `;

      const result = ResumeSectionParser.parse(sampleText);

      expect(result.detectedProjects.length).toBe(3);

      expect(result.detectedProjects[0].title).toBe('Zenkai — AI Growth Operating System');
      expect(result.detectedProjects[0].technologies).toContain('nextjs');
      expect(result.detectedProjects[0].technologies).toContain('react');
      expect(result.detectedProjects[0].technologies).toContain('typescript');
      expect(result.detectedProjects[0].technologies).toContain('mongodb');
      expect(result.detectedProjects[0].technologies).toContain('gemini');
      expect(result.detectedProjects[0].technologies).toContain('docker');
      expect(result.detectedProjects[0].technologies).toContain('cloudrun');
      expect(result.detectedProjects[0].technologies).toContain('resend');
      expect(result.detectedProjects[0].technologies).toContain('firebaseauth');
      expect(result.detectedProjects[0].technologies).toContain('googlecalendarapi');
      expect(result.detectedProjects[0].description).toContain('reflection.');
      expect(result.detectedProjects[0].description).toContain(
        'switching and future extensibility.',
      );

      expect(result.detectedProjects[1].title).toBe('Nikshep — Personal AI Memory System');
      expect(result.detectedProjects[1].technologies).toContain('react');
      expect(result.detectedProjects[1].technologies).toContain('nodejs');
      expect(result.detectedProjects[1].technologies).toContain('express');
      expect(result.detectedProjects[1].description).toContain(
        'Built browser extension for one-click capture of webpages',
      );

      expect(result.detectedProjects[2].title).toBe('Instagram Clone — MERN Social Media App');
      expect(result.detectedProjects[2].technologies).toContain('react');
      expect(result.detectedProjects[2].technologies).toContain('express');
      expect(result.detectedProjects[2].technologies).toContain('multer');
      expect(result.detectedProjects[2].technologies).toContain('imagekit');
    });
  });

  describe('SkillNormalizer', () => {
    it('should map standard skill names and aliases to lowercase IDs', () => {
      const text = 'I know React, python, firestore, and Docker.';
      const normalized = SkillNormalizer.normalize(text);

      expect(normalized).toContain('react');
      expect(normalized).toContain('python');
      expect(normalized).toContain('firebase'); // alias of firestore
      expect(normalized).toContain('docker');
    });
  });

  describe('ProfileMergeEngine', () => {
    it('should merge data correctly and avoid duplicate skills', () => {
      const existingProfile = {
        fullName: 'Maya',
        college: '',
        technicalSkills: ['react'],
        githubConnected: false,
      };

      const editData = {
        fullName: 'Maya Malhotra',
        college: 'Delhi Technological University',
        technicalSkills: ['react', 'python', 'mongodb'],
        detectedLinks: [{ label: 'GitHub', url: 'https://github.com/mayamalhotra' }],
      };

      const merged = ProfileMergeEngine.merge(existingProfile, editData);

      expect(merged.fullName).toBe('Maya Malhotra');
      expect(merged.college).toBe('Delhi Technological University');
      expect(merged.technicalSkills).toEqual(['react', 'python', 'mongodb']);
      expect(merged.githubConnected).toBe(true);
    });
  });
});
