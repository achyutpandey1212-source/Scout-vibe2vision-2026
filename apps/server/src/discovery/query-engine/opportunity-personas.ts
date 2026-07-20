export interface OpportunityPersona {
  id: string;
  displayName: string;
  keywords: string[];
  synonyms: string[];
  preferredEcosystems: string[];
  preferredLocations: string[];
}

export const OPPORTUNITY_PERSONAS: Record<string, OpportunityPersona> = {
  SOFTWARE_ENGINEERING: {
    id: 'SOFTWARE_ENGINEERING',
    displayName: 'Software Engineering',
    keywords: ['software engineer', 'sde', 'software engineering', 'developer', 'systems engineer'],
    synonyms: [
      'software engineer intern',
      'sde intern',
      'software internship',
      'engineering intern',
    ],
    preferredEcosystems: ['Ashby', 'Greenhouse', 'Lever', 'Wellfound'],
    preferredLocations: ['Bangalore', 'Remote', 'Pune', 'Delhi NCR'],
  },
  AI_ML: {
    id: 'AI_ML',
    displayName: 'AI / Machine Learning',
    keywords: [
      'artificial intelligence',
      'machine learning',
      'ai',
      'ml',
      'deep learning',
      'computer vision',
      'nlp',
    ],
    synonyms: [
      'ai intern',
      'ml intern',
      'machine learning intern',
      'computer vision intern',
      'nlp intern',
    ],
    preferredEcosystems: ['Greenhouse', 'Ashby', 'Lever', 'Wellfound'],
    preferredLocations: ['Bangalore', 'Remote', 'Hyderabad'],
  },
  FRONTEND: {
    id: 'FRONTEND',
    displayName: 'Frontend Engineering',
    keywords: ['frontend', 'front-end', 'ui', 'user interface', 'web developer', 'react'],
    synonyms: [
      'frontend intern',
      'front-end developer intern',
      'web dev intern',
      'react developer intern',
    ],
    preferredEcosystems: ['Lever', 'Greenhouse', 'Wellfound'],
    preferredLocations: ['Bangalore', 'Remote', 'Pune'],
  },
  BACKEND: {
    id: 'BACKEND',
    displayName: 'Backend Engineering',
    keywords: ['backend', 'back-end', 'server', 'systems', 'node.js', 'python', 'go', 'java'],
    synonyms: ['backend intern', 'back-end developer intern', 'server engineer intern'],
    preferredEcosystems: ['Ashby', 'Lever', 'Greenhouse'],
    preferredLocations: ['Bangalore', 'Remote', 'Delhi NCR'],
  },
  FULL_STACK: {
    id: 'FULL_STACK',
    displayName: 'Full Stack Engineering',
    keywords: ['fullstack', 'full-stack', 'full stack'],
    synonyms: ['fullstack intern', 'full-stack intern', 'full stack developer intern'],
    preferredEcosystems: ['Wellfound', 'Lever', 'Greenhouse'],
    preferredLocations: ['Bangalore', 'Remote', 'Pune', 'Mumbai'],
  },
  DEVOPS: {
    id: 'DEVOPS',
    displayName: 'DevOps & Site Reliability',
    keywords: [
      'devops',
      'sre',
      'site reliability',
      'platform engineer',
      'infrastructure',
      'cloud engineer',
    ],
    synonyms: ['devops intern', 'sre intern', 'infrastructure intern', 'cloud engineering intern'],
    preferredEcosystems: ['Lever', 'Greenhouse'],
    preferredLocations: ['Bangalore', 'Remote', 'Pune'],
  },
  CYBERSECURITY: {
    id: 'CYBERSECURITY',
    displayName: 'Cybersecurity',
    keywords: ['cybersecurity', 'security', 'infosec', 'penetration testing', 'appsec'],
    synonyms: ['security intern', 'cybersecurity intern', 'infosec intern'],
    preferredEcosystems: ['Greenhouse', 'Lever'],
    preferredLocations: ['Bangalore', 'Remote'],
  },
  CLOUD: {
    id: 'CLOUD',
    displayName: 'Cloud Engineering',
    keywords: ['cloud', 'aws', 'azure', 'gcp', 'kubernetes'],
    synonyms: ['cloud intern', 'aws intern', 'cloud developer intern'],
    preferredEcosystems: ['Greenhouse', 'Lever'],
    preferredLocations: ['Bangalore', 'Remote'],
  },
  DATA_SCIENCE: {
    id: 'DATA_SCIENCE',
    displayName: 'Data Science & Analytics',
    keywords: ['data science', 'data scientist', 'data analyst', 'data engineering', 'analytics'],
    synonyms: [
      'data science intern',
      'data scientist intern',
      'data analyst intern',
      'data engineer intern',
    ],
    preferredEcosystems: ['Lever', 'Greenhouse', 'Ashby'],
    preferredLocations: ['Bangalore', 'Remote', 'Hyderabad', 'Mumbai'],
  },
  PRODUCT: {
    id: 'PRODUCT',
    displayName: 'Product Management',
    keywords: ['product manager', 'product management', 'pm', 'associate product manager', 'apm'],
    synonyms: ['product intern', 'pm intern', 'apm intern', 'associate product manager intern'],
    preferredEcosystems: ['Wellfound', 'Greenhouse', 'Lever'],
    preferredLocations: ['Bangalore', 'Remote', 'Mumbai', 'Gurugram'],
  },
  RESEARCH: {
    id: 'RESEARCH',
    displayName: 'Research Science',
    keywords: ['researcher', 'research scientist', 'research associate', 'phd intern'],
    synonyms: ['research intern', 'ai research intern', 'research scientist intern'],
    preferredEcosystems: ['Greenhouse', 'Lever'],
    preferredLocations: ['Bangalore', 'Delhi NCR', 'Noida'],
  },
  OPEN_SOURCE: {
    id: 'OPEN_SOURCE',
    displayName: 'Open Source Programs',
    keywords: ['open source', 'gsoc', 'outreachy', 'lfx'],
    synonyms: ['open source intern', 'gsoc intern', 'lfx intern'],
    preferredEcosystems: ['GitHub Programs', 'Devfolio', 'Devpost'],
    preferredLocations: ['Remote', 'Bangalore'],
  },
};
