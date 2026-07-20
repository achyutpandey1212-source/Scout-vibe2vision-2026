export interface BudgetConfig {
  maxDomainsPerRun?: number;
  maxAiCallsPerRun?: number;
}

export class AffiliateBudgetManager {
  private readonly maxDomainsPerRun: number;
  private readonly maxAiCallsPerRun: number;

  private domainsProcessed = 0;
  private aiCallsUsed = 0;
  private batchCount = 0;
  private startTime: number;

  constructor(config?: BudgetConfig) {
    const rawMaxDomains = process.env.AFFILIATE_MAX_DOMAINS_PER_RUN;
    const rawMaxAi = process.env.AFFILIATE_MAX_AI_CALLS;

    this.maxDomainsPerRun =
      config?.maxDomainsPerRun || (rawMaxDomains ? parseInt(rawMaxDomains, 10) : 200);
    this.maxAiCallsPerRun = config?.maxAiCallsPerRun || (rawMaxAi ? parseInt(rawMaxAi, 10) : 500);
    this.startTime = Date.now();
  }

  canContinue(): boolean {
    if (this.domainsProcessed >= this.maxDomainsPerRun) return false;
    if (this.aiCallsUsed >= this.maxAiCallsPerRun) return false;
    return true;
  }

  recordProcessed(count = 1): void {
    this.domainsProcessed += count;
  }

  recordAICall(count = 1): void {
    this.aiCallsUsed += count;
  }

  incrementBatch(): void {
    this.batchCount++;
  }

  getStats() {
    return {
      domainsProcessed: this.domainsProcessed,
      maxDomainsPerRun: this.maxDomainsPerRun,
      remainingDomainBudget: Math.max(0, this.maxDomainsPerRun - this.domainsProcessed),
      aiCallsUsed: this.aiCallsUsed,
      maxAiCallsPerRun: this.maxAiCallsPerRun,
      remainingAiCallBudget: Math.max(0, this.maxAiCallsPerRun - this.aiCallsUsed),
      batchCount: this.batchCount,
      durationMs: Date.now() - this.startTime,
    };
  }
}
