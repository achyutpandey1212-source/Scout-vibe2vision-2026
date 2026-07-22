/**
 * Helper to parse discovery input strings split by commas, newlines, or semicolons.
 * Trims whitespace, removes empty entries, removes duplicates, and preserves ordering.
 */
export function parseDiscoveryInput(input: string | string[] | null | undefined): string[] {
  if (!input) return [];

  const rawEntries: string[] = Array.isArray(input) ? input : [input];
  const parsedUrls: string[] = [];

  for (const entry of rawEntries) {
    if (!entry || typeof entry !== 'string') continue;

    // Split on newlines, semicolons, or commas followed by space or URL protocol
    const tokens = entry.split(/[\n;]+|,\s*(?=https?:\/\/|www\.)|,\s*\n+/i);
    for (const token of tokens) {
      // Split remaining comma-space delimited items if any
      const subTokens = token.split(/,\s+/);
      for (const sub of subTokens) {
        const trimmed = sub.trim();
        if (trimmed && trimmed.length > 0) {
          parsedUrls.push(trimmed);
        }
      }
    }
  }

  // Remove duplicates while preserving order
  return Array.from(new Set(parsedUrls));
}
