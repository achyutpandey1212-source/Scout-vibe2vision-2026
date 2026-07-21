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
});
