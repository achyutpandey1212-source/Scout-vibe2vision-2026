import mongoose from 'mongoose';

const TYPE_TO_CATEGORY: Record<string, string> = {
  INTERNSHIP: 'INTERNSHIPS',
  STARTUP_INTERNSHIP: 'STARTUP_INTERNSHIPS',
  GOVERNMENT_INTERNSHIP: 'GOVERNMENT_INTERNSHIP',
  RESEARCH_INTERNSHIP: 'RESEARCH_INTERNSHIP',
  HACKATHON: 'HACKATHONS',
  COMPETITION: 'HACKATHONS',
  OPEN_SOURCE_PROGRAM: 'OPEN_SOURCE_PROGRAM',
  CAMPUS_AMBASSADOR: 'CAMPUS_AMBASSADOR',
  SCHOLARSHIP: 'SCHOLARSHIPS',
  SUMMER_SCHOOL: 'SUMMER_SCHOOL',
  BOOTCAMP: 'BOOTCAMP',
  FELLOWSHIP: 'FELLOWSHIPS',
  WOMEN_IN_TECH: 'WOMEN_IN_TECH',
};

async function fixCategories() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scout');

  let totalUpdated = 0;

  for (const [oppType, expectedCategory] of Object.entries(TYPE_TO_CATEGORY)) {
    const result = await mongoose.connection.db
      ?.collection('opportunities')
      .updateMany(
        { opportunityType: oppType, category: { $ne: expectedCategory } },
        { $set: { category: expectedCategory } },
      );

    const updated = result?.modifiedCount || 0;
    if (updated > 0) {
      console.log(`  ${oppType} -> ${expectedCategory}: ${updated} updated`);
    }
    totalUpdated += updated;
  }

  console.log(`\nTotal opportunities updated: ${totalUpdated}`);
  await mongoose.disconnect();
}

fixCategories().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
