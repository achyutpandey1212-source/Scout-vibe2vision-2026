export class EligibilityFilter {
  /**
   * Validates if the page content matches India or Remote eligibility guidelines.
   * Rejects USA/Europe/UK/Canada only listings or visa authorization restrictions pre-AI.
   */
  static isEligible(
    text: string,
    url?: string,
    title?: string,
  ): { eligible: boolean; reason?: string } {
    const combinedText = `${text || ''} ${title || ''} ${url || ''}`.toLowerCase();

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
      if (combinedText.includes(neg)) {
        return { eligible: false, reason: `Explicit restriction matched: "${neg}"` };
      }
    }

    // Check hostname FIRST before page content inspection
    if (url) {
      try {
        const hostname = new URL(url).hostname.toLowerCase();
        const isIndiaDomain =
          hostname === 'in.indeed.com' ||
          hostname.endsWith('.in.indeed.com') ||
          hostname.startsWith('in.') ||
          hostname.endsWith('.co.in') ||
          hostname.endsWith('.gov.in') ||
          hostname.endsWith('.nic.in') ||
          hostname.endsWith('.ac.in') ||
          hostname.endsWith('.org.in') ||
          hostname.endsWith('.edu.in') ||
          hostname.endsWith('.res.in') ||
          hostname.endsWith('.in') ||
          hostname.includes('naukri.com') ||
          hostname.includes('internshala.com') ||
          hostname.includes('unstop.com') ||
          hostname.includes('devfolio.co');

        if (isIndiaDomain) {
          return { eligible: true };
        }
      } catch {
        // Ignore URL parsing errors
      }
    }

    // Positive indicators (India hubs or Remote) for non-India domain hosts
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
      'kolkata',
      'ahmedabad',
    ];

    const hasPositive = positives.some((pos) => combinedText.includes(pos));
    if (!hasPositive) {
      return { eligible: false, reason: 'No matching India hub or remote signal found' };
    }

    return { eligible: true };
  }
}
export default EligibilityFilter;
