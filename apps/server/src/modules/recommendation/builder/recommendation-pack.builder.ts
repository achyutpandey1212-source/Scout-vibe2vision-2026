import { IRankedCandidate } from '../types/scoring.types';
import { IAIPersonalizationResponse, IAIPersonalizationMetadata } from '../ai/ai.types';
import { IRecommendationPack, RecommendationGenerationReason } from '../types/recommendation.types';
import { ENGINE_VERSION, SCHEMA_VERSION } from '../ai/ai.constants';
import mongoose from 'mongoose';

export class RecommendationPackBuilder {
  /**
   * Assembles the final fields for a Recommendation Pack with defensive access.
   */
  static build(
    userId: string,
    profileHash: string,
    generationReason: RecommendationGenerationReason,
    top5: any[],
    aiResponse: IAIPersonalizationResponse,
    aiMetadata: IAIPersonalizationMetadata,
    experimentGroup: string,
    qualityScore: number,
    discoverySnapshotVersion = 'DISCOVERY-v1',
    expiryHours = 24,
  ): Partial<IRecommendationPack> {
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + 1000 * 60 * 60 * expiryHours);

    const mapRecommendationItem = (slot: string, candidate: any) => {
      if (!candidate) return undefined;
      const opp = candidate.opportunity || candidate;
      const oppId = opp._id || opp.id;
      const score = candidate.totalScore ?? candidate.score ?? candidate.finalScore ?? 75;
      const confidence = opp.confidence || 'HIGH';

      const rawOppId = oppId ? oppId.toString() : null;
      const validObjectId =
        rawOppId && mongoose.Types.ObjectId.isValid(rawOppId)
          ? new mongoose.Types.ObjectId(rawOppId)
          : (rawOppId as any);

      const aiItem = aiResponse?.recommendationsBySlot?.[slot];
      return {
        opportunityId: validObjectId,
        score,
        confidence,
        personalizedReason:
          aiItem?.personalizedReason || 'Highly recommended based on your profile.',
        whyNow:
          aiItem?.whyNow ||
          aiItem?.confidenceMessage ||
          'Applications are currently open for active review.',
        missingSkills: aiItem?.missingSkills || [],
        firstAction: aiItem?.firstAction || 'Read the official application page.',
        scoreBreakdown: candidate.scoreBreakdown || {
          skillMatch: 25,
          projectMatch: 25,
          preferenceMatch: 0,
          titleRelevance: 0,
          recencyScore: 0,
          softPenalties: 0,
        },
      };
    };

    return {
      userId: new mongoose.Types.ObjectId(userId) as any,
      generatedAt,
      expiresAt,
      recommendationVersion: ENGINE_VERSION,
      profileHash,
      generationReason,
      todayMission: aiResponse?.todayMission || "Review today's personalized recommendations.",
      perfectMatch: mapRecommendationItem('perfectMatch', top5[0]),
      hiddenGem: mapRecommendationItem('hiddenGem', top5[1]),
      stretchGoal: mapRecommendationItem('stretchGoal', top5[2]),
      quickWin: mapRecommendationItem('quickWin', top5[3]),
      confidenceBuilder: mapRecommendationItem('confidenceBuilder', top5[4]),
      aiSummary: aiResponse?.aiSummary || 'Personalized recommendations tailored for your profile.',
      metadata: {
        provider: aiMetadata?.provider || 'local-fallback',
        model: aiMetadata?.model || 'fallback',
        promptVersion: aiMetadata?.promptVersion || 'v1',
        schemaVersion: SCHEMA_VERSION,
        engineVersion: ENGINE_VERSION,
        recommendationVersion: ENGINE_VERSION,
        scoringVersion: ENGINE_VERSION,
        experimentVersion: 'EXP-v1',
        discoverySnapshotVersion,
        experimentGroup,
        qualityScore,
        generationTimeMs: aiMetadata?.latencyMs || 0,
        candidateCount: top5.length,
        filteredCount: top5.length,
        aiLatency: aiMetadata?.latencyMs || 0,
        cacheHit: false,
        fallbackUsed: Boolean(aiMetadata?.fallbackUsed),
        repairUsed: Boolean(aiMetadata?.repairUsed),
        promptLength: aiMetadata?.promptLength || 0,
        responseLength: aiMetadata?.responseLength || 0,
        promptHash: aiMetadata?.promptHash || '',
      } as any,
    };
  }
}
