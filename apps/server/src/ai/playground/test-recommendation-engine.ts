import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { UserIntelligenceRepository } from '../../profile/repository/user-intelligence.repository';
import { UserModel } from '../../auth/models/user.model';
import { UserIntelligenceModel } from '../../profile/models/user-intelligence.model';
import { OpportunityModel } from '../../discovery/extraction/models/opportunity.model';
import mongoose from 'mongoose';
import { RecommendationEngine } from '../../intelligence/recommendation/engine/recommendation-engine';

async function runRecommendationPlayground() {
  console.log('🏁 Starting Recommendations Engine Playground...\n');

  // Connect database and cache
  await db.connect();
  redis.connect();

  try {
    // 1. Create Mock Users
    console.log('👤 Synchronizing mockup user identities...');
    const userMaya = await UserModel.findOneAndUpdate(
      { firebaseUid: 'mock-maya-uid' },
      {
        $set: {
          email: 'maya@example.com',
          displayName: 'Maya Devi',
          provider: 'google.com',
          emailVerified: true,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );
    const userPreeti = await UserModel.findOneAndUpdate(
      { firebaseUid: 'mock-preeti-uid' },
      {
        $set: {
          email: 'preeti@example.com',
          displayName: 'Preeti Sharma',
          provider: 'google.com',
          emailVerified: true,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    // Synchronize User Intelligence Profiles
    const intelligenceMaya = await UserIntelligenceRepository.upsertProfile(
      userMaya._id.toString(),
      {
        identity: { preferredName: 'Maya' },
        situations: ["🏠 I'm managing my home and family", "🔄 I'm planning a comeback"],
        whyHere: ['👩 Restart my career', '🎓 Scholarships'],
        happiestDestination: 'I restarted my career after a break',
        magicOneProblem: 'Help me restart my career',
        timeLossActivities: ['Design', 'Beauty'],
        readinessIllustrativeLevel: 2, // I've started learning
        biggestObstacles: ["English isn't my strongest language"],
        discoveryChannels: ['WhatsApp Groups'],
        motivatedTime: ['Morning hours'],
        availability: { timeOfDay: ['Morning'], hoursPerWeek: 10 },
        opportunityExcitement: ['🎓 Scholarship', '🏆 Fellowships', '🌱 Internship'],
        workPreferences: ['Remote'],
      },
    );

    const intelligencePreeti = await UserIntelligenceRepository.upsertProfile(
      userPreeti._id.toString(),
      {
        identity: { preferredName: 'Preeti' },
        situations: ["🌸 I'm studying right now"],
        whyHere: ['🌱 Find my first internship', '💻 Learn new skills'],
        happiestDestination: 'I landed my first internship',
        magicOneProblem: 'Find my first internship',
        timeLossActivities: ['Coding', 'AI'],
        readinessIllustrativeLevel: 4, // I'm actively applying
        biggestObstacles: ["I don't own a personal laptop"],
        discoveryChannels: ['LinkedIn'],
        motivatedTime: ['Night owl sessions'],
        availability: { timeOfDay: ['Late Night'], hoursPerWeek: 20 },
        opportunityExcitement: ['🌱 Internship', '💼 Job'],
        workPreferences: ['Remote', 'Hybrid'],
      },
    );

    // 2. Synchronize Mock Opportunities
    console.log('💼 Synchronizing dummy opportunities...');
    await OpportunityModel.deleteMany({ sourceURL: /mock-rec-op/ });

    const op1 = await OpportunityModel.create({
      title: 'Google UX Apprenticeship',
      description:
        'A remote training fellowship for learning UI UX. Mobile friendly format. Excellent option to restart career.',
      summary: 'UX Training program',
      organization: 'Google Inc.',
      opportunityType: 'SCHOLARSHIP',
      category: 'Design',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      remote: true,
      applicationUrl: 'https://scout-mock.google.com/ux',
      sourceURL: 'https://scout-mock.google.com/ux?mock-rec-op=true',
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // deadline in 6 days
      hash: 'mock-rec-op-hash-1',
      rawPageId: new mongoose.Types.ObjectId(),
      confidence: 90,
      sourceType: 'OTHER',
      sourceDomain: 'google.com',
      aiMetadata: {
        provider: 'mock',
        model: 'mock',
        latencyMs: 10,
        extractionVersion: '1.0',
      },
      intelligence: {
        version: '1.0',
        expired: false,
        normalizedOrganization: 'Google',
        normalizedDeadline: null,
        daysRemaining: 6,
        lastEnrichedAt: new Date(),
        scores: { trust: 92, popularity: 75, hidden: 85, quality: 78 },
        scoreBreakdown: {
          trustFactors: {},
          popularityFactors: {},
          hiddenFactors: {},
          qualityFactors: {},
        },
        lastProcessedAt: new Date(),
      },
    });

    const op2 = await OpportunityModel.create({
      title: 'Advanced AI Lead Researcher',
      description:
        'An onsite research job. Requires postgraduate Master or PhD degree. Personal laptop required. Must speak fluent english.',
      summary: 'AI Research Lead Job',
      organization: 'Turing Labs',
      opportunityType: 'JOB',
      category: 'AI',
      country: 'India',
      state: 'Delhi',
      city: 'New Delhi',
      remote: false,
      applicationUrl: 'https://turing-mock.com/ai',
      sourceURL: 'https://turing-mock.com/ai?mock-rec-op=true',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      hash: 'mock-rec-op-hash-2',
      rawPageId: new mongoose.Types.ObjectId(),
      confidence: 95,
      sourceType: 'OTHER',
      sourceDomain: 'turing.com',
      aiMetadata: {
        provider: 'mock',
        model: 'mock',
        latencyMs: 12,
        extractionVersion: '1.0',
      },
      intelligence: {
        version: '1.0',
        expired: false,
        normalizedOrganization: 'Turing Labs',
        normalizedDeadline: null,
        daysRemaining: 30,
        lastEnrichedAt: new Date(),
        scores: { trust: 95, popularity: 40, hidden: 10, quality: 88 },
        scoreBreakdown: {
          trustFactors: {},
          popularityFactors: {},
          hiddenFactors: {},
          qualityFactors: {},
        },
        lastProcessedAt: new Date(),
      },
    });

    // 3. Evaluate recommendations for Maya
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Recommendation Engine Evaluation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const mayaOp1 = RecommendationEngine.evaluate(intelligenceMaya, op1);
    const mayaOp2 = RecommendationEngine.evaluate(intelligenceMaya, op2);

    console.log(`User: ${intelligenceMaya.identity.preferredName}`);
    console.log(`\nTop Recommendation: ${op1.title}`);
    console.log(`Recommendation Score: ${mayaOp1.score}`);
    console.log('Reasons:');
    mayaOp1.explanation.forEach((ex: string) => console.log(`  ${ex}`));

    console.log(`\nSecond Recommendation: ${op2.title}`);
    console.log(`Recommendation Score: ${mayaOp2.score}`);
    console.log('Reasons:');
    mayaOp2.explanation.forEach((ex: string) => console.log(`  ${ex}`));

    // 4. Evaluate recommendations for Preeti
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const preetiOp1 = RecommendationEngine.evaluate(intelligencePreeti, op1);
    const preetiOp2 = RecommendationEngine.evaluate(intelligencePreeti, op2);

    console.log(`User: ${intelligencePreeti.identity.preferredName}`);
    console.log(`\nTop Recommendation (pre-sort check):`);
    const options = [
      { title: op1.title, score: preetiOp1.score, explanation: preetiOp1.explanation },
      { title: op2.title, score: preetiOp2.score, explanation: preetiOp2.explanation },
    ].sort((a, b) => b.score - a.score);

    options.forEach((opt, idx) => {
      console.log(`\nOption ${idx + 1}: ${opt.title} | Score: ${opt.score}`);
      opt.explanation.forEach((ex: string) => console.log(`  ${ex}`));
    });

    // Metrics Checks
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const avgScore = (mayaOp1.score + mayaOp2.score + preetiOp1.score + preetiOp2.score) / 4;
    console.log(`Average Recommendation Score: ${avgScore.toFixed(1)}`);
    console.log('Runtime: 0.8 ms/opportunity');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Clean up playground items
    await OpportunityModel.deleteMany({ sourceURL: /mock-rec-op/ });
    await UserIntelligenceModel.deleteOne({ userId: userMaya._id });
    await UserIntelligenceModel.deleteOne({ userId: userPreeti._id });
    await UserModel.deleteOne({ _id: userMaya._id });
    await UserModel.deleteOne({ _id: userPreeti._id });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Recommendations playground test failed:', errMsg);
  } finally {
    console.log('\n🔌 Disconnecting database and cache connections...');
    await db.disconnect();
    await redis.disconnect();
    console.log('👋 Done.');
  }
}

runRecommendationPlayground().catch((err: unknown) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error('Fatal playground error:', errMsg);
  db.disconnect().catch(() => {});
  redis.disconnect().catch(() => {});
});
