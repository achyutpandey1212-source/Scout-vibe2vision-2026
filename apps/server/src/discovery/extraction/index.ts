export type * from './types/opportunity.types';
export { OpportunitySchema } from './schemas/opportunity.schema';
export type { IOpportunity } from './models/opportunity.model';
export { OpportunityModel } from './models/opportunity.model';
export { extractOpportunityFromPage } from './extractor/opportunity-extractor';
export { EXTRACTION_VERSION } from './prompts/extract-opportunity.prompt';
