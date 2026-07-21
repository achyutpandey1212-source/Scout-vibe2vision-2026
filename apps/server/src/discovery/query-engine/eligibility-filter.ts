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

    const matchedNegatives: string[] = [];
    for (const neg of negatives) {
      if (lower.includes(neg)) {
        matchedNegatives.push(neg);
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

    const matchedPositives = positives.filter((pos) => lower.includes(pos));

    let eligible = true;
    let reason = '';

    if (matchedNegatives.length > 0) {
      eligible = false;
      reason = `Explicit restriction matched: "${matchedNegatives.join(', ')}"`;
    } else if (matchedPositives.length === 0) {
      eligible = false;
      reason = 'No matching India hub or remote signal found';
    }

    if (!eligible) {
      // Extract location sentences / lines for diagnostics
      const lines = text.split('\n');
      const locationLines = lines
        .filter(
          (line) =>
            line.toLowerCase().includes('location') ||
            positives.some((p) => line.toLowerCase().includes(p)),
        )
        .map((l) => l.trim())
        .slice(0, 3);

      const locationExtracted = locationLines.join(' | ') || 'Not found';
      const country = lower.includes('india') ? 'India' : 'null';
      const matchedCities = matchedPositives.filter((p) => p !== 'india' && p !== 'remote');
      const city = matchedCities.length > 0 ? matchedCities.join(', ') : 'null';
      const remoteDetected = lower.includes('remote');

      console.log(`
---------- GEO FILTER ----------
URL:
${url || 'Unknown'}

Title:
${title || 'Unknown'}

Location extracted:
${locationExtracted}

Country:
${country}

City:
${city}

Remote detected:
${remoteDetected}

Matched keywords:
${[...matchedNegatives, ...matchedPositives].join(', ') || 'None'}

Reject reason:
${reason}
-------------------------------
`);
    }

    return { eligible, reason: reason || undefined };
  }
}
export default EligibilityFilter;
