import {
  ITechnicalProfile,
  IExperienceSummary,
  IRecommendationInsights,
  IOpportunitySummary,
  ICandidateBrief,
  IOpportunityBrief,
  IMatchIntelligence,
  IPortfolioSummary,
} from './context.types';

/**
 * Normalizes and groups candidate skills into strict categories.
 */
export function groupSkillsByCategory(skills: string[]): ITechnicalProfile {
  const result: ITechnicalProfile = {
    languages: [],
    frameworks: [],
    backend: [],
    frontend: [],
    databases: [],
    cloud: [],
    aiMl: [],
    tools: [],
    other: [],
  };

  const lowerSkills = (skills || []).map((s) => s.toLowerCase().trim());

  // Define keyword mappings for standard categorizations
  const mappings = {
    languages: [
      'javascript',
      'typescript',
      'js',
      'ts',
      'python',
      'py',
      'java',
      'c++',
      'cpp',
      'golang',
      'go',
      'rust',
      'ruby',
      'php',
      'html',
      'css',
      'c#',
      'csharp',
      'swift',
      'kotlin',
      'sql',
    ],
    frameworks: [
      'react',
      'next',
      'angular',
      'vue',
      'express',
      'django',
      'flask',
      'spring',
      'nest',
      'svelte',
      'nuxt',
      'bootstrap',
      'tailwind',
    ],
    backend: [
      'node',
      'backend',
      'microservices',
      'restful api',
      'rest api',
      'grpc',
      'graphql',
      'apollo',
      'graphql apis',
      'restful apis',
      'fastapi',
    ],
    frontend: [
      'redux',
      'state management',
      'html5',
      'css3',
      'frontend',
      'ui/ux',
      'sass',
      'less',
      'webpack',
      'vite',
    ],
    databases: [
      'mongodb',
      'postgres',
      'redis',
      'mysql',
      'cassandra',
      'dynamodb',
      'firebase',
      'firestore',
      'sqlite',
      'mariadb',
      'oracle',
      'neo4j',
    ],
    cloud: [
      'aws',
      'gcp',
      'azure',
      'docker',
      'kubernetes',
      'k8s',
      'serverless',
      'devops',
      'ci/cd',
      'terraform',
      'jenkins',
      'github actions',
      'nginx',
    ],
    aiMl: [
      'tensorflow',
      'pytorch',
      'llm',
      'gemini',
      'langchain',
      'langgraph',
      'scikit-learn',
      'ai',
      'ml',
      'deep learning',
      'computer vision',
      'openai',
      'nlp',
      'keras',
      'pandas',
      'numpy',
    ],
    tools: ['git', 'github', 'jira', 'figma', 'postman', 'vscode', 'trello', 'npm', 'yarn', 'pnpm'],
  };

  for (const skill of skills) {
    const sLower = skill.toLowerCase().trim();
    let categorized = false;

    for (const [category, keywords] of Object.entries(mappings)) {
      if (keywords.some((k) => sLower.includes(k) || k.includes(sLower))) {
        result[category as keyof typeof mappings].push(skill);
        categorized = true;
      }
    }

    if (!categorized) {
      result.other.push(skill);
    }
  }

  // Deduplicate categories
  for (const key of Object.keys(result)) {
    result[key as keyof ITechnicalProfile] = Array.from(
      new Set(result[key as keyof ITechnicalProfile]),
    );
  }

  return result;
}

/**
 * Categorizes resume experience entries into semantic types.
 */
