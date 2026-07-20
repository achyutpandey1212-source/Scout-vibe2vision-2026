export interface BudgetStats {
  careerPagesVisited: number;
  maxCareerDepth: number;
}

export class CrawlBudgetManager {
  private readonly maxCareerDepth: number;
  private careerPagesVisited = 0;

  constructor(maxCareerDepth = 30) {
    const rawDepth = process.env.DISCOVERY_MAX_CAREER_DEPTH;
    this.maxCareerDepth = rawDepth ? parseInt(rawDepth, 10) : maxCareerDepth;
  }

  canVisitCareerPage(): boolean {
    return this.careerPagesVisited < this.maxCareerDepth;
  }

  recordCareerPageVisit(): void {
    this.careerPagesVisited++;
  }

  getStats(): BudgetStats {
    return {
      careerPagesVisited: this.careerPagesVisited,
      maxCareerDepth: this.maxCareerDepth,
    };
  }
}
export default CrawlBudgetManager;
