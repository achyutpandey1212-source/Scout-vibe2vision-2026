import { SourceType } from '../../../discovery/extraction/types/opportunity.types';

export interface OrgAliasMapping {
  aliases: string[];
  standardName: string;
}

export interface DomainSourceTypeMapping {
  suffixes: string[];
  sourceType: SourceType;
}

export interface CategoryKeywordMapping {
  category: string;
  keywords: string[];
}

export interface MetadataKeywords {
  government: string[];
  remote: string[];
  paidStipend: string[];
  resume: string[];
  portfolio: string[];
  experience: string[];
  degree: string[];
  countries: { [key: string]: string[] };
}

export interface EnrichmentConfig {
  organizationAliases: OrgAliasMapping[];
  domainSourceMappings: DomainSourceTypeMapping[];
  categoryKeywords: CategoryKeywordMapping[];
  metadataKeywords: MetadataKeywords;
}
