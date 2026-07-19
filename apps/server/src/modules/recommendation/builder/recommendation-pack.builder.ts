import { IRankedCandidate } from '../types/scoring.types';
import { IAIPersonalizationResponse, IAIPersonalizationMetadata } from '../ai/ai.types';
import { IRecommendationPack, RecommendationGenerationReason } from '../types/recommendation.types';
import { ENGINE_VERSION, SCHEMA_VERSION } from '../ai/ai.constants';
import mongoose from 'mongoose';

export class RecommendationPackBuilder {
  /**
   * Assembles the final fields for a Recommendation Pack.
   */
  static build(
    userId: string,
    profileHash: string,
    generationReason: RecommendationGenerationReason,
    top5: IRankedCandidate[],
    aiResponse: IAIPersonalizationResponse,
    aiMetadata: IAIPersonalizationMetadata,
    experimentGroup: string,
    qualityScore: number,
    discoverySnapshotVersion = 'DISCOVERY-v1',
    expiryHours = 24,
  ): Partial<IRecommendationPack> {
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + 1000 * 60 * 60 * expiryHours);

    const mapRecommendationItem = (slot: string, candidate: IRankedCandidate | undefined) => {
      if (!candidate) return undefined;
      const aiItem = aiResponse.recommendationsBySlot[slot];
      return {
        opportunityId: candidate.opportunity._id as any,
        score: candidate.finalScore,
        confidence: candidate.opportunity.confidence,
        personalizedReason: aiItem?.personalizedReason || '',
        whyNow: aiItem?.confidenceMessage || 'Highly recommended based on your profile.',
        missingSkills: aiItem?.missingSkills || [],
        firstAction: aiItem?.firstAction || 'Read the official application page.',
        scoreBreakdown: candidate.scoreBreakdown,
      };
    };

    return {
      userId: new mongoose.Types.ObjectId(userId) as any,
      generatedAt,
      expiresAt,
      recommendationVersion: ENGINE_VERSION,
      profileHash,
      generationReason,
      todayMission: aiResponse.todayMission,
      perfectMatch: mapRecommendationItem('perfectMatch', top5[0]),
      hiddenGem: mapRecommendationItem('hiddenGem', top5[1]),
      stretchGoal: mapRecommendationItem('stretchGoal', top5[2]),
      quickWin: mapRecommendationItem('quickWin', top5[3]),
      confidenceBuilder: mapRecommendationItem('confidenceBuilder', top5[4]),
      aiSummary: aiResponse.aiSummary,
      metadata: {
        provider: aiMetadata.provider,
        model: aiMetadata.model,
        promptVersion: aiMetadata.promptVersion,
        schemaVersion: SCHEMA_VERSION,
        engineVersion: ENGINE_VERSION,
        recommendationVersion: ENGINE_VERSION,
        scoringVersion: ENGINE_VERSION,
        experimentVersion: 'EXP-v1',
        discoverySnapshotVersion,
        experimentGroup,
        qualityScore,
        generationTimeMs: aiMetadata.latencyMs, // initially latency, will be updated to include full flow duration
        candidateCount: top5.length,
        filteredCount: top5.length,
        aiLatency: aiMetadata.latencyMs,
        cacheHit: false,
        fallbackUsed: aiMetadata.fallbackUsed,
        repairUsed: aiMetadata.repairUsed,
        promptLength: aiMetadata.promptLength,
        responseLength: aiMetadata.responseLength,
        promptHash: aiMetadata.promptHash,
      } as any,
    };
  }
}
