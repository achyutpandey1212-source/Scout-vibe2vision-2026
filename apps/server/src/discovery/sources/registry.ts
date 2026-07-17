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
    defaultTags: ['community', 'tech', 'engineering'],
  },
  {
    organization: 'ACM',
    homepage: 'https://www.acm.org',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['community', 'tech', 'computer-science'],
  },
  {
    organization: 'GDG',
    homepage: 'https://developers.google.com/community/gdg',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['community', 'tech', 'google'],
  },
  {
    organization: 'GDSC',
    homepage: 'https://developers.google.com/community/gdsc',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['community', 'tech', 'students'],
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
    defaultTags: ['hackathon', 'competition', 'coding'],
  },
  {
    organization: 'HackerRank',
    homepage: 'https://www.hackerrank.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 90,
    defaultTags: ['hackathon', 'competition', 'coding'],
  },
  {
    organization: 'Kaggle',
    homepage: 'https://www.kaggle.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 90,
    defaultTags: ['competition', 'data-science', 'ai'],
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
    defaultTags: ['incubator', 'startup', 'tech'],
  },
  {
    organization: 'NSRCEL',
    homepage: 'https://www.nsrcel.org',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['incubator', 'startup', 'university'],
  },
  {
    organization: 'CIIE IIMA',
    homepage: 'https://www.ciie.co',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['incubator', 'startup', 'university'],
  },
  {
    organization: 'Kerala Startup Mission',
    homepage: 'https://startupmission.kerala.gov.in',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['incubator', 'startup', 'government'],
  },
  {
    organization: 'Y Combinator',
    homepage: 'https://www.ycombinator.com',
    strategy: 'search',
    refreshFrequency: 'daily',
    trustScore: 95,
    defaultTags: ['vc-portfolio', 'startup', 'accelerator'],
  },
  {
    organization: 'Peak XV Partners',
    homepage: 'https://www.peakxv.com',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['vc-portfolio', 'startup'],
  },
  {
    organization: 'Accel India',
    homepage: 'https://www.accel.com',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['vc-portfolio', 'startup'],
  },
  {
    organization: 'Blume Ventures',
    homepage: 'https://blume.vc',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['vc-portfolio', 'startup'],
  },
  {
    organization: 'Antler India',
    homepage: 'https://www.antler.co/india',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['vc-portfolio', 'startup', 'accelerator'],
  },
  {
    organization: '100X.VC',
    homepage: 'https://www.100x.vc',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 90,
    defaultTags: ['vc-portfolio', 'startup', 'accelerator'],
  },
  {
    organization: 'Nexus Venture Partners',
    homepage: 'https://nexusvp.com',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['vc-portfolio', 'startup'],
  },
  {
    organization: 'Elevation Capital',
    homepage: 'https://elevationcapital.com',
    strategy: 'search',
    refreshFrequency: 'medium',
    trustScore: 95,
    defaultTags: ['vc-portfolio', 'startup'],
  },
];
