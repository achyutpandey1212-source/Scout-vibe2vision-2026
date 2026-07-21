export interface DashboardState {
  isRunning: boolean;
  currentStage:
    | 'IDLE'
    | 'STAGE_1_DISCOVERY'
    | 'STAGE_2_CRAWLING'
    | 'STAGE_3_EXTRACTION'
    | 'STAGE_4_QUALITY'
    | 'STAGE_5_PERSISTENCE';
  currentUrl: string;
  currentProvider: string;
  currentKeyAlias: string;
  urlsFound: number;
  pagesCrawled: number;
  detectorSkipped: number;
  aiProcessed: number;
  inserted: number;
  updated: number;
  archived: number;
  failures: number;
  firecrawlError: string | null;
  startedAt: Date | null;

  // New Adaptive Crawl Queue Dashboard State fields
  crawlQueueRemaining?: number;
  crawlBatchNumber?: number;
  crawlCurrentlyCrawling?: string[];
  crawlCompleted?: number;
  crawlFailed?: number;

  // Phase 4 Affiliate Queue Streaming State fields
  affiliateQueueState?: {
    totalPending: number;
    batchSize: number;
    estimatedBatches: number;
    currentCursor: number;
    progressPercentage: number;
    currentBatch: number;
    processed: number;
    remaining: number;
    status: 'idle' | 'running' | 'paused' | 'completed';
    pauseReason?: string;
  };

  // Phase 3 Opportunity Intelligence metrics
  goldOpportunitiesDetected?: number;
  averageQualityScore?: number;
  companyExpansionsCount?: number;

  // Phase 1 Precision Queries metrics
  queriesSkipped?: number;
  directUrlsFound?: number;
  atsUrlsFound?: number;
  searchBudgetSaved?: number;
  skippedNonHtmlResources?: number;
  atsPagesDetected?: number;
  careerPages?: number;
  multiJobPages?: number;
  jobsExtractedWithoutAI?: number;
  averageOpportunitiesPerDirectory?: number;

  // Discovery Engine V2 Listing Board Metrics
  boardPagesDetected?: number;
  listingsHarvested?: number;
  listingsCrawled?: number;
  listingsDeduplicated?: number;
  avgListingsPerBoard?: number;

  // Discovery Engine V2.1 Telemetry metrics
  listingBoardsDetected?: number;
  listingPagesSkipped?: number;
  jobDetailUrlsExtracted?: number;
  jobDetailUrlsCrawled?: number;
  listingUrlsDiscarded?: number;
  duplicateListingUrls?: number;
  queuePeakSize?: number;
  queueFinalSize?: number;
  averageJobUrlsPerBoard?: number;
  recursiveExpansionsPrevented?: number;
}

class DashboardStateManager {
  private static instance: DashboardStateManager;
  private state: DashboardState = {
    isRunning: false,
    currentStage: 'IDLE',
    currentUrl: '',
    currentProvider: '',
    currentKeyAlias: '',
    urlsFound: 0,
    pagesCrawled: 0,
    detectorSkipped: 0,
    aiProcessed: 0,
    inserted: 0,
    updated: 0,
    archived: 0,
    failures: 0,
    firecrawlError: null,
    startedAt: null,
    crawlQueueRemaining: 0,
    crawlBatchNumber: 0,
    crawlCurrentlyCrawling: [],
    crawlCompleted: 0,
    crawlFailed: 0,
    goldOpportunitiesDetected: 0,
    averageQualityScore: 0,
    companyExpansionsCount: 0,
    queriesSkipped: 0,
    directUrlsFound: 0,
    atsUrlsFound: 0,
    searchBudgetSaved: 0,
    skippedNonHtmlResources: 0,
    atsPagesDetected: 0,
    careerPages: 0,
    multiJobPages: 0,
    jobsExtractedWithoutAI: 0,
    averageOpportunitiesPerDirectory: 0,
    boardPagesDetected: 0,
    listingsHarvested: 0,
    listingsCrawled: 0,
    listingsDeduplicated: 0,
    avgListingsPerBoard: 0,
    listingBoardsDetected: 0,
    listingPagesSkipped: 0,
    jobDetailUrlsExtracted: 0,
    jobDetailUrlsCrawled: 0,
    listingUrlsDiscarded: 0,
    duplicateListingUrls: 0,
    queuePeakSize: 0,
    queueFinalSize: 0,
    averageJobUrlsPerBoard: 0,
    recursiveExpansionsPrevented: 0,
  };

  private constructor() {}

  static getInstance(): DashboardStateManager {
    if (!DashboardStateManager.instance) {
      DashboardStateManager.instance = new DashboardStateManager();
    }
    return DashboardStateManager.instance;
  }

  getState(): DashboardState {
    return { ...this.state };
  }

  updateState(update: Partial<DashboardState>) {
    this.state = {
      ...this.state,
      ...update,
    };
  }

  reset() {
    this.state = {
      isRunning: false,
      currentStage: 'IDLE',
      currentUrl: '',
      currentProvider: '',
      currentKeyAlias: '',
      urlsFound: 0,
      pagesCrawled: 0,
      detectorSkipped: 0,
      aiProcessed: 0,
      inserted: 0,
      updated: 0,
      archived: 0,
      failures: 0,
      firecrawlError: null,
      startedAt: null,
      crawlQueueRemaining: 0,
      crawlBatchNumber: 0,
      crawlCurrentlyCrawling: [],
      crawlCompleted: 0,
      crawlFailed: 0,
      goldOpportunitiesDetected: 0,
      averageQualityScore: 0,
      companyExpansionsCount: 0,
      queriesSkipped: 0,
      directUrlsFound: 0,
      atsUrlsFound: 0,
      searchBudgetSaved: 0,
      skippedNonHtmlResources: 0,
      atsPagesDetected: 0,
      careerPages: 0,
      multiJobPages: 0,
      jobsExtractedWithoutAI: 0,
      averageOpportunitiesPerDirectory: 0,
      boardPagesDetected: 0,
      listingsHarvested: 0,
      listingsCrawled: 0,
      listingsDeduplicated: 0,
      avgListingsPerBoard: 0,
    };
  }
}

export const DashboardStateInstance = DashboardStateManager.getInstance();
