export interface IFeatureFlags {
  enableWomenBonus: boolean;
  enableHiddenGemBonus: boolean;
  enableDiversification: boolean;
  enableAIPersonalization: boolean;
  enableConfidenceBonus: boolean;
  enableDeadlineBonus: boolean;
  enablePortfolioBonus: boolean;
}

export interface IScoringWeights {
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

export interface IHealthThresholds {
  maxAverageLatencyMs: number;
  maxFallbackRate: number;
  minSuccessRate: number;
}

export class RecommendationConfig {
  private static mode: 'PRODUCTION' | 'DEVELOPMENT' | 'MAINTENANCE' = 'PRODUCTION';
  private static modeChangedBy = 'System';
  private static modeChangedAt = new Date();

  private static flags: IFeatureFlags = {
    enableWomenBonus: true,
    enableHiddenGemBonus: true,
    enableDiversification: true,
    enableAIPersonalization: true,
    enableConfidenceBonus: true,
    enableDeadlineBonus: true,
    enablePortfolioBonus: true,
  };

  private static healthThresholds: IHealthThresholds = {
    maxAverageLatencyMs: 6000,
    maxFallbackRate: 0.1, // 10%
    minSuccessRate: 0.95, // 95%
  };

  // Group A (Default) Weights
  private static weightsGroupA: IScoringWeights = {
    baseMatch: 25,
    interest: 20,
    careerStage: 10,
    difficulty: 10,
    availability: 5,
    remote: 5,
    womenBonus: 5,
    portfolio: 10,
    hiddenGem: 5,
    deadline: 3,
    confidence: 2,
  };

  // Group B (Tweaked Variant) Weights
  private static weightsGroupB: IScoringWeights = {
    baseMatch: 20,
    interest: 25,
    careerStage: 8,
    difficulty: 8,
    availability: 4,
    remote: 4,
    womenBonus: 6,
    portfolio: 12,
    hiddenGem: 6,
    deadline: 4,
    confidence: 3,
  };

  static getFlags(): IFeatureFlags {
    return { ...this.flags };
  }

  static setFlags(updated: Partial<IFeatureFlags>): void {
    this.flags = { ...this.flags, ...updated };
  }

  static getWeights(experimentGroup: 'A' | 'B' | string = 'A'): IScoringWeights {
    return experimentGroup === 'B' ? { ...this.weightsGroupB } : { ...this.weightsGroupA };
  }

  static setWeights(experimentGroup: 'A' | 'B', updated: Partial<IScoringWeights>): void {
    if (experimentGroup === 'B') {
      this.weightsGroupB = { ...this.weightsGroupB, ...updated };
    } else {
      this.weightsGroupA = { ...this.weightsGroupA, ...updated };
    }
  }

  static getThresholds(): IHealthThresholds {
    return { ...this.healthThresholds };
  }

  static getMode() {
    return {
      mode: this.mode,
      changedBy: this.modeChangedBy,
      changedAt: this.modeChangedAt,
    };
  }

  static setMode(mode: 'PRODUCTION' | 'DEVELOPMENT' | 'MAINTENANCE', operator: string) {
    this.mode = mode;
    this.modeChangedBy = operator;
    this.modeChangedAt = new Date();
  }
}
