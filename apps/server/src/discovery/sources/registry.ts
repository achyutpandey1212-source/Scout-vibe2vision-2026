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
    defaultTags: ['technology', 'software engineering', 'tech', 'internship'],
  },
  {
    organization: 'Microsoft',
    homepage: 'https://careers.microsoft.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['technology', 'software engineering', 'tech', 'internship'],
  },
  {
    organization: 'Amazon',
    homepage: 'https://www.amazon.jobs',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['technology', 'tech', 'internship'],
  },
  {
    organization: 'NVIDIA',
    homepage: 'https://www.nvidia.com/en-us/about-nvidia/careers',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['technology', 'hardware', 'graphics', 'internship'],
  },

  // ━━ WOMEN IN TECH ━━
  {
    organization: 'Women Techmakers',
    homepage: 'https://www.womentechmakers.com',
    strategy: 'direct',
    refreshFrequency: 'daily',
    trustScore: 100,
    defaultTags: ['women-focused', 'women-in-tech', 'community', 'internship'],
  },
  {
    organization: 'AnitaB.org',
    homepage: 'https://anitab.org',
    strategy: 'direct',
    refreshFrequency: 'daily',
    trustScore: 100,
    defaultTags: ['women-focused', 'women-in-tech', 'career-advancement', 'internship'],
  },
  {
    organization: 'Grace Hopper Celebration',
    homepage: 'https://ghc.anitab.org',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 100,
    defaultTags: ['women-focused', 'conference', 'career-fair', 'scholarship'],
  },
  {
    organization: 'Women Who Code',
    homepage: 'https://www.womenwhocode.com',
    strategy: 'rss',
    refreshFrequency: 'daily',
    trustScore: 100,
    defaultTags: ['women-focused', 'women-in-tech', 'mentorship', 'community'],
  },

  // ━━ HACKATHONS ━━
  {
    organization: 'Devfolio',
    homepage: 'https://devfolio.co',
    strategy: 'sitemap',
    refreshFrequency: 'daily',
    trustScore: 90,
    defaultTags: ['hackathon', 'competition', 'development', 'student'],
  },
  {
    organization: 'MLH',
    homepage: 'https://mlh.io',
    strategy: 'sitemap',
    refreshFrequency: 'daily',
    trustScore: 90,
    defaultTags: ['hackathon', 'students', 'coding', 'student'],
  },
  {
    organization: 'Unstop',
    homepage: 'https://unstop.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 85,
    defaultTags: ['competition', 'quiz', 'hackathon', 'student'],
  },

  // ━━ RESEARCH ━━
  {
    organization: 'CERN',
    homepage: 'https://careers.cern',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['research', 'fellowship', 'physics', 'scientific', 'internship'],
  },
  {
    organization: 'ISRO',
    homepage: 'https://www.isro.gov.in/Careers.html',
    strategy: 'direct',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['government', 'research', 'space', 'scientific', 'internship'],
  },

  // ━━ NEW GOVERNMENT V2 SOURCES ━━
  {
    organization: 'DRDO',
    homepage: 'https://www.drdo.gov.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['government', 'research', 'scientific', 'internship'],
  },
  {
    organization: 'NIC',
    homepage: 'https://www.nic.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['government', 'tech', 'internship'],
  },
  {
    organization: 'MeitY',
    homepage: 'https://www.meity.gov.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['government', 'tech', 'internship'],
  },
  {
    organization: 'AICTE',
    homepage: 'https://www.aicte-india.org',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['government', 'education', 'internship'],
  },
  {
    organization: 'C-DAC',
    homepage: 'https://www.cdac.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['government', 'research', 'tech', 'internship'],
  },
  {
    organization: 'BEL',
    homepage: 'https://www.bel-india.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 90,
    defaultTags: ['government', 'engineering', 'internship'],
  },
  {
    organization: 'BHEL',
    homepage: 'https://www.bhel.com',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 90,
    defaultTags: ['government', 'engineering', 'internship'],
  },
  {
    organization: 'NTPC',
    homepage: 'https://www.ntpc.co.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 90,
    defaultTags: ['government', 'engineering', 'internship'],
  },
  {
    organization: 'ONGC',
    homepage: 'https://www.ongcindia.com',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 90,
    defaultTags: ['government', 'engineering', 'internship'],
  },
  {
    organization: 'GAIL',
    homepage: 'https://gailonline.com',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 90,
    defaultTags: ['government', 'engineering', 'internship'],
  },
  {
    organization: 'RBI',
    homepage: 'https://www.rbi.org.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['government', 'finance', 'internship'],
  },
  {
    organization: 'SEBI',
    homepage: 'https://www.sebi.gov.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['government', 'finance', 'internship'],
  },

  // ━━ NEW COMMUNITIES V2 SOURCES ━━
  {
    organization: 'IEEE',
    homepage: 'https://www.ieee.org',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['community', 'tech', 'engineering', 'student'],
  },
  {
    organization: 'ACM',
    homepage: 'https://www.acm.org',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['community', 'tech', 'computer-science', 'student'],
  },
  {
    organization: 'GDG',
    homepage: 'https://developers.google.com/community/gdg',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['community', 'tech', 'google', 'student'],
  },
  {
    organization: 'GDSC',
    homepage: 'https://developers.google.com/community/gdsc',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['community', 'tech', 'students', 'internship'],
  },
  {
    organization: 'Linux Foundation',
    homepage: 'https://www.linuxfoundation.org',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['community', 'open-source', 'tech', 'internship'],
  },

  // ━━ NEW HACKATHONS V2 SOURCES ━━
  {
    organization: 'HackerEarth',
    homepage: 'https://www.hackerearth.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 90,
    defaultTags: ['hackathon', 'competition', 'coding', 'student'],
  },
  {
    organization: 'HackerRank',
    homepage: 'https://www.hackerrank.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 90,
    defaultTags: ['hackathon', 'competition', 'coding', 'student'],
  },
  {
    organization: 'Kaggle',
    homepage: 'https://www.kaggle.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 90,
    defaultTags: ['competition', 'data-science', 'ai', 'student'],
  },

  // ━━ NEW RESEARCH V2 SOURCES ━━
  {
    organization: 'IISc',
    homepage: 'https://iisc.ac.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['research', 'scientific', 'university', 'internship'],
  },
  {
    organization: 'CSIR',
    homepage: 'https://www.csir.res.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['research', 'scientific', 'government', 'internship'],
  },
  {
    organization: 'DST',
    homepage: 'https://dst.gov.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['research', 'scientific', 'government', 'internship'],
  },

  // ━━ NEW STARTUP ECOSYSTEMS (PR5.1) ━━
  {
    organization: 'Startup India',
    homepage: 'https://www.startupindia.gov.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['incubator', 'accelerator', 'government', 'startup'],
  },
  {
    organization: 'T-Hub',
    homepage: 'https://t-hub.co',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['incubator', 'startup', 'tech', 'internship'],
  },
  {
    organization: 'NSRCEL',
    homepage: 'https://www.nsrcel.org',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['incubator', 'startup', 'university', 'internship'],
  },
  {
    organization: 'CIIE IIMA',
    homepage: 'https://www.ciie.co',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['incubator', 'startup', 'university', 'internship'],
  },
  {
    organization: 'Kerala Startup Mission',
    homepage: 'https://startupmission.kerala.gov.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['incubator', 'startup', 'government', 'internship'],
  },

  // ━━ HIGH YIELD ATS & STARTUP PLATFORMS (PHASE C & D) ━━
  {
    organization: 'Wellfound (AngelList)',
    homepage: 'https://wellfound.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['startup', 'tech', 'software', 'internship', 'remote'],
  },
  {
    organization: 'Y Combinator Jobs',
    homepage: 'https://www.ycombinator.com/jobs',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['startup', 'tech', 'software', 'internship'],
  },
  {
    organization: 'Ashby Job Board',
    homepage: 'https://jobs.ashbyhq.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['ats', 'software', 'tech', 'internship'],
  },
  {
    organization: 'Lever Job Board',
    homepage: 'https://jobs.lever.co',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['ats', 'software', 'tech', 'internship'],
  },
  {
    organization: 'Greenhouse Job Board',
    homepage: 'https://boards.greenhouse.io',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['ats', 'software', 'tech', 'internship'],
  },
  {
    organization: 'Workable Job Board',
    homepage: 'https://apply.workable.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['ats', 'software', 'tech', 'internship'],
  },
];
