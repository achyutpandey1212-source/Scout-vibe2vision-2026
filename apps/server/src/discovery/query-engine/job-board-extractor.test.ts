import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JobBoardExtractor, InternshalaAdapter, GlassdoorAdapter } from './job-board-extractor';

describe('JobBoardExtractor', () => {
  describe('isBoardPage', () => {
    it('should detect Indeed job search pages', () => {
      const url = 'https://www.indeed.com/jobs?q=backend+internship&l=remote';
      const markdown =
        'Some content with [Job 1](https://www.indeed.com/viewjob?jk=123) and [Job 2](https://www.indeed.com/viewjob?jk=456)';
      expect(JobBoardExtractor.isBoardPage(url, markdown)).toBe(true);
    });

    it('should detect Lever job listing pages', () => {
      const url = 'https://jobs.lever.co/google';
      const markdown = 'Jobs list';
      expect(JobBoardExtractor.isBoardPage(url, markdown)).toBe(true);
    });

    it('should not classify Lever single job page as board page', () => {
      const url = 'https://jobs.lever.co/google/12345-6789-abcd';
      const markdown = 'Single job description';
      expect(JobBoardExtractor.isBoardPage(url, markdown)).toBe(false);
    });
  });

  describe('cleanUrl', () => {
    it('should strip utm and tracking query params but keep jk key', () => {
      const url =
        'https://www.indeed.com/viewjob?jk=abcdef123&utm_source=indeed&utm_medium=organic&session_id=98765';
      const cleaned = JobBoardExtractor.cleanUrl(url);
      expect(cleaned).toBe('https://www.indeed.com/viewjob?jk=abcdef123');
    });
  });

  describe('extractListings', () => {
    it('should extract lists of job listings up to board limit', () => {
      const url = 'https://www.indeed.com/jobs?q=backend';
      const markdown = `
        [Software Engineer Intern](https://www.indeed.com/rc/clk?jk=111&from=web)
        [Backend Intern](https://www.indeed.com/rc/clk?jk=222&from=web)
        [Apply Now](https://www.indeed.com/jobs)
      `;
      const listings = JobBoardExtractor.extractListings(markdown, url);
      expect(listings.length).toBe(2);
      expect(listings[0].title).toBe('Software Engineer Intern');
      expect(listings[0].listingUrl).toBe('https://www.indeed.com/rc/clk?jk=111');
    });
  });

  describe('classifyUrl', () => {
    it('should classify job details correctly', () => {
      expect(JobBoardExtractor.classifyUrl('https://www.indeed.com/viewjob?jk=abc123')).toBe(
        'JOB_DETAIL',
      );
      expect(
        JobBoardExtractor.classifyUrl('https://glassdoor.com/job-listing/software-engineer-intern'),
      ).toBe('JOB_DETAIL');
      expect(JobBoardExtractor.classifyUrl('https://jobs.lever.co/google/1234-abcd')).toBe(
        'JOB_DETAIL',
      );
      expect(
        JobBoardExtractor.classifyUrl('https://devfolio.co/hackathons/my-awesome-hackathon'),
      ).toBe('JOB_DETAIL');
      expect(
        JobBoardExtractor.classifyUrl(
          'https://unstop.com/competition/unstop-coding-challenge-12345',
        ),
      ).toBe('JOB_DETAIL');
    });

    it('should classify asset URLs as UNKNOWN', () => {
      expect(JobBoardExtractor.classifyUrl('https://cdn.devfolio.co/images/logo.png')).toBe(
        'UNKNOWN',
      );
      expect(JobBoardExtractor.classifyUrl('https://unstop.com/assets/banner.svg')).toBe('UNKNOWN');
    });

    it('should classify non-job detail pages correctly', () => {
      expect(JobBoardExtractor.classifyUrl('https://www.indeed.com/jobs?page=2')).toBe(
        'LISTING_PAGE',
      );
      expect(JobBoardExtractor.classifyUrl('https://www.indeed.com/search?q=intern')).toBe(
        'SEARCH_PAGE',
      );
      expect(JobBoardExtractor.classifyUrl('https://www.indeed.com/jobs?loc=india')).toBe(
        'LISTING_PAGE',
      );
      expect(JobBoardExtractor.classifyUrl('https://www.indeed.com/category/software')).toBe(
        'LISTING_PAGE',
      );
    });
  });

  describe('Unstop Listing Extraction', () => {
    it('should classify Unstop detail URLs as JOB_DETAIL and directory URLs as LISTING_PAGE', () => {
      expect(
        JobBoardExtractor.classifyUrl(
          'https://unstop.com/internship/software-engineer-intern-walmart-123456',
        ),
      ).toBe('JOB_DETAIL');
      expect(
        JobBoardExtractor.classifyUrl('https://unstop.com/job/frontend-developer-amazon-987654'),
      ).toBe('JOB_DETAIL');
      expect(
        JobBoardExtractor.classifyUrl(
          'https://unstop.com/internship/student-internships?usertype=students&domain=2&oppstatus=open',
        ),
      ).toBe('LISTING_PAGE');
    });

    it('should extract Unstop internship listings while ignoring UI components', () => {
      const url =
        'https://unstop.com/internship/student-internships?usertype=students&domain=2&oppstatus=open';
      const markdown = `
        Unstop Logo
        chevron_down
        squarehalf_dualtone

        ### [Software Engineer Internship](https://unstop.com/internship/software-engineer-intern-walmart-123456)
        Company: Walmart
        Stipend: ₹40,000 / month
        Deadline: 15 Aug 2026
        Location: Bengaluru
        [Apply Now](https://unstop.com/internship/software-engineer-intern-walmart-123456)

        ### [Frontend Developer Intern](https://unstop.com/job/frontend-developer-amazon-987654)
        Company: Amazon
        Stipend: ₹50,000 / month
        Deadline: 20 Aug 2026
        Location: Remote
        [Apply Now](https://unstop.com/job/frontend-developer-amazon-987654)
      `;

      const listings = JobBoardExtractor.extractListings(markdown, url);
      expect(listings.length).toBe(2);
      expect(listings[0].listingUrl).toBe(
        'https://unstop.com/internship/software-engineer-intern-walmart-123456',
      );
      expect(listings[1].listingUrl).toBe(
        'https://unstop.com/job/frontend-developer-amazon-987654',
      );
    });

    it('should correctly parse the actual crawled pages markdown file', () => {
      const filePath = path.join(
        __dirname,
        '../../../../../crawled pages/unstop.com_internship_student-internships_usertype=students&domain=2&oppstatus=open.2026-07-22T05_36_17.350Z.md',
      );
      if (fs.existsSync(filePath)) {
        const markdown = fs.readFileSync(filePath, 'utf8');
        const url =
          'https://unstop.com/internship/student-internships?usertype=students&domain=2&oppstatus=open';
        const listings = JobBoardExtractor.extractListings(markdown, url);
        expect(listings.length).toBeGreaterThanOrEqual(10);
        console.log(`Listings Extracted from crawled page file: ${listings.length}`);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Internshala-specific tests
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Internshala URL Classification', () => {
    it('should classify Internshala detail URLs as JOB_DETAIL', () => {
      expect(
        JobBoardExtractor.classifyUrl(
          'https://internshala.com/internship/detail/ai-agent-development-internship-in-pune-at-conscript-hr-advisors-private-limited1784180702',
        ),
      ).toBe('JOB_DETAIL');

      expect(
        JobBoardExtractor.classifyUrl(
          'https://internshala.com/internship/detail/work-from-home-ai-agent-development-internship-at-primetradeai1783913924',
        ),
      ).toBe('JOB_DETAIL');

      expect(
        JobBoardExtractor.classifyUrl(
          'https://internshala.com/job/detail/software-engineer-job-at-google1234567890',
        ),
      ).toBe('JOB_DETAIL');
    });

    it('should classify Internshala category/listing URLs as LISTING_PAGE', () => {
      expect(
        JobBoardExtractor.classifyUrl(
          'https://internshala.com/internships/ai-agent-development-internship/',
        ),
      ).toBe('LISTING_PAGE');

      expect(
        JobBoardExtractor.classifyUrl(
          'https://internshala.com/internships/work-from-home-ai-agent-development-internships/',
        ),
      ).toBe('LISTING_PAGE');

      expect(
        JobBoardExtractor.classifyUrl(
          'https://internshala.com/internships/ai-agent-development-internship-in-delhi/',
        ),
      ).toBe('LISTING_PAGE');

      expect(JobBoardExtractor.classifyUrl('https://internshala.com/internships/')).toBe(
        'LISTING_PAGE',
      );

      expect(JobBoardExtractor.classifyUrl('https://internshala.com/jobs/')).toBe('LISTING_PAGE');
    });
  });

  describe('InternshalaAdapter.splitIntoCardBlocks', () => {
    const SAMPLE_INTERNSHALA_MARKDOWN = `
Loading, please wait...

[Home](https://internshala.com/)[Internships](https://internshala.com/internships/)

Filters

## [AI Agent Development](https://internshala.com/internship/detail/ai-agent-development-internship-in-pune-at-conscript-hr-advisors-private-limited1784180702)

Conscript HR Advisors Private Limited

Actively hiring

![Conscript HR Advisors Private Limited](https://internshala.com/static/images/search/placeholder_logo.svg)

Pune (Hybrid)

₹ 2,000 /month

3 Months

Are you a Python whiz with a passion for AI development?

Python

3 days ago

[**Get Internship and Job Preparation training FREE!** \\\\
OFFER\\\\
trainings.internshala.com](https://trainings.internshala.com/?utm_source=is_web_native_ad_internship_top_stt)

## [Automation Developer (With AI Agents)](https://internshala.com/internship/detail/work-from-home-automation-developer-with-ai-agents-internship-at-internet-innovations-india-private-limited1784027336)

Internet Innovations India Private Limited

![Internet Innovations India Private Limited](https://internshala-uploads.internshala.com/logo/62651246efb451650790982.jpg.webp)

Work from home

₹ 10,000 - 15,000 /month

5 Months

Building event-driven automations.

Logical reasoning

4 days ago

## Find More Related Internships

[AI Agent Development Internship in Delhi](https://internshala.com/internships/ai-agent-development-internship-in-delhi/)
[AI Agent Development Internship in Kolkata](https://internshala.com/internships/ai-agent-development-internship-in-kolkata/)
`;

    it('should extract exactly 2 opportunity card blocks from sample markdown', () => {
      const cards = InternshalaAdapter.splitIntoCardBlocks(SAMPLE_INTERNSHALA_MARKDOWN);
      expect(cards.length).toBe(2);
    });

    it('should not include footer section cards', () => {
      const cards = InternshalaAdapter.splitIntoCardBlocks(SAMPLE_INTERNSHALA_MARKDOWN);
      for (const card of cards) {
        expect(card).not.toContain('Find More Related Internships');
        expect(card).not.toContain('ai-agent-development-internship-in-delhi');
      }
    });

    it('should not include ad banner content in cards', () => {
      const cards = InternshalaAdapter.splitIntoCardBlocks(SAMPLE_INTERNSHALA_MARKDOWN);
      for (const card of cards) {
        expect(card).not.toContain('trainings.internshala.com');
      }
    });

    it('card headings should contain valid detail URLs', () => {
      const cards = InternshalaAdapter.splitIntoCardBlocks(SAMPLE_INTERNSHALA_MARKDOWN);
      for (const card of cards) {
        expect(card).toMatch(/internshala\.com\/internship\/detail\//);
      }
    });
  });

  describe('InternshalaAdapter.extractListings', () => {
    const SAMPLE_MARKDOWN = `
## [AI Agent Development](https://internshala.com/internship/detail/ai-agent-development-internship-in-pune-at-conscript-hr-advisors-private-limited1784180702)

Conscript HR Advisors Private Limited

Actively hiring

![Conscript HR Advisors](https://internshala.com/static/images/search/placeholder_logo.svg)

Pune (Hybrid)

₹ 2,000 /month

3 Months

Python

3 days ago

## [AI Agent Development](https://internshala.com/internship/detail/work-from-home-ai-agent-development-internship-at-primetradeai1783913924)

Primetrade.ai

Actively hiring

Work from home

₹ 10,000 /month

6 Months

Python

6 days ago

Job offer starting ₹ 3LPA post internship

## Find More Related Internships

[AI Agent Development Internship in Delhi](https://internshala.com/internships/ai-agent-development-internship-in-delhi/)
`;

    it('should extract 2 listings from sample Internshala markdown', () => {
      const url = 'https://internshala.com/internships/ai-agent-development-internship/';
      const listings = InternshalaAdapter.extractListings(SAMPLE_MARKDOWN, url);
      expect(listings.length).toBe(2);
    });

    it('should correctly extract listing URLs as JOB_DETAIL classified URLs', () => {
      const url = 'https://internshala.com/internships/ai-agent-development-internship/';
      const listings = InternshalaAdapter.extractListings(SAMPLE_MARKDOWN, url);
      expect(listings[0].listingUrl).toBe(
        'https://internshala.com/internship/detail/ai-agent-development-internship-in-pune-at-conscript-hr-advisors-private-limited1784180702',
      );
      expect(listings[1].listingUrl).toBe(
        'https://internshala.com/internship/detail/work-from-home-ai-agent-development-internship-at-primetradeai1783913924',
      );
    });

    it('should correctly extract company names from card bodies', () => {
      const url = 'https://internshala.com/internships/ai-agent-development-internship/';
      const listings = InternshalaAdapter.extractListings(SAMPLE_MARKDOWN, url);
      expect(listings[0].company).toBe('Conscript HR Advisors Private Limited');
      expect(listings[1].company).toBe('Primetrade.ai');
    });

    it('should detect remote listings correctly', () => {
      const url = 'https://internshala.com/internships/ai-agent-development-internship/';
      const listings = InternshalaAdapter.extractListings(SAMPLE_MARKDOWN, url);
      expect(listings[1].location).toBe('Remote');
    });

    it('all extracted listing URLs must pass JOB_DETAIL classification', () => {
      const url = 'https://internshala.com/internships/ai-agent-development-internship/';
      const listings = InternshalaAdapter.extractListings(SAMPLE_MARKDOWN, url);
      for (const listing of listings) {
        expect(JobBoardExtractor.classifyUrl(listing.listingUrl)).toBe('JOB_DETAIL');
      }
    });
  });

  describe('InternshalaAdapter — real crawled JSON file', () => {
    it('should parse the actual crawled JSON and extract >= 10 listings', () => {
      const filePath = path.join(
        __dirname,
        '../../../../../crawled pages/https___internshala.com_internships_ai-agent-development-internship_.2026-07-22T07_09_58.226Z.json',
      );
      if (!fs.existsSync(filePath)) return; // skip if file not present

      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const markdown: string = raw?.web?.[0]?.markdown || '';
      expect(markdown.length).toBeGreaterThan(0);

      const url = 'https://internshala.com/internships/ai-agent-development-internship/';
      const listings = InternshalaAdapter.extractListings(markdown, url);

      console.log(`Internshala listings extracted from real crawled page: ${listings.length}`);
      console.log(
        listings
          .slice(0, 3)
          .map((l) => `${l.title} @ ${l.company}`)
          .join('\n'),
      );

      expect(listings.length).toBeGreaterThanOrEqual(10);
      // All listing URLs must be JOB_DETAIL classified
      for (const listing of listings) {
        expect(JobBoardExtractor.classifyUrl(listing.listingUrl)).toBe('JOB_DETAIL');
      }
    });
  });

  describe('Glassdoor URL Classification', () => {
    it('should classify Glassdoor detail URLs as JOB_DETAIL', () => {
      expect(
        JobBoardExtractor.classifyUrl(
          'https://www.glassdoor.co.in/job-listing/mern-stack-developer-intern-dettroin-JV_KO0,27_KE28,36.htm?jl=1010205098903',
        ),
      ).toBe('JOB_DETAIL');
      expect(
        JobBoardExtractor.classifyUrl(
          'https://www.glassdoor.com/job-listing/software-engineer-intern-google-JV_KO0,10.htm?jl=12345',
        ),
      ).toBe('JOB_DETAIL');
    });

    it('should classify Glassdoor listing URLs as LISTING_PAGE', () => {
      expect(
        JobBoardExtractor.classifyUrl(
          'https://www.glassdoor.co.in/Job/india-full-stack-internship-jobs-SRCH_IL.0,5_IN115_KO6,27.htm',
        ),
      ).toBe('LISTING_PAGE');
      expect(
        JobBoardExtractor.classifyUrl(
          'https://www.glassdoor.co.in/Job/india-mern-stack-developer-internship-jobs-SRCH_IL.0,5_IN115_KO6,37.htm',
        ),
      ).toBe('LISTING_PAGE');
    });
  });

  describe('GlassdoorAdapter.splitIntoCardBlocks', () => {
    const SAMPLE_GLASSDOOR_MARKDOWN = `
- Dettroin

[MERN Stack Developer Intern](https://www.glassdoor.co.in/job-listing/mern-stack-developer-intern-dettroin-JV_KO0,27_KE28,36.htm?jl=1010205098903)

India

Easy Apply

Job Type: Internship. We are looking for MERN Interns.

**Skills:** Node.js, React

Discover more

24h

- ![nxtrole.ai Logo](https://media.glassdoor.com/sql/123/nxtrole.png)

nxtrole.ai

4.5

[MERN Stack Developer Intern](https://www.glassdoor.co.in/job-listing/mern-stack-developer-intern-nxtrole-ai-JV_KO0,27_KE28,38.htm?jl=1010187855663)

Remote

₹10,000 - ₹15,000(Employer provided)

Easy Apply

Develop web apps...

Discover more

7d

Show more jobs

Create alert
`;

    it('should split sample markdown into exactly 2 card blocks', () => {
      const blocks = GlassdoorAdapter.splitIntoCardBlocks(SAMPLE_GLASSDOOR_MARKDOWN);
      expect(blocks.length).toBe(2);
    });

    it('card headings should contain valid /job-listing/ URLs', () => {
      const blocks = GlassdoorAdapter.splitIntoCardBlocks(SAMPLE_GLASSDOOR_MARKDOWN);
      for (const block of blocks) {
        expect(block).toContain('/job-listing/');
      }
    });
  });

  describe('GlassdoorAdapter.extractListings', () => {
    const SAMPLE_GLASSDOOR_MARKDOWN = `
- Dettroin

[MERN Stack Developer Intern](https://www.glassdoor.co.in/job-listing/mern-stack-developer-intern-dettroin-JV_KO0,27_KE28,36.htm?jl=1010205098903)

India

Easy Apply

Job Type: Internship. We are looking for MERN Interns.

**Skills:** Node.js, React

Discover more

24h

- ![nxtrole.ai Logo](https://media.glassdoor.com/sql/123/nxtrole.png)

nxtrole.ai

4.5

[MERN Stack Developer Intern](https://www.glassdoor.co.in/job-listing/mern-stack-developer-intern-nxtrole-ai-JV_KO0,27_KE28,38.htm?jl=1010187855663)

Remote

₹10,000 - ₹15,000(Employer provided)

Easy Apply

Develop web apps...

Discover more

7d

Show more jobs
`;

    it('should extract exactly 2 listings', () => {
      const url =
        'https://www.glassdoor.co.in/Job/india-full-stack-internship-jobs-SRCH_IL.0,5_IN115_KO6,27.htm';
      const listings = GlassdoorAdapter.extractListings(SAMPLE_GLASSDOOR_MARKDOWN, url);
      expect(listings.length).toBe(2);
    });

    it('should extract title, url, company, and location correctly', () => {
      const url =
        'https://www.glassdoor.co.in/Job/india-full-stack-internship-jobs-SRCH_IL.0,5_IN115_KO6,27.htm';
      const listings = GlassdoorAdapter.extractListings(SAMPLE_GLASSDOOR_MARKDOWN, url);

      expect(listings[0].title).toBe('MERN Stack Developer Intern');
      expect(listings[0].company).toBe('Dettroin');
      expect(listings[0].location).toBe('India');

      expect(listings[1].title).toBe('MERN Stack Developer Intern');
      expect(listings[1].company).toBe('nxtrole.ai');
      expect(listings[1].location).toBe('Remote');
    });
  });

  describe('GlassdoorAdapter — real crawled JSON file', () => {
    it('should parse the actual crawled JSON and extract listings', () => {
      const filePath = path.join(
        __dirname,
        '../../../../../crawled pages/https___www.glassdoor.co.in_Job_india-full-stack-internship-jobs-SRCH_IL.0,5_IN115_KO6,27.htm.2026-07-22T07_55_21.508Z.json',
      );
      if (!fs.existsSync(filePath)) return;

      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // The JSON has multiple results under web array, let's parse the first page's markdown
      const markdown = raw.web[0].markdown;
      expect(markdown.length).toBeGreaterThan(0);

      const url =
        'https://www.glassdoor.co.in/Job/india-full-stack-internship-jobs-SRCH_IL.0,5_IN115_KO6,27.htm';
      const listings = GlassdoorAdapter.extractListings(markdown, url);

      console.log(`Glassdoor listings extracted from real crawled page: ${listings.length}`);
      console.log(
        listings
          .slice(0, 3)
          .map((l) => `${l.title} @ ${l.company} (${l.location})`)
          .join('\n'),
      );

      expect(listings.length).toBeGreaterThanOrEqual(10);
      for (const listing of listings) {
        expect(JobBoardExtractor.classifyUrl(listing.listingUrl)).toBe('JOB_DETAIL');
      }
    });
  });

  describe('getBoardIdentifier', () => {
    it('should normalize domains as identifiers', () => {
      expect(JobBoardExtractor.getBoardIdentifier('https://www.glassdoor.co.in/jobs?page=1')).toBe(
        'glassdoor.co.in',
      );
      expect(JobBoardExtractor.getBoardIdentifier('https://indeed.com/jobs?q=intern')).toBe(
        'indeed.com',
      );
    });
  });
});
