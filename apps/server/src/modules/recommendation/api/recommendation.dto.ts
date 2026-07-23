import { IRecommendationPack } from '../types/recommendation.types';

export class RecommendationDto {
  /**
   * Serializes a RecommendationPack into a clean, frontend-safe DTO.
   * Ensures id and packId are explicitly populated for analytics event propagation.
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
        executiveSummary: item.executiveSummary || '',
        whyScoutPickedThis: item.whyScoutPickedThis || '',
        strongestStrengths: item.strongestStrengths || [],
        resumeImprovements: item.resumeImprovements || [],
        interviewPrep: item.interviewPrep || [],
        applicationConfidence: item.applicationConfidence || null,
        nextAction: item.nextAction || '',
        scoutVerdict: item.scoutVerdict || null,
        applicationStrategy: item.applicationStrategy || '',
        preparationChecklist: item.preparationChecklist || [],
      };
    };

    const packIdStr = pack._id ? pack._id.toString() : '';

    return {
      id: packIdStr,
      packId: packIdStr,
      userId: pack.userId ? pack.userId.toString() : '',
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
