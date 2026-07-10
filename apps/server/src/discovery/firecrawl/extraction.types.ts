export interface ExtractedMetadata {
  description?: string;
  language?: string;
  author?: string;
  publishedDate?: string;
  image?: string;
  domain?: string;
  [key: string]: any; // Future metadata growth slot
}

export interface ExtractedPage {
  url: string;
  title: string;
  markdown: string;
  metadata: ExtractedMetadata;
  extractedAt: string;
  source: 'firecrawl' | 'tavily_snippet';
  searchQuery: string;
  originalScore: number;
  needsExtraction: boolean;
  hash: string;
}

export interface ExtractionFailure {
  url: string;
  reason: string;
  stage: 'firecrawl';
  retries: number;
}

export interface OrchestratorExtractionResponse {
  extracted: ExtractedPage[];
  failed: ExtractionFailure[];
}
