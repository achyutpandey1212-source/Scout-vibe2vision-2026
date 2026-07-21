import { describe, it, expect } from 'vitest';
import { JobBoardExtractor } from './job-board-extractor';

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
        'PAGINATION',
      );
      expect(JobBoardExtractor.classifyUrl('https://www.indeed.com/search?q=intern')).toBe(
        'SEARCH_PAGE',
      );
      expect(JobBoardExtractor.classifyUrl('https://www.indeed.com/jobs?loc=india')).toBe('FILTER');
      expect(JobBoardExtractor.classifyUrl('https://www.indeed.com/category/software')).toBe(
        'CATEGORY',
      );
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
