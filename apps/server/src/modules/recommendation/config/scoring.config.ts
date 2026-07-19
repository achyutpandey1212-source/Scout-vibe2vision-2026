import { RecommendationConfig } from './recommendation-config';

// Backwards-compatible export mapping to Group A weights dynamically
export const ScoringWeights = new Proxy({} as any, {
  get(_, prop: string) {
    const weights = RecommendationConfig.getWeights('A') as any;
    return weights[prop];
  },
});
