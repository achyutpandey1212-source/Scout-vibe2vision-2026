import { IRecommendationPack } from '../types/recommendation.types';

export interface IRecommendationExplanationReport {
  userId: string;
  packId: string;
  generatedAt: Date;
  todayMission: string;
  aiSummary: string;
  experimentGroup: string;
  recommendations: Record<
    string,
    {
      opportunityId: string;
      score: number;
      personalizedReason: string;
      whyNow: string;
      firstAction: string;
      missingSkills: string[];
      scoreBreakdown: Record<string, number>;
    }
  >;
}

export class RecommendationExplainabilityService {
  /**
   * Generates a detailed audit/explainability report for a Recommendation Pack
   * exposing internal scoring factors, experiment flags, and metadata details.
   */
  static explainPack(pack: IRecommendationPack): IRecommendationExplanationReport | null {
    if (!pack) return null;

    const mapItem = (item: any) => {
      if (!item || !item.opportunityId) return null;
      return {
        opportunityId: item.opportunityId._id?.toString() || item.opportunityId.toString(),
        score: item.score,
        personalizedReason: item.personalizedReason || '',
        whyNow: item.whyNow || '',
        firstAction: item.firstAction || '',
        missingSkills: item.missingSkills || [],
        scoreBreakdown: item.scoreBreakdown || {},
      };
    };

    const recommendations: Record<string, any> = {};
    if (pack.perfectMatch?.opportunityId) recommendations.perfectMatch = mapItem(pack.perfectMatch);
    if (pack.hiddenGem?.opportunityId) recommendations.hiddenGem = mapItem(pack.hiddenGem);
    if (pack.stretchGoal?.opportunityId) recommendations.stretchGoal = mapItem(pack.stretchGoal);
    if (pack.quickWin?.opportunityId) recommendations.quickWin = mapItem(pack.quickWin);
    if (pack.confidenceBuilder?.opportunityId)
      recommendations.confidenceBuilder = mapItem(pack.confidenceBuilder);

    return {
      userId: pack.userId.toString(),
      packId: pack._id.toString(),
      generatedAt: pack.generatedAt,
      todayMission: pack.todayMission || '',
      aiSummary: pack.aiSummary || '',
      experimentGroup: pack.metadata?.experimentGroup || 'A',
      recommendations,
    };
  }
}