export function categorizeExperience(experience: any[]): IExperienceSummary {
  const summary: IExperienceSummary = {
    internships: [],
    leadership: [],
    research: [],
    hackathons: [],
    openSource: [],
    freelancing: [],
    teaching: [],
    majorAchievements: [],
  };

  if (!experience || !Array.isArray(experience)) {
    return summary;
  }

  for (const exp of experience) {
    const role = (exp.role || exp.title || '').toLowerCase();
    const company = (exp.company || '').toLowerCase();
    const desc = (exp.description || '').toLowerCase();

    const formattedEntry = `${exp.role || 'Member'} at ${exp.company || 'Organization'}`;

    if (role.includes('intern') || desc.includes('intern')) {
      summary.internships.push(formattedEntry);
    } else if (
      role.includes('lead') ||
      role.includes('head') ||
      role.includes('president') ||
      role.includes('founder') ||
      role.includes('co-founder') ||
      role.includes('captain') ||
      desc.includes('led a team') ||
      desc.includes('managed a team')
    ) {
      summary.leadership.push(formattedEntry);
    } else if (
      role.includes('research') ||
      desc.includes('research') ||
      company.includes('research')
    ) {
      summary.research.push(formattedEntry);
    } else if (
      role.includes('hackathon') ||
      desc.includes('hackathon') ||
      company.includes('hackathon')
    ) {
      summary.hackathons.push(formattedEntry);
    } else if (
      role.includes('teaching') ||
      role.includes('tutor') ||
      role.includes('instructor') ||
      role.includes('ta ') ||
      role.includes('assistant')
    ) {
      summary.teaching.push(formattedEntry);
    } else if (role.includes('freelance') || desc.includes('freelance')) {
      summary.freelancing.push(formattedEntry);
    } else if (
      desc.includes('open source') ||
      desc.includes('contributor') ||
      desc.includes('gsoc')
    ) {
      summary.openSource.push(formattedEntry);
    } else {
      if (role.length > 0) {
        summary.internships.push(formattedEntry);
      }
    }

    if (
      desc.includes('won') ||
      desc.includes('award') ||
      desc.includes('first place') ||
      desc.includes('top')
    ) {
      summary.majorAchievements.push(
        `${exp.role || 'Role'}: ${exp.description || 'Awarded achievement'}`,
      );
    }
  }

  return summary;
}

/**
 * Maps opportunity details to work mode.
 */
export function mapWorkMode(opportunity: any): 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown' {
  if (!opportunity) return 'Unknown';
  if (opportunity.remote === true || String(opportunity.remote).toLowerCase() === 'true') {
    return 'Remote';
  }
  const desc =
    `${opportunity.title || ''} ${opportunity.description || ''} ${opportunity.summary || ''}`.toLowerCase();
  if (desc.includes('work from home') || desc.includes('remote')) {
    return 'Remote';
  }
  if (desc.includes('hybrid')) {
    return 'Hybrid';
  }
  if (desc.includes('onsite') || desc.includes('in-office') || desc.includes('office')) {
    return 'Onsite';
  }
  return 'Unknown';
}

/**
 * Computes deterministic insights based on scores, preferences, and opportunity requirements.
 */
export function determineInsights(
  totalScore: number,
  breakdown: any,
  opportunity: any,
  snapshot: any,
): IRecommendationInsights {
  const careerStage = snapshot.education?.currentYear
    ? `${snapshot.education.currentYear}th year student`
    : 'Entry Level';

  const score = totalScore;

  let estimatedCompetitiveness: 'High' | 'Medium' | 'Low' = 'Medium';
  if (score >= 85) estimatedCompetitiveness = 'Low';
  else if (score < 60) estimatedCompetitiveness = 'High';

  let applicationUrgency: 'High' | 'Medium' | 'Low' = 'Medium';
  if (opportunity.deadline) {
    const diff = new Date(opportunity.deadline).getTime() - Date.now();
    if (diff < 3 * 24 * 60 * 60 * 1000 && diff > 0) {
      applicationUrgency = 'High';
    } else if (diff < 0) {
      applicationUrgency = 'Low';
    }
  }

  let growthPotential: 'High' | 'Medium' | 'Low' = 'Medium';
  if (breakdown?.careerGoal > 15) growthPotential = 'High';
  else if (breakdown?.careerGoal < 8) growthPotential = 'Low';

  let learningPotential: 'High' | 'Medium' | 'Low' = 'Medium';
  if (breakdown?.projectMatch > 15) learningPotential = 'High';
  else if (breakdown?.projectMatch < 8) learningPotential = 'Low';

  let resumeFit: 'High' | 'Medium' | 'Low' = 'Medium';
  if (breakdown?.skillMatch > 20) resumeFit = 'High';
  else if (breakdown?.skillMatch < 10) resumeFit = 'Low';

  const confidenceScore = Math.round(score * 0.95);
  const priorityScore = Math.round(score + (applicationUrgency === 'High' ? 10 : 0));

  return {
    careerStage,
    estimatedCompetitiveness,
    applicationUrgency,
    growthPotential,
    learningPotential,
    resumeFit,
    confidenceScore,
    priorityScore,
  };
}

