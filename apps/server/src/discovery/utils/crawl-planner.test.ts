import { describe, it, expect } from 'vitest';
import { CrawlPlanner } from './crawl-planner';

describe('CrawlPlanner.validateContent', () => {
  // Helpers to generate structural page content > 10000 chars
  const generateLargeStructuredMarkdown = (customSnippet: string): string => {
    let base = `
# Awesome Internships Listing Board

## Software Engineering Internship
Company: TechCorp
Location: Bangalore
[Apply Now](https://test.com/apply-1)
This is an amazing opportunity for students interested in software development.

## AI Research Intern
Company: DeepMind AI
Location: Remote
[Apply Now](https://test.com/apply-2)
Work on state of the art generative models and autonomous agents.

## Product Management Internship
Company: InnovateLLC
Location: Pune
[Apply Now](https://test.com/apply-3)
Learn product lifecycle management and feature specification workflows.
    `;
    // Repeat to exceed 10000 characters
    while (base.length < 11000) {
      base += `\n\n## Duplicate Card Title\nCompany: RepeatCorp\nLocation: India\n[Apply Now](https://test.com/apply-repeat)\nThis is a repeat block of text to inflate content density and exceed the minimum markdown page length constraints.`;
    }
    return base + '\n' + customSnippet;
  };

  it('should NOT block Internshala listing page (contains reCAPTCHA notice but has high structure)', () => {
    const markdown = generateLargeStructuredMarkdown(`
reCAPTCHA requires verification.
This site is protected by reCAPTCHA and the Google Privacy Policy.
[Register Now](https://internshala.com/register) or [Login](https://internshala.com/login)
    `);
    const validation = CrawlPlanner.validateContent(
      markdown,
      'https://internshala.com/internships/',
    );
    expect(validation.valid).toBe(true);
  });

  it('should NOT block Unstop listing page', () => {
    const markdown = generateLargeStructuredMarkdown(`
Sign in with Google
[Login/Register](https://unstop.com/login)
    `);
    const validation = CrawlPlanner.validateContent(markdown, 'https://unstop.com/competitions');
    expect(validation.valid).toBe(true);
  });

  it('should NOT block Indeed listing page', () => {
    const markdown = generateLargeStructuredMarkdown(`
Create an account
Sign in
Employer Login
    `);
    const validation = CrawlPlanner.validateContent(markdown, 'https://indeed.com/jobs');
    expect(validation.valid).toBe(true);
  });

  it('should NOT block Glassdoor listing page', () => {
    const markdown = generateLargeStructuredMarkdown(`
Join Glassdoor
Sign in
Search jobs
    `);
    const validation = CrawlPlanner.validateContent(markdown, 'https://glassdoor.com/jobs');
    expect(validation.valid).toBe(true);
  });

  it('should be BLOCKED on Cloudflare challenge page', () => {
    const markdown = `
# Just a moment...
Please wait while we check your browser.
cloudflare challenge
cf-challenge
cf-ray: 123456789
Verify you are human.
    `;
    const validation = CrawlPlanner.validateContent(markdown, 'https://blocked-by-cloudflare.com');
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe('BLOCKED');
  });

  it('should be BLOCKED on CAPTCHA verification page', () => {
    const markdown = `
# Security Check
Verify that you are human
Please complete the CAPTCHA check below to continue.
human verification
    `;
    const validation = CrawlPlanner.validateContent(markdown, 'https://blocked-by-captcha.com');
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe('BLOCKED');
  });

  it('should be BLOCKED on 403 Forbidden Access Denied page', () => {
    const markdown = `
# Access Denied (HTTP 403 Forbidden)
Your IP address has been blocked.
request blocked by safety security system.
    `;
    const validation = CrawlPlanner.validateContent(markdown, 'https://blocked-forbidden.com');
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe('BLOCKED');
  });

  it('should be BLOCKED on login-only landing page with no opportunities', () => {
    const markdown = `
# Please Log In
You must sign in to see this content.
[Sign In](https://test.com/login)
[Create Account](https://test.com/register)
    `;
    const validation = CrawlPlanner.validateContent(markdown, 'https://login-only.com');
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe('BLOCKED');
  });
});
