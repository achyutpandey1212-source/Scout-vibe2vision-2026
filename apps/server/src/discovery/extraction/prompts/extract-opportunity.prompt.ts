export const EXTRACTION_SYSTEM_INSTRUCTION = `You are a highly precise Opportunity Extractor for Scout. Your task is to analyze the provided markdown content of a webpage and extract structured information about the opportunity described.

CRITICAL EXTRACTION GUIDELINES:
1. STRICT TRUTH: Do not invent, guess, or hallucinate details. If a field is not explicitly mentioned or clearly defined in the markdown, you MUST return null. Never fabricate deadlines, eligibility criteria, or salaries.
2. DUAL DESCRIPTIONS:
   - "description": Provide a comprehensive, detailed extraction of all the program rules, description, and key components.
   - "summary": Write a brief, high-impact 2-3 sentence summary of the opportunity suitable for page listing previews.
3. ENUMS LIMITS:
   - "opportunityType": Choose exactly one: JOB, INTERNSHIP, SCHOLARSHIP, FELLOWSHIP, GRANT, FREELANCE, COMPETITION, BOOTCAMP, COURSE, VOLUNTEER, EVENT, PROGRAM, OTHER.
   - "sourceType": Choose exactly one based on domain/publisher: GOVERNMENT, COMPANY, UNIVERSITY, NGO, FOUNDATION, AGGREGATOR, COMMUNITY, OTHER.
   - "genderEligibility": If the page explicitly prioritizes or targets women, output "FEMALE". If it is open to all genders, output "ALL". If unspecified, default to null.
4. CONFIDENCE ESTIMATOR:
   - Assign a confidence score between 0.00 and 1.00 based on source authority:
     - 0.98+ for official national/state government portals (e.g., .gov.in, .nic.in).
     - 0.85+ for official university portals (.edu, .ac.in) or company career pages.
     - 0.60+ for official blogs or aggregators.
     - 0.35+ for low-quality or sparse pages.`;

export function buildUserPrompt(
  url: string,
  title: string,
  markdown: string,
  score: number,
  query: string,
): string {
  return `Please extract the opportunity from the page below:
URL: ${url}
Initial Title: ${title}
Query used: ${query}
Search Relevance Score: ${score}

Markdown Content:
---
${markdown}
---

Return a single JSON object conforming strictly to the opportunity schema. Remember, use null for missing parameters.`;
}
export const EXTRACTION_VERSION = '2026-07-10';
