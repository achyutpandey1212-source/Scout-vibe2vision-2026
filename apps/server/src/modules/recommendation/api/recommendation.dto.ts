import { IRecommendationPack } from '../types/recommendation.types';

export class RecommendationDto {
  /**
   * Serializes a RecommendationPack into a clean, frontend-safe DTO.
   * Strips debugging prompt configuration, hashes, provider specs, and score breakdowns.
   */
  static toDto(pack: IRecommendationPack): any {
    const mapItem = (item: any) => {
      if (!item || !item.opportunityId) return null;
      return {
        opportunity: item.opportunityId, // Populated opportunity details
        score: item.score,
        personalizedReason: item.personalizedReason || '',
        whyNow: item.whyNow || '',
        missingSkills: item.missingSkills || [],
        firstAction: item.firstAction || '',
      };
    };

    return {
      id: pack._id.toString(),
      userId: pack.userId.toString(),
      generatedAt: pack.generatedAt,
      expiresAt: pack.expiresAt,
      todayMission: pack.todayMission || '',
      aiSummary: pack.aiSummary || '',
      perfectMatch: mapItem(pack.perfectMatch),
      hiddenGem: mapItem(pack.hiddenGem),
      stretchGoal: mapItem(pack.stretchGoal),
      quickWin: mapItem(pack.quickWin),
      confidenceBuilder: mapItem(pack.confidenceBuilder),
    };
  }
}