/**
 * Generates a human-readable recommendation summary.
 */
export function generateHumanReadableSummary(
  userProfile: any,
  careerGoals: any,
  technicalProfile: any,
  oppSummary: IOpportunitySummary,
  matchAnalysis: any,
  insights: IRecommendationInsights,
): string {
  const name = userProfile.name || 'The candidate';
  const degree = userProfile.degree || 'Engineering';
  const branch = userProfile.branch || 'computer science';
  const stage = insights.careerStage;

  const topSkills = matchAnalysis.topMatchingSkills.slice(0, 3).join(', ');
  const missing = matchAnalysis.missingSkills.slice(0, 2).join(', ');

  const title = oppSummary.title;
  const org = oppSummary.organization;

  let summary = `Candidate ${name} is a ${stage} studying ${degree} in ${branch}. `;
  summary += `They are actively seeking ${careerGoals.preferredRoles.slice(0, 2).join(' / ')} roles. `;
  summary += `This opportunity for a ${title} at ${org} aligns closely with their background. `;

  if (topSkills.length > 0) {
    summary += `They have strong matching skills in ${topSkills}. `;
  }

  if (missing.length > 0) {
    summary += `Minor preparation in ${missing} is recommended to bridge any gap.`;
  } else {
    summary += `They meet all major technical requirements for this role.`;
  }

  return summary;
}

/**
 * Generates deterministic strengths for CandidateBrief.
 */
export function generateDeterministicStrengths(skills: string[], snapshot: any): string[] {
  const lowerSkills = (skills || []).map((s) => s.toLowerCase());
  const strengths: string[] = [];

  if (
    lowerSkills.some(
      (s) =>
        s.includes('node') || s.includes('express') || s.includes('django') || s.includes('nest'),
    )
  ) {
    strengths.push('Strong backend foundation');
  }
  if (
    lowerSkills.some(
      (s) =>
        s.includes('ai') ||
        s.includes('ml') ||
        s.includes('llm') ||
        s.includes('gemini') ||
        s.includes('pytorch') ||
        s.includes('langchain') ||
        s.includes('langgraph'),
    )
  ) {
    strengths.push('Good AI workflow exposure');
  }
  if (snapshot?.projects && snapshot.projects.length > 0) {
    strengths.push('Practical project portfolio');
  }
  if (
    lowerSkills.some(
      (s) =>
        s.includes('javascript') ||
        s.includes('typescript') ||
        s.includes('react') ||
        s.includes('node'),
    )
  ) {
    strengths.push('Strong JavaScript ecosystem');
  }
  if (lowerSkills.some((s) => s.includes('sql') || s.includes('mongo') || s.includes('postgres'))) {
    strengths.push('Database design and query optimization');
  }
  if (strengths.length === 0) {
    strengths.push('Hands-on software development capability');
  }
  return strengths;
}

/**
 * Generates deterministic growth areas for CandidateBrief.
 */
export function generateDeterministicGrowthAreas(skills: string[]): string[] {
  const lowerSkills = (skills || []).map((s) => s.toLowerCase());
  const growthAreas: string[] = [];

  if (
    !lowerSkills.some((s) => s.includes('docker') || s.includes('k8s') || s.includes('kubernetes'))
  ) {
    growthAreas.push('Docker & containerization');
  }
  if (!lowerSkills.some((s) => s.includes('fastapi') || s.includes('grpc'))) {
    growthAreas.push('FastAPI & microservices');
  }
  if (!lowerSkills.some((s) => s.includes('test') || s.includes('jest') || s.includes('vitest'))) {
    growthAreas.push('Automated testing & CI/CD');
  }
  if (!lowerSkills.some((s) => s.includes('aws') || s.includes('gcp') || s.includes('azure'))) {
    growthAreas.push('Cloud deployment & serverless');
  }
  if (growthAreas.length === 0) {
    growthAreas.push('Advanced system design & performance tuning');
  }
  return growthAreas;
}
