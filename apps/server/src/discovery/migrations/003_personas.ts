import mongoose from 'mongoose';

const CANONICAL_PERSONAS = ['college-student', 'postgraduate', 'fresher'];

export async function migratePersonas(): Promise<{ opportunitiesUpdated: number }> {
  const opportunities = await mongoose.connection.db
    ?.collection('opportunities')
    .find({})
    .toArray();

  let updated = 0;

  for (const opp of opportunities || []) {
    if (!opp.audiencePersonas || !Array.isArray(opp.audiencePersonas)) continue;

    const canonicalPersonas = opp.audiencePersonas.filter((p: string) =>
      CANONICAL_PERSONAS.includes(p),
    );

    if (canonicalPersonas.length !== opp.audiencePersonas.length) {
      await mongoose.connection.db
        ?.collection('opportunities')
        .updateOne({ _id: opp._id }, { $set: { audiencePersonas: canonicalPersonas } });

      updated++;
    }
  }

  console.log(`[Migration 003] Personas migrated: ${updated} opportunities updated`);
  return { opportunitiesUpdated: updated };
}
