import { z } from 'zod';
import { reason, generateStructuredResponse, extract } from '../index';

async function runTests() {
  console.log('🏁 Starting AI Gateway verification tests...\n');

  // Test 1: Reason capability (Discovery context)
  try {
    console.log('🧪 Test 1: Calling reason() (context: discovery)...');
    const result = await reason({
      prompt: 'Summarize why AI Opportunity Intelligence is valuable in 1 short sentence.',
      context: 'discovery',
    });
    console.log('✅ Test 1 Output:', result);
  } catch (error: any) {
    console.error('❌ Test 1 Failed:', error.message);
  }

  // Test 2: Structured Output capability (Personalization context)
  try {
    console.log('\n🧪 Test 2: Calling generateStructuredResponse() (context: recommendation)...');
    const schema = z.object({
      skills: z.array(z.string()),
      confidence: z.number(),
    });
    const result = await generateStructuredResponse({
      prompt:
        'Identify the top 3 soft skills needed for leadership in technology. Return them along with a confidence score between 0 and 1.',
      schema,
      context: 'recommendation',
    });
    console.log('✅ Test 2 Output:', result);
    console.log(
      `Verified schema match: skills count = ${result.skills.length}, confidence = ${result.confidence}`,
    );
  } catch (error: any) {
    console.error('❌ Test 2 Failed:', error.message);
  }

  // Test 3: Extract capability (Discovery context)
  try {
    console.log('\n🧪 Test 3: Calling extract() (context: discovery)...');
    const textToExtract = `
      Title: Senior Frontend Engineer
      Location: Remote (US-only)
      Salary: $140,000 - $170,000
      Deadline: 2026-08-30
    `;
    const schema = z.object({
      title: z.string(),
      location: z.string(),
      salaryRange: z.string(),
      deadlineDate: z.string(),
    });
    const result = await extract({
      text: textToExtract,
      schema,
      context: 'discovery',
    });
    console.log('✅ Test 3 Output:', result);
  } catch (error: any) {
    console.error('❌ Test 3 Failed:', error.message);
  }

  console.log('\n🏁 Verification tests run completed.');
}

// Execute the tests
runTests().catch((err) => {
  console.error('Fatal test error:', err);
});
