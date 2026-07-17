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
