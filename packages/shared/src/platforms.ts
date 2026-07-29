export interface Platform {
  id: string;
  name: string;
  logo: string;
}

export const PlatformRegistry: Record<string, Platform> = {
  'internshala.com': {
    id: 'internshala',
    name: 'Internshala',
    logo: '/Sources/Internshala.svg',
  },
  'unstop.com': {
    id: 'unstop',
    name: 'Unstop',
    logo: '/Sources/Unstop.svg',
  },
  'linkedin.com': {
    id: 'linkedin',
    name: 'LinkedIn',
    logo: '/Sources/Linkedin.svg',
  },
  'indeed.com': {
    id: 'indeed',
    name: 'Indeed',
    logo: '/Sources/Indeed.svg',
  },
  'glassdoor.com': {
    id: 'glassdoor',
    name: 'Glassdoor',
    logo: '/Sources/Glassdoor.svg',
  },
  'wellfound.com': {
    id: 'wellfound',
    name: 'Wellfound',
    logo: '/Sources/Wellfound.svg',
  },
  'github.com': {
    id: 'github',
    name: 'GitHub Careers',
    logo: '/Sources/Github.svg',
  },
  'google.com': {
    id: 'google',
    name: 'Google Careers',
    logo: '/Sources/Google.svg',
  },
  'amazon.jobs': {
    id: 'amazon',
    name: 'Amazon Careers',
    logo: '/Sources/Amazon.svg',
  },
  'microsoft.com': {
    id: 'microsoft',
    name: 'Microsoft Careers',
    logo: '/Sources/Microsoft.svg',
  },
};

export function getPlatformFromDomain(domain?: string | null): Platform {
  if (!domain) {
    return { id: 'external', name: 'External Source', logo: '' };
  }
  const cleanDomain = domain
    .toLowerCase()
    .trim()
    .replace(/^www\./, '');
  // Exact match
  if (PlatformRegistry[cleanDomain]) {
    return PlatformRegistry[cleanDomain];
  }
  // Fallback check: e.g. subdomain matches (ends with .glassdoor.com etc)
  for (const [key, value] of Object.entries(PlatformRegistry)) {
    if (cleanDomain === key || cleanDomain.endsWith('.' + key)) {
      return value;
    }
  }
  return { id: 'external', name: 'External Source', logo: '' };
}

export function getPlatformById(id?: string | null): Platform | undefined {
  if (!id) return undefined;
  for (const platform of Object.values(PlatformRegistry)) {
    if (platform.id === id) {
      return platform;
    }
  }
  return undefined;
}
