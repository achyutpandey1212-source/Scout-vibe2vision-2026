export interface RecommendationFactor {
  factorName: string;
  score: number;
  maxScore: number;
  reason: string;
}

export interface RecommendationResult {
  score: number;
  matchedFactors: string[];
  missingFactors: string[];
  explanation: string[];
}
