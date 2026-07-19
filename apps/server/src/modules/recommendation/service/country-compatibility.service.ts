import { IOpportunity } from '../../../discovery/extraction/models/opportunity.model';

export class CountryCompatibilityService {
  /**
   * Checks if the opportunity requires specific foreign citizenship that matches the user (default: India).
   */
  static isCountryCompatible(opportunity: IOpportunity, userCountry = 'India'): boolean {
    const desc =
      (opportunity.description || '') +
      ' ' +
      (opportunity.title || '') +
      ' ' +
      (opportunity.eligibility || '');
    const lowerDesc = desc.toLowerCase();

    // Specific citizenship restrictions
    const usCitizenRegex = /\bus\s+citizens?\b/i;
    const canadaCitizenRegex = /\bcanadian\s+citizens?\b/i;
    const euCitizenRegex = /\beu\s+citizens?\b/i;
    const ukCitizenRegex = /\buk\s+citizens?\b/i;

    if (userCountry === 'India') {
      if (
        usCitizenRegex.test(lowerDesc) ||
        canadaCitizenRegex.test(lowerDesc) ||
        euCitizenRegex.test(lowerDesc) ||
        ukCitizenRegex.test(lowerDesc)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if the opportunity requires work authorization or visa sponsorship that is unavailable.
   */
  static isVisaCompatible(opportunity: IOpportunity, userCountry = 'India'): boolean {
    if (opportunity.visaSponsored === true) {
      return true;
    }

    const desc =
      (opportunity.description || '') +
      ' ' +
      (opportunity.title || '') +
      ' ' +
      (opportunity.eligibility || '');
    const lowerDesc = desc.toLowerCase();

    // Check if visa/work auth is required in description
    const usAuthRegex =
      /\b(us\s+work\s+authorization|authorized\s+to\s+work\s+in\s+the\s+us|h-1b|greencard|green\s+card)\b/i;
    const ukAuthRegex = /\b(uk\s+work\s+authorization|right\s+to\s+work\s+in\s+the\s+uk)\b/i;
    const canadaAuthRegex =
      /\b(canada\s+work\s+authorization|eligible\s+to\s+work\s+in\s+canada)\b/i;

    if (userCountry === 'India') {
      if (
        usAuthRegex.test(lowerDesc) ||
        ukAuthRegex.test(lowerDesc) ||
        canadaAuthRegex.test(lowerDesc)
      ) {
        return false;
      }
    }

    return true;
  }
}
