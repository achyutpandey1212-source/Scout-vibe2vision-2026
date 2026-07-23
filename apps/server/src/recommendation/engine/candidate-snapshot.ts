import { IProfile } from '../../profile/models/profile.model';
import { IResume } from '../../profile/models/resume.model';

export interface ProjectSnapshot {
  title: string;
  technologies: string[];
  summary: string;
  category: string;
}

export interface ExperienceSnapshot {
  company: string;
  role: string;
}

export interface CandidateSnapshot {
  persona: string;

  education: {
    degree: string;
    branch: string;
    currentYear?: number;
    graduationYear?: number;
  };

  goals: string[];

  motivations: string[];

  preferredRoles: string[];

  opportunityTypes: string[];

  technicalSkills: string[];

  technologies: string[];

  strongestTechnologies: string[];

  projects: ProjectSnapshot[];

  experience: ExperienceSnapshot[];

  strengths: string[];

  confidenceProfile: {
    hesitation: string;
    stretch: string;
    applicationConfidence: string;
  };

  preferences: {
    womenOnly: boolean;
    startup: boolean;
    government: boolean;
    remote: boolean;
  };
}

/**
 * Normalization map for tech stack canonical representations.
 */
const CANONICAL_TECH_MAP: Record<string, string> = {
  react: 'react',
  'react.js': 'react',
  reactjs: 'react',
  'react js': 'react',
  node: 'nodejs',
  nodejs: 'nodejs',
  'node.js': 'nodejs',
  'node js': 'nodejs',
  mongo: 'mongodb',
  mongodb: 'mongodb',
  'mongo db': 'mongodb',
  next: 'nextjs',
  nextjs: 'nextjs',
  'next.js': 'nextjs',
  express: 'express',
  expressjs: 'express',
  'express.js': 'express',
  vue: 'vue',
  vuejs: 'vue',
  'vue.js': 'vue',
  angular: 'angular',
  angularjs: 'angular',
  ts: 'typescript',
  typescript: 'typescript',
  js: 'javascript',
  javascript: 'javascript',
  py: 'python',
  python: 'python',
  cpp: 'cpp',
  'c++': 'cpp',
  csharp: 'csharp',
  'c#': 'csharp',
  docker: 'docker',
  kubernetes: 'kubernetes',
  k8s: 'kubernetes',
  aws: 'aws',
  gcp: 'gcp',
  firebase: 'firebase',
  redis: 'redis',
  git: 'git',
  github: 'github',
  gemini: 'gemini',
  langgraph: 'langgraph',
  langchain: 'langchain',
  llm: 'llm',
  openai: 'openai',
  pytorch: 'pytorch',
  tensorflow: 'tensorflow',
  tailwindcss: 'tailwindcss',
  tailwind: 'tailwindcss',
};

/**
 * Display names for formatting in summary logs and output representations.
 */
const TECH_DISPLAY_MAP: Record<string, string> = {
  react: 'React',
  nodejs: 'Node.js',
  mongodb: 'MongoDB',
  nextjs: 'Next.js',
  express: 'Express',
  vue: 'Vue',
  angular: 'Angular',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  cpp: 'C++',
  csharp: 'C#',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  aws: 'AWS',
  gcp: 'GCP',
  firebase: 'Firebase',
  redis: 'Redis',
  git: 'Git',
  github: 'GitHub',
  gemini: 'Gemini',
  langgraph: 'LangGraph',
  langchain: 'LangChain',
  llm: 'LLM',
  openai: 'OpenAI',
  pytorch: 'PyTorch',
  tensorflow: 'TensorFlow',
  tailwindcss: 'Tailwind CSS',
};

/**
 * Deterministic Candidate Snapshot Builder
 * Combines UserProfile and Resume into a normalized, single CandidateSnapshot object.
 */
