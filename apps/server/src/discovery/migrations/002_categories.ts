import mongoose from 'mongoose';

const INACTIVE_CATEGORIES = [
  'GENERAL',
  'TECH_CAREERS',
  'ENTREPRENEURSHIP',
  'SKILL_DEVELOPMENT',
  'GOVERNMENT',
  'RESEARCH',
];

const CATEGORY_RECLASSIFICATION: Record<string, string> = {
  GENERAL: 'INTERNSHIPS',
  TECH_CAREERS: 'INTERNSHIPS',
  ENTREPRENEURSHIP: 'STARTUP_INTERNSHIPS',
  SKILL_DEVELOPMENT: 'BOOTCAMP',
  GOVERNMENT: 'GOVERNMENT_INTERNSHIP',
  RESEARCH: 'RESEARCH_INTERNSHIP',
};

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

export async function migrateCategories(): Promise<{
  opportunitiesUpdated: number;
  sourcesUpdated: number;
  archived: number;
}> {
  let opportunitiesUpdated = 0;
  let sourcesUpdated = 0;
  const archived = 0;

  // Migrate opportunities
  for (const oldCat of INACTIVE_CATEGORIES) {
    const newCat = CATEGORY_RECLASSIFICATION[oldCat];
    if (!newCat) continue;

    const result = await mongoose.connection.db
      ?.collection('opportunities')
      .updateMany({ category: oldCat }, { $set: { category: newCat } });

    opportunitiesUpdated += result?.modifiedCount || 0;
  }

  // Fix mismatched category/opportunityType pairs
  for (const [oppType, expectedCategory] of Object.entries(TYPE_TO_CATEGORY)) {
    const result = await mongoose.connection.db
      ?.collection('opportunities')
      .updateMany(
        { opportunityType: oppType, category: { $ne: expectedCategory } },
        { $set: { category: expectedCategory } },
      );

    opportunitiesUpdated += result?.modifiedCount || 0;
  }

  // Migrate sources
  for (const oldCat of INACTIVE_CATEGORIES) {
    const newCat = CATEGORY_RECLASSIFICATION[oldCat];
    if (!newCat) continue;

    const result = await mongoose.connection.db
      ?.collection('sources')
      .updateMany({ category: oldCat }, { $set: { category: newCat } });

    sourcesUpdated += result?.modifiedCount || 0;
  }

  console.log(`[Migration 002] Categories migrated:`);
  console.log(`  Opportunities updated: ${opportunitiesUpdated}`);
  console.log(`  Sources updated: ${sourcesUpdated}`);

  return { opportunitiesUpdated, sourcesUpdated, archived };
}
