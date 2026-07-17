import mongoose from 'mongoose';

const BANNED_TYPES = [
  'JOB',
  'FREELANCE',
  'VOLUNTEER',
  'EVENT',
  'COURSE',
  'PROGRAM',
  'GRANT',
  'OTHER',
];

const TYPE_RECLASSIFICATION: Record<string, string> = {
  GRANT: 'SCHOLARSHIP',
};

export async function migrateOpportunityTypes(): Promise<{
  archived: number;
  reclassified: number;
}> {
  let archived = 0;
  let reclassified = 0;

  for (const bannedType of BANNED_TYPES) {
    const reclassifiedType = TYPE_RECLASSIFICATION[bannedType];

    if (reclassifiedType) {
      const result = await mongoose.connection.db
        ?.collection('opportunities')
        .updateMany(
          { opportunityType: bannedType },
          { $set: { opportunityType: reclassifiedType } },
        );

      reclassified += result?.modifiedCount || 0;
    } else {
      const result = await mongoose.connection.db
        ?.collection('opportunities')
        .updateMany({ opportunityType: bannedType }, { $set: { archived: true } });

      archived += result?.modifiedCount || 0;
    }
  }

  console.log(`[Migration 004] Opportunity types migrated:`);
  console.log(`  Reclassified: ${reclassified}`);
  console.log(`  Archived: ${archived}`);

  return { archived, reclassified };
}