export class CandidateSnapshotBuilder {
  /**
   * Main builder method converting UserProfile + Resume into CandidateSnapshot
   */
  public build(
    profile: Partial<IProfile> | any,
    resume: Partial<IResume> | any | null,
  ): CandidateSnapshot {
    // 1. Persona Normalization
    const persona = this.formatPersona(profile?.persona);

    // 2. Education Setup
    const education = {
      degree: profile?.degree || resume?.education?.[0]?.degree || '',
      branch: profile?.branch || resume?.education?.[0]?.fieldOfStudy || '',
      currentYear: profile?.currentYear || undefined,
      graduationYear: profile?.expectedGraduation || undefined,
    };

    // 3. Goals & Motivations Extraction
    const rawGoals = Array.isArray(profile?.careerGoals) ? profile.careerGoals : [];
    const goals = rawGoals.filter((g: string) => typeof g === 'string' && g.trim().length > 0);

    const motivations = this.extractMotivations(profile);

    // 4. Technology & Skill Normalization
    const { normalizedTechs, techCounts } = this.extractAndNormalizeTechnologies(profile, resume);
    const strongestTechnologies = this.extractStrongestTechnologies(techCounts, normalizedTechs);

    // 5. Projects Extraction & Categorization
    const projects = this.extractProjectSnapshots(resume, profile);

    // 6. Experience Extraction
    const experience = this.extractExperienceSnapshots(resume);

    // 7. Strengths Extraction
    const strengths = this.extractStrengths(normalizedTechs, projects);

    // 8. Preferred Roles
    const preferredRoles = this.resolvePreferredRoles(profile?.preferredRoles, normalizedTechs);

    // 9. Opportunity Types
    const opportunityTypes = this.resolveOpportunityTypes(profile?.opportunityPreferences);

    // 10. Confidence Profile
    const confidenceProfile = {
      hesitation: profile?.hesitationLevel || profile?.confidenceProfile?.hesitation || 'Medium',
      stretch: profile?.stretchPreference || profile?.confidenceProfile?.stretch || 'Medium',
      applicationConfidence:
        profile?.applicationConfidence ||
        profile?.confidenceProfile?.applicationConfidence ||
        'Medium',
    };

    // 11. Preferences
    const preferences = {
      womenOnly: Boolean(profile?.womenOnlyPreference),
      startup: Boolean(profile?.startupPreference),
      government: Boolean(profile?.governmentPreference),
      remote: Boolean(
        typeof profile?.remotePreference === 'boolean'
          ? profile.remotePreference
          : profile?.remotePreference === 'true' || profile?.remotePreference === 'Remote',
      ),
    };

    const snapshot: CandidateSnapshot = {
      persona,
      education,
      goals,
      motivations,
      preferredRoles,
      opportunityTypes,
      technicalSkills: normalizedTechs,
      technologies: normalizedTechs,
      strongestTechnologies,
      projects,
      experience,
      strengths,
      confidenceProfile,
      preferences,
    };

    return snapshot;
  }

