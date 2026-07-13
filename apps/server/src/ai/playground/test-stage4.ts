import { Stage4QualityAcceptance } from '../../discovery/stages/stage4';
import { Opportunity } from '../../discovery/extraction/types/opportunity.types';

const mockOpportunities: Opportunity[] = [
  // 1. High Quality Accepted Opportunity
  {
    title: 'SWE Internship for Female Students 2026',
    description:
      'A comprehensive 6-month software engineering internship opportunity. Work on microservices, APIs, and cloud infrastructure with active mentorship.',
    summary: 'SWE Internship for female students.',
    organization: 'Google', // Trusted Source
    opportunityType: 'INTERNSHIP',
    category: 'Engineering',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    remote: false,
    applicationUrl: 'https://careers.google.com/internship-apply',
    officialWebsite: 'https://google.com',
    deadline: '2026-09-30',
    startDate: '2026-11-01',
    endDate: null,
    salary: null,
    stipend: 50000, // Rich stipend
    currency: 'INR',
    duration: '6 Months',
    eligibility: 'Open to pre-final year female students pursuing Computer Science',
    minimumQualification: 'B.Tech/BE',
    skills: ['TS', 'Node', 'Go'],
    experienceLevel: 'Entry',
    ageLimit: null,
    genderEligibility: 'FEMALE',
    documentsRequired: [],
    selectionProcess: null,
    benefits: 'Mentorship, stipend, return offer potential',
    tags: ['swe', 'internship', 'tech'],
    sourceURL: 'https://careers.google.com/internship-apply',
    sourceDomain: 'google.com',
    sourceType: 'COMPANY',
    confidence: 0.95,
    rawPageId: 'raw_google',
    aiMetadata: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      latencyMs: 1200,
      extractionVersion: 'v1.0',
    },
    hash: 'google_hash',
  },
  // 2. Average Opportunity -> Needs Review
  {
    title: 'Summer Tech Camp Fellowship',
    description: 'Learn and participate in technical mentoring programs. Short summer workshop.',
    summary: 'Summer fellowship camp.',
    organization: 'SWE Society', // Untrusted Source
    opportunityType: 'FELLOWSHIP',
    category: 'Engineering',
    country: 'India',
    state: null,
    city: null,
    remote: true,
    applicationUrl: 'https://swe.org/fellowship',
    officialWebsite: null,
    deadline: null, // Missing deadline
    startDate: null,
    endDate: null,
    salary: null,
    stipend: 0, // Unpaid
    currency: null,
    duration: '2 Weeks',
    eligibility: null,
    minimumQualification: null,
    skills: [],
    experienceLevel: null,
    ageLimit: null,
    genderEligibility: 'ALL',
    documentsRequired: [],
    selectionProcess: null,
    benefits: null,
    tags: [],
    sourceURL: 'https://swe.org/fellowship',
    sourceDomain: 'swe.org',
    sourceType: 'COMMUNITY',
    confidence: 0.8,
    rawPageId: 'raw_swe',
    aiMetadata: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      latencyMs: 1100,
      extractionVersion: 'v1.0',
    },
    hash: 'swe_hash',
  },
  // 3. Rejected due to validation failure (Missing Title / Org)
  {
    title: 'Sh', // Too short -> Invalid
    description: 'Invalid opportunity example.',
    summary: 'Invalid description',
    organization: '', // Missing
    opportunityType: 'JOB',
    category: 'Engineering',
    country: null,
    state: null,
    city: null,
    remote: true,
    applicationUrl: 'invalid_url', // Missing http
    officialWebsite: null,
    deadline: null,
    startDate: null,
    endDate: null,
    salary: null,
    stipend: null,
    currency: null,
    duration: null,
    eligibility: null,
    minimumQualification: null,
    skills: [],
    experienceLevel: null,
    ageLimit: null,
    genderEligibility: null,
    documentsRequired: [],
    selectionProcess: null,
    benefits: null,
    tags: [],
    sourceURL: 'invalid_url',
    sourceDomain: 'invalid.com',
    sourceType: 'OTHER',
    confidence: 0.5,
    rawPageId: 'raw_invalid',
    aiMetadata: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      latencyMs: 800,
      extractionVersion: 'v1.0',
    },
    hash: 'invalid_hash',
  },
];

async function testStage4() {
  console.log('🧪 Running Stage 4 Quality Acceptance test script...');
  const stage4 = new Stage4QualityAcceptance();
  const results = await stage4.execute(mockOpportunities);

  console.log('\nResults Breakdown:');
  for (const r of results) {
    console.log(`- "${r.title}" -> Decision: ${r.decision} | Score: ${r.qualityScore}`);
    if (r.positiveReasons.length > 0) {
      console.log(`  Positive Reasons: ${r.positiveReasons.join(', ')}`);
    }
    if (r.penalties.length > 0) {
      console.log(`  Penalties: ${r.penalties.join(', ')}`);
    }
  }
}

testStage4().then(() => console.log('👋 Done.'));
