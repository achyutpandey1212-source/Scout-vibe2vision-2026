/**
 * TRUSTED_SOURCES — Seed Dataset (READ-ONLY)
 *
 * This file is the initial seed for the SourceRegistry MongoDB collection.
 * It is imported exclusively by SourceRegistryService.seedIfEmpty() on first boot.
 *
 * DO NOT import this file from Stage 1 or any pipeline stage.
 * Stage 1 reads live data from MongoDB via CrawlSchedulerService.
 *
 * To add new sources permanently, use the API:
 *   POST /api/discovery/sources
 * or run the weekly discovery engine:
 *   POST /api/discovery/sources/discover
 */
export interface SourceRegistryEntry {
  organization: string;
  homepage: string;
  strategy: 'search' | 'sitemap' | 'rss' | 'direct';
  refreshFrequency: 'daily' | 'medium' | 'low';
  trustScore: number; // 0-100 base score
  defaultTags: string[];
}

export const TRUSTED_SOURCES: SourceRegistryEntry[] = [
  // ━━ TECHNOLOGY ━━
  {
    organization: 'Google',
    homepage: 'https://buildyourfuture.withgoogle.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['technology', 'software engineering', 'tech'],
  },
  {
    organization: 'Microsoft',
    homepage: 'https://careers.microsoft.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['technology', 'software engineering', 'tech'],
  },
  {
    organization: 'Amazon',
    homepage: 'https://www.amazon.jobs',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['technology', 'tech'],
  },
  {
    organization: 'NVIDIA',
    homepage: 'https://www.nvidia.com/en-us/about-nvidia/careers',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['technology', 'hardware', 'graphics'],
  },

  // ━━ WOMEN IN TECH ━━
  {
    organization: 'Women Techmakers',
    homepage: 'https://www.womentechmakers.com',
    strategy: 'direct',
    refreshFrequency: 'daily',
    trustScore: 100,
    defaultTags: ['women-focused', 'women-in-tech', 'community'],
  },
  {
    organization: 'AnitaB.org',
    homepage: 'https://anitab.org',
    strategy: 'direct',
    refreshFrequency: 'daily',
    trustScore: 100,
    defaultTags: ['women-focused', 'women-in-tech', 'career-advancement'],
  },
  {
    organization: 'Grace Hopper Celebration',
    homepage: 'https://ghc.anitab.org',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 100,
    defaultTags: ['women-focused', 'conference', 'career-fair'],
  },
  {
    organization: 'Women Who Code',
    homepage: 'https://www.womenwhocode.com',
    strategy: 'rss',
    refreshFrequency: 'daily',
    trustScore: 100,
    defaultTags: ['women-focused', 'women-in-tech', 'mentorship'],
  },

  // ━━ HACKATHONS ━━
  {
    organization: 'Devfolio',
    homepage: 'https://devfolio.co',
    strategy: 'sitemap',
    refreshFrequency: 'daily',
    trustScore: 90,
    defaultTags: ['hackathon', 'competition', 'development'],
  },
  {
    organization: 'MLH',
    homepage: 'https://mlh.io',
    strategy: 'sitemap',
    refreshFrequency: 'daily',
    trustScore: 90,
    defaultTags: ['hackathon', 'students', 'coding'],
  },
  {
    organization: 'Unstop',
    homepage: 'https://unstop.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 85,
    defaultTags: ['competition', 'quiz', 'hackathon'],
  },

  // ━━ RESEARCH ━━
  {
    organization: 'CERN',
    homepage: 'https://careers.cern',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['research', 'fellowship', 'physics', 'scientific'],
  },
  {
    organization: 'ISRO',
    homepage: 'https://www.isro.gov.in/Careers.html',
    strategy: 'direct',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['government', 'research', 'space', 'scientific'],
  },

  // ━━ SCHOLARSHIPS ━━
  {
    organization: 'DAAD',
    homepage: 'https://www.daad.de',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['scholarship', 'education', 'germany'],
  },
  {
    organization: 'Erasmus+',
    homepage: 'https://erasmus-plus.ec.europa.eu',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['scholarship', 'fellowship', 'europe'],
  },

  // ━━ FELLOWSHIPS ━━
  {
    organization: 'Obama Foundation',
    homepage: 'https://www.obamaorg/fellowship',
    strategy: 'direct',
    refreshFrequency: 'low',
    trustScore: 95,
    defaultTags: ['fellowship', 'leadership', 'social-impact'],
  },
  {
    organization: 'Mozilla Foundation',
    homepage: 'https://foundation.mozilla.org',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['fellowship', 'open-source', 'tech-policy'],
  },
];
