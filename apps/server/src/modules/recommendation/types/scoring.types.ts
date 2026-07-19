import { IOpportunity } from '../../../discovery/extraction/models/opportunity.model';

export interface IScoreBreakdown {
  [key: string]: number;
  baseMatch: number;
  interest: number;
  careerStage: number;
  difficulty: number;
  availability: number;
  remote: number;
  womenBonus: number;
  portfolio: number;
  hiddenGem: number;
  deadline: number;
  confidence: number;
}

export interface IRecommendationExplanation {
  type:
    | 'baseMatch'
    | 'interest'
    | 'careerStage'
    | 'difficulty'
    | 'availability'
    | 'remote'
    | 'womenBonus'
    | 'portfolio'
    | 'hiddenGem'
    | 'deadline'
    | 'confidence';
  message: string;
}

export interface IRankedCandidate {
  opportunity: IOpportunity;
  finalScore: number;
  rank: number;
  scoreBreakdown: IScoreBreakdown;
  recommendationExplanations: IRecommendationExplanation[];
  diversificationTags: {
    category: string;
    organization: string;
    domain: string;
    workMode: string;
  };
}
