/**
 * Helper to parse discovery input strings split by newlines or semicolons
 * while preserving commas inside valid URLs.
 */
export function parseDiscoveryInput(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[\n;]+/)
    .map((d) => d.trim())
    .filter(Boolean);
}
