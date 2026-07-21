import { describe, it, expect } from 'vitest';
import { parseDiscoveryInput } from './input-parser';

describe('parseDiscoveryInput', () => {
  it('Test 1: preserves valid URL with commas', () => {
    const input =
      'https://www.glassdoor.co.in/Job/india-startup-internship-frontend-jobs-SRCH_IL.0,5_IN115_KO6,33.htm';
    const output = parseDiscoveryInput(input);
    expect(output).toEqual([
      'https://www.glassdoor.co.in/Job/india-startup-internship-frontend-jobs-SRCH_IL.0,5_IN115_KO6,33.htm',
    ]);
  });

  it('Test 2: splits by newlines', () => {
    const input = `https://site1.com/jobs\nhttps://site2.com/jobs`;
    const output = parseDiscoveryInput(input);
    expect(output).toEqual(['https://site1.com/jobs', 'https://site2.com/jobs']);
  });

  it('Test 3: splits by semicolons', () => {
    const input = 'https://site1.com/jobs;\nhttps://site2.com/jobs';
    const output = parseDiscoveryInput(input);
    expect(output).toEqual(['https://site1.com/jobs', 'https://site2.com/jobs']);
  });
});
