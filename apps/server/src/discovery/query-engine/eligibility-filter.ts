export class EligibilityFilter {
  /**
   * Validates if the page content matches India or Remote eligibility guidelines.
   * Rejects USA/Europe/UK/Canada only listings or visa authorization restrictions pre-AI.
   */
  static isEligible(text: string): { eligible: boolean; reason?: string } {
    const lower = text.toLowerCase();

    // Explicit geoblocking rules
    const negatives = [
      'us citizen only',
      'united states citizen',
      'us work authorization required',
      'authorized to work in the us',
      'authorized to work in the usa',
      'must be located in the us',
      'must be located in the united states',
      'uk citizen only',
      'must be located in canada',
      'work authorization in canada',
      'visa sponsorship not available',
      'no visa sponsorship',
      'does not offer visa sponsorship',
      'must be authorized to work in the united states',
      'must be authorized to work in us',
      'us only',
      'canada only',
      'uk only',
      'europe only',
      'citizens only',
      'permanent residents only',
    ];

    for (const neg of negatives) {
      if (lower.includes(neg)) {
        return { eligible: false, reason: `Explicit restriction matched: "${neg}"` };
      }
    }

    // Positive indicators (India hubs or Remote)
    const positives = [
      'india',
      'remote',
      'bangalore',
      'bengaluru',
      'pune',
      'hyderabad',
      'delhi',
      'ncr',
      'noida',
      'gurugram',
      'gurgaon',
      'mumbai',
      'chennai',
    ];

    const hasPositive = positives.some((pos) => lower.includes(pos));
    if (!hasPositive) {
      return { eligible: false, reason: 'No matching India hub or remote signal found' };
    }

    return { eligible: true };
  }
}
export default EligibilityFilter;
