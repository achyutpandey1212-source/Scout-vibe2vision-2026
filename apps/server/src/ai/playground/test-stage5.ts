import { Stage5Persistence } from '../../discovery/stages/stage5';
import { QualityEvaluatedOpportunity } from '../../discovery/stages/stage4';
import { db } from '../../config/db';
import { OpportunityModel } from '../../discovery/extraction/models/opportunity.model';

const mockEvaluated: QualityEvaluatedOpportunity[] = [
  // 1. High Quality Accepted Opportunity (New)
  {
    title: 'Google SWE Internship 2026',
    description:
      'A comprehensive 6-month software engineering internship opportunity. Work on microservices, APIs, and cloud infrastructure with active mentorship.',
    summary: 'SWE Internship for female students.',
    organization: 'Google',
    opportunityType: 'INTERNSHIP',
    category: 'Engineering',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    remote: false,
    applicationUrl: 'https://careers.google.com/internship-apply-2026',
    officialWebsite: 'https://google.com',
    deadline: '2026-09-30',
    startDate: '2026-11-01',
    endDate: null,
    salary: null,
    stipend: 50000,
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
    sourceURL: 'https://careers.google.com/internship-apply-2026',
    sourceDomain: 'google.com',
    sourceType: 'COMPANY',
    confidence: 0.95,
    rawPageId: '60c72b2f9b1d8b2bad000001', // Valid 24-character hex ObjectId
    aiMetadata: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      latencyMs: 1200,
      extractionVersion: 'v1.0',
    },
    hash: 'google_hash',
    qualityScore: 95,
    decision: 'ACCEPT',
    positiveReasons: ['Trusted Source'],
    penalties: [],
    qualityBreakdown: {
      officialSource: true,
      deadlinePresent: true,
      applicationLink: true,
      richDescription: true,
      benefitsPresent: true,
      stipendPresent: true,
    },
  },
  // 2. High Quality Accepted Opportunity (Duplicate URL to merge)
  {
    title: 'Google Software Engineering Intern 2026',
    description:
      'A comprehensive 6-month software engineering internship opportunity. Work on microservices, APIs, and cloud infrastructure with active mentorship. Richer description addition to test merge.',
    summary: 'SWE Internship for female students.',
    organization: 'Google LLC',
    opportunityType: 'INTERNSHIP',
    category: 'Engineering',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    remote: false,
    applicationUrl: 'https://careers.google.com/internship-apply-2026', // Identical App URL -> Duplicate Merge
    officialWebsite: 'https://google.com',
    deadline: '2026-09-30',
    startDate: '2026-11-01',
    endDate: null,
    salary: null,
    stipend: 55000, // Upgraded stipend
    currency: 'INR',
    duration: '6 Months',
    eligibility: 'Open to pre-final year female students pursuing Computer Science',
    minimumQualification: 'B.Tech/BE',
    skills: ['TS', 'Node', 'Go', 'Docker'], // Extra skill tags
    experienceLevel: 'Entry',
    ageLimit: null,
    genderEligibility: 'FEMALE',
    documentsRequired: [],
    selectionProcess: null,
    benefits: 'Mentorship, stipend, return offer potential',
    tags: ['swe', 'internship', 'tech', 'cloud'], // Extra tags
    sourceURL: 'https://careers.google.com/internship-apply-2026',
    sourceDomain: 'google.com',
    sourceType: 'COMPANY',
    confidence: 0.95,
    rawPageId: '60c72b2f9b1d8b2bad000001', // Valid 24-character hex ObjectId
    aiMetadata: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      latencyMs: 1200,
      extractionVersion: 'v1.0',
    },
    hash: 'google_hash',
    qualityScore: 98, // Higher score
    decision: 'ACCEPT',
    positiveReasons: ['Trusted Source'],
    penalties: [],
    qualityBreakdown: {
      officialSource: true,
      deadlinePresent: true,
      applicationLink: true,
      richDescription: true,
      benefitsPresent: true,
      stipendPresent: true,
    },
  },
];

async function testStage5() {
  console.log('🧪 Connecting database for Stage 5 E2E deduplication test...');
  await db.connect();

  // Clear existing mock entries
  await OpportunityModel.deleteMany({ organization: /Google/i });
  console.log('Cleared existing Google mock records.');

  const stage5 = new Stage5Persistence();

  console.log('\n--- Run 1: Inserting Google Internship ---');
  const run1 = await stage5.execute([mockEvaluated[0]]);
  console.log(`Run 1 Result:`, JSON.stringify(run1, null, 2));

  // Query database directly to confirm it exists
  const count = await OpportunityModel.countDocuments({ organization: /Google/i });
  console.log(`\nGoogle opportunities count in DB after Run 1: ${count}`);
  const docs = await OpportunityModel.find({ organization: /Google/i });
  console.log(
    'Docs found:',
    docs.map((d) => ({ title: d.title, url: d.applicationUrl, archived: d.archived })),
  );

  console.log('\n--- Run 2: Executing Duplicate Merge Check ---');
  const run2 = await stage5.execute([mockEvaluated[1]]);
  console.log(`Run 2 Result:`, JSON.stringify(run2, null, 2));

  // Re-query database to see final merged record
  const finalDocs = await OpportunityModel.find({ organization: /Google/i });
  console.log(
    '\nFinal Docs in DB after Run 2:',
    finalDocs.map((d) => ({
      title: d.title,
      description: d.description,
      stipend: d.stipend,
      skills: d.skills,
    })),
  );

  await db.disconnect();
}

testStage5().then(() => console.log('👋 Done.'));
