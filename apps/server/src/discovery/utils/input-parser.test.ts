import { describe, it, expect } from 'vitest';
import { parseDiscoveryInput } from './input-parser';

describe('parseDiscoveryInput', () => {
  it('splits comma-separated URLs', () => {
    const input = 'https://url1.com, https://url2.com';
    const output = parseDiscoveryInput(input);
    expect(output).toEqual(['https://url1.com', 'https://url2.com']);
  });

  it('splits newline-separated URLs', () => {
    const input = 'https://site1.com/jobs\nhttps://site2.com/jobs';
    const output = parseDiscoveryInput(input);
    expect(output).toEqual(['https://site1.com/jobs', 'https://site2.com/jobs']);
  });

  it('splits mixed comma and newline input', () => {
    const input = 'https://url1.com,\nhttps://url2.com\nhttps://url3.com';
    const output = parseDiscoveryInput(input);
    expect(output).toEqual(['https://url1.com', 'https://url2.com', 'https://url3.com']);
  });

  it('preserves valid URL with internal commas', () => {
    const input =
      'https://www.glassdoor.co.in/Job/india-startup-internship-frontend-jobs-SRCH_IL.0,5_IN115_KO6,33.htm';
    const output = parseDiscoveryInput(input);
    expect(output).toEqual([
      'https://www.glassdoor.co.in/Job/india-startup-internship-frontend-jobs-SRCH_IL.0,5_IN115_KO6,33.htm',
    ]);
  });
});