  /**
   * Formats persona string to Title Case representation
   */
  private formatPersona(personaRaw?: string): string {
    if (!personaRaw) return 'College Student';
    switch (personaRaw) {
      case 'COLLEGE_STUDENT':
        return 'College Student';
      case 'WORKING_PROFESSIONAL':
        return 'Working Professional';
      case 'RETURN_TO_WORK':
        return 'Return to Work';
      case 'CAREER_SWITCHER':
        return 'Career Switcher';
      default:
        return personaRaw
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }

  /**
   * Normalizes a raw tech string to a canonical token
   */
  private normalizeTechToken(raw: string): string {
    if (!raw || typeof raw !== 'string') return '';
    const clean = raw.trim().toLowerCase();
    if (CANONICAL_TECH_MAP[clean]) {
      return CANONICAL_TECH_MAP[clean];
    }
    // Fallback cleaning
    return clean.replace(/\.js$/i, '').replace(/[\s.-]+/g, '');
  }

  /**
   * Aggregates technologies from Profile and Resume, tracks frequency counts, and returns sorted normalized array
   */
  private extractAndNormalizeTechnologies(
    profile: Partial<IProfile> | any,
    resume: Partial<IResume> | any | null,
  ): { normalizedTechs: string[]; techCounts: Map<string, number> } {
    const techCounts = new Map<string, number>();

    const addTech = (raw: string) => {
      const norm = this.normalizeTechToken(raw);
      if (norm && norm.length > 0) {
        techCounts.set(norm, (techCounts.get(norm) || 0) + 1);
      }
    };

    // From Profile
    if (Array.isArray(profile?.technicalSkills)) profile.technicalSkills.forEach(addTech);
    if (Array.isArray(profile?.tools)) profile.tools.forEach(addTech);
    if (Array.isArray(profile?.languages)) profile.languages.forEach(addTech);

    // From Resume Skills
    if (Array.isArray(resume?.skills)) resume.skills.forEach(addTech);

    // From Resume Projects
    if (Array.isArray(resume?.projects)) {
      resume.projects.forEach((proj: any) => {
        if (Array.isArray(proj.technologies)) {
          proj.technologies.forEach(addTech);
        }
      });
    }

    const normalizedTechs = Array.from(techCounts.keys()).sort();
    return { normalizedTechs, techCounts };
  }

  /**
   * Detects strongest technologies based on cross-source frequency & presence
   */
  private extractStrongestTechnologies(
    techCounts: Map<string, number>,
    normalizedTechs: string[],
  ): string[] {
    const strongest: string[] = [];

    techCounts.forEach((count, tech) => {
      if (count >= 2) {
        strongest.push(tech);
      }
    });

    // Fallback if frequency detection yields fewer than 3 items
    if (strongest.length < 3) {
      for (const tech of normalizedTechs) {
        if (!strongest.includes(tech)) {
          strongest.push(tech);
          if (strongest.length >= 8) break;
        }
      }
    }

    return strongest.sort();
  }

  /**
   * Extracts project snapshots and infers category deterministically
   */
  private extractProjectSnapshots(
    resume: Partial<IResume> | any | null,
    _profile: Partial<IProfile> | any,
  ): ProjectSnapshot[] {
    const snapshots: ProjectSnapshot[] = [];
    const rawProjects = Array.isArray(resume?.projects) ? resume.projects : [];

    rawProjects.forEach((p: any) => {
      const title = p.title || 'Project';
      const rawTechs = Array.isArray(p.technologies) ? p.technologies : [];
      const technologies = Array.from(
        new Set(
          rawTechs.map((t: any) => this.normalizeTechToken(String(t))).filter(Boolean) as string[],
        ),
      );
      const summary = p.description || p.summary || '';
      const category = this.inferProjectCategory(title, technologies, summary);

      snapshots.push({
        title,
        technologies,
        summary,
        category,
      });
    });

    return snapshots;
  }

  /**
   * Infers project category deterministically based on tech stack, title, and description
   */
  private inferProjectCategory(title: string, technologies: string[], summary: string): string {
    const text = `${title} ${technologies.join(' ')} ${summary}`.toLowerCase();

    if (
      text.includes('langgraph') ||
      text.includes('gemini') ||
      text.includes('llm') ||
      text.includes('ai') ||
      text.includes('pytorch') ||
      text.includes('tensorflow') ||
      text.includes('openai') ||
      text.includes('gpt') ||
      text.includes('claude') ||
      text.includes('machine learning') ||
      text.includes('nlp')
    ) {
      return 'AI Platform';
    }

    if (
      text.includes('express') ||
      text.includes('mongo') ||
      text.includes('rest') ||
      text.includes('backend') ||
      text.includes('node') ||
      text.includes('sql') ||
      text.includes('postgres') ||
      text.includes('fastapi') ||
      text.includes('django')
    ) {
      return 'Backend System';
    }

    if (
      text.includes('chrome extension') ||
      text.includes('browser extension') ||
      text.includes('browser') ||
      text.includes('extension')
    ) {
      return 'Browser Extension';
    }

    if (
      text.includes('next.js') ||
      text.includes('nextjs') ||
      text.includes('react') ||
      text.includes('vue') ||
      text.includes('angular') ||
      text.includes('full stack') ||
      text.includes('fullstack') ||
      text.includes('mern')
    ) {
      return 'Full Stack Web App';
    }

    if (
      text.includes('react native') ||
      text.includes('flutter') ||
      text.includes('ios') ||
      text.includes('android') ||
      text.includes('swift') ||
      text.includes('kotlin') ||
      text.includes('mobile')
    ) {
      return 'Mobile Application';
    }

    if (
      text.includes('docker') ||
      text.includes('kubernetes') ||
      text.includes('cloud run') ||
      text.includes('aws') ||
      text.includes('gcp') ||
      text.includes('devops')
    ) {
      return 'Cloud Infrastructure';
    }

    return 'Software System';
  }

  /**
   * Extracts experience snapshots
   */
  private extractExperienceSnapshots(resume: Partial<IResume> | any | null): ExperienceSnapshot[] {
    const snapshots: ExperienceSnapshot[] = [];
    const rawExp = Array.isArray(resume?.experience) ? resume.experience : [];

    rawExp.forEach((e: any) => {
      snapshots.push({
        company: e.company || '',
        role: e.role || '',
      });
    });

    return snapshots;
  }

  /**
   * Generates deterministic strengths array (3-8 strengths) based on skills and projects
   */
  private extractStrengths(normalizedTechs: string[], projects: ProjectSnapshot[]): string[] {
    const strengthsSet = new Set<string>();
    const techSet = new Set(normalizedTechs);

    const hasFrontend = techSet.has('react') || techSet.has('nextjs') || techSet.has('vue');
    const hasBackend =
      techSet.has('nodejs') ||
      techSet.has('express') ||
      techSet.has('mongodb') ||
      techSet.has('redis') ||
      techSet.has('postgres');

    if (hasFrontend && hasBackend) {
      strengthsSet.add('Full-stack development');
    }

    if (
      techSet.has('gemini') ||
      techSet.has('langgraph') ||
      techSet.has('langchain') ||
      techSet.has('llm') ||
      techSet.has('openai') ||
      techSet.has('pytorch') ||
      techSet.has('tensorflow') ||
      projects.some((p) => p.category === 'AI Platform')
    ) {
      strengthsSet.add('AI application development');
    }

    if (
      techSet.has('docker') ||
      techSet.has('kubernetes') ||
      techSet.has('cloud run') ||
      techSet.has('firebase') ||
      techSet.has('aws') ||
      techSet.has('gcp')
    ) {
      strengthsSet.add('Cloud deployment');
    }

    if (techSet.has('redis') || techSet.has('mongodb') || techSet.has('postgres')) {
      strengthsSet.add('Backend optimization');
    }

    if (techSet.has('git') || techSet.has('github')) {
      strengthsSet.add('Collaborative development');
    }

    if (techSet.has('reactnative') || techSet.has('flutter')) {
      strengthsSet.add('Mobile application development');
    }

    if (hasFrontend && !strengthsSet.has('Full-stack development')) {
      strengthsSet.add('Frontend engineering');
    }

    // Default fallback strengths if fewer than 3 generated
    if (strengthsSet.size < 3) {
      strengthsSet.add('Problem solving');
      strengthsSet.add('Software engineering principles');
    }

    return Array.from(strengthsSet).slice(0, 8);
  }

  /**
   * Extracts motivations array from primaryMotivation, secondaryMotivations, and careerGoals
   */
  private extractMotivations(profile: Partial<IProfile> | any): string[] {
    const list: string[] = [];
    if (profile?.primaryMotivation && typeof profile.primaryMotivation === 'string') {
      const prim = profile.primaryMotivation.trim();
      if (prim) list.push(prim);
    }
    if (Array.isArray(profile?.secondaryMotivations)) {
      profile.secondaryMotivations.forEach((m: string) => {
        if (typeof m === 'string' && m.trim()) list.push(m.trim());
      });
    }
    if (Array.isArray(profile?.careerGoals)) {
      profile.careerGoals.forEach((g: string) => {
        if (typeof g === 'string' && g.trim() && !list.includes(g.trim())) {
          list.push(g.trim());
        }
      });
    }
    return Array.from(new Set(list));
  }

  /**
   * Resolves preferred roles (using profile's or inferring from technologies)
   */
  private resolvePreferredRoles(profileRoles: unknown, normalizedTechs: string[]): string[] {
    if (Array.isArray(profileRoles) && profileRoles.length > 0) {
      const validRoles = profileRoles.filter(
        (r): r is string => typeof r === 'string' && r.trim().length > 0,
      );
      if (validRoles.length > 0) return validRoles;
    }

    const roles: string[] = [];
    const techSet = new Set(normalizedTechs);

    if (techSet.has('react') && techSet.has('nodejs')) {
      roles.push('Full Stack Intern', 'Backend Intern', 'Software Engineering Intern');
    } else if (techSet.has('react')) {
      roles.push('Frontend Intern', 'Web Developer Intern');
    } else if (techSet.has('nodejs') || techSet.has('express')) {
      roles.push('Backend Intern', 'Software Engineering Intern');
    }

    if (techSet.has('langgraph') || techSet.has('gemini') || techSet.has('llm')) {
      roles.push('AI Engineer Intern');
    }

    if (roles.length === 0) {
      roles.push('Software Engineering Intern');
    }

    return Array.from(new Set(roles));
  }

  /**
   * Resolves opportunity types from opportunityPreferences flags
   */
  private resolveOpportunityTypes(prefs: any): string[] {
    if (!prefs || typeof prefs !== 'object') {
      return ['Internship', 'Hackathon', 'Competition'];
    }

    const types: string[] = [];
    if (prefs.internships) types.push('Internship');
    if (prefs.hackathons) types.push('Hackathon');
    if (prefs.competitions) types.push('Competition');
    if (prefs.scholarships) types.push('Scholarship');
    if (prefs.training || prefs.bootcamps) types.push('Training');
    if (prefs.opensource) types.push('Open Source');
    if (prefs.research) types.push('Research');
    if (prefs.events) types.push('Event');
    if (prefs.volunteer) types.push('Volunteer');
    if (prefs.earlyCareerPrograms) types.push('Early Career');
    if (prefs.partTime) types.push('Part Time');

    return types.length > 0 ? types : ['Internship', 'Hackathon', 'Competition'];
  }

  /**
   * Helper to format a tech token for display in logs
   */
  private formatTechDisplay(tech: string): string {
    if (TECH_DISPLAY_MAP[tech]) return TECH_DISPLAY_MAP[tech];
    return tech.charAt(0).toUpperCase() + tech.slice(1);
  }

  /**
   * Logs summary block of Candidate Snapshot
   */
  private logSummary(snapshot: CandidateSnapshot): void {
    console.log(`
Candidate Snapshot
==========================

Persona:
${snapshot.persona}

Goals:
${snapshot.goals.length > 0 ? snapshot.goals.map((g) => `- ${g}`).join('\n') : '- N/A'}

Strongest Technologies:
${snapshot.strongestTechnologies.map((t) => `- ${this.formatTechDisplay(t)}`).join('\n')}

Strengths:
${snapshot.strengths.map((s) => `- ${s}`).join('\n')}

Projects:
${snapshot.projects.length}

Experience:
${snapshot.experience.length}

Preferred Roles:
${snapshot.preferredRoles.map((r) => `- ${r}`).join('\n')}

Opportunity Types:
${snapshot.opportunityTypes.map((o) => `- ${o}`).join('\n')}

==========================
`);
  }
}
