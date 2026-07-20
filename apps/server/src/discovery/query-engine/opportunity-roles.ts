export interface OpportunityRole {
  id: string;
  displayName: string;
  keywords: string[];
  aliases: string[];
}

export const OPPORTUNITY_ROLES: Record<string, OpportunityRole> = {
  SOFTWARE_ENGINEER: {
    id: 'SOFTWARE_ENGINEER',
    displayName: 'Software Engineer',
    keywords: ['software engineer intern', 'sde intern', 'software developer intern'],
    aliases: ['sde', 'software engineer', 'software developer', 'engineering intern'],
  },
  BACKEND: {
    id: 'BACKEND',
    displayName: 'Backend Engineer',
    keywords: ['backend intern', 'backend engineer intern', 'backend developer intern'],
    aliases: ['backend', 'backend engineer', 'backend developer'],
  },
  FRONTEND: {
    id: 'FRONTEND',
    displayName: 'Frontend Engineer',
    keywords: ['frontend intern', 'frontend engineer intern', 'frontend developer intern'],
    aliases: ['frontend', 'frontend engineer', 'frontend developer'],
  },
  AI_ML: {
    id: 'AI_ML',
    displayName: 'AI / ML Engineer',
    keywords: ['ai intern', 'ml intern', 'machine learning intern', 'deep learning intern'],
    aliases: ['ai', 'ml', 'machine learning', 'artificial intelligence', 'nlp', 'computer vision'],
  },
  DATA_SCIENCE: {
    id: 'DATA_SCIENCE',
    displayName: 'Data Scientist',
    keywords: ['data science intern', 'data scientist intern'],
    aliases: ['data science', 'data scientist'],
  },
  DATA_ENGINEER: {
    id: 'DATA_ENGINEER',
    displayName: 'Data Engineer',
    keywords: ['data engineer intern', 'data engineering intern'],
    aliases: ['data engineer', 'data engineering'],
  },
  DEVOPS: {
    id: 'DEVOPS',
    displayName: 'DevOps / Cloud',
    keywords: ['devops intern', 'cloud intern', 'site reliability intern', 'sre intern'],
    aliases: ['devops', 'sre', 'cloud engineer', 'infrastructure'],
  },
  PRODUCT: {
    id: 'PRODUCT',
    displayName: 'Product Management',
    keywords: ['product management intern', 'pm intern', 'associate pm intern'],
    aliases: ['pm', 'product manager', 'product management'],
  },
  RESEARCH: {
    id: 'RESEARCH',
    displayName: 'Research Intern',
    keywords: ['research intern', 'research fellowship', 'ai research intern'],
    aliases: ['researcher', 'fellowship', 'research fellow'],
  },
};

/**
 * Filter roles based on ecosystem parameters to avoid irrelevant searches (e.g. Government/NGO vs Tech Startups)
 */
export function getRolesForEcosystem(ecosystemId: string): OpportunityRole[] {
  const allRoles = Object.values(OPPORTUNITY_ROLES);

  // YC / Wellfound Focus on SDE, Backend, Frontend, AI/ML, Data
  if (ecosystemId === 'YCombinator' || ecosystemId === 'Wellfound') {
    return allRoles.filter((r) =>
      [
        'SOFTWARE_ENGINEER',
        'BACKEND',
        'FRONTEND',
        'AI_ML',
        'DATA_SCIENCE',
        'DATA_ENGINEER',
      ].includes(r.id),
    );
  }

  // Research ecosystems focus on Research & AI/ML
  if (ecosystemId === 'ResearchInstitutes') {
    return allRoles.filter((r) => ['RESEARCH', 'AI_ML', 'DATA_SCIENCE'].includes(r.id));
  }

  return allRoles;
}
export default OPPORTUNITY_ROLES;
