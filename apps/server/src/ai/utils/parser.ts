export function safeParseJson<T = any>(text: string): T {
  let cleaned = text.trim();

  // Strip Markdown JSON code block wrappers if present
  if (cleaned.includes('```')) {
    // Try regex matching to extract content from markdown fences
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      cleaned = match[1].trim();
    } else {
      // Manual strip fallback
      cleaned = cleaned.replace(/^```(?:json)?\n?/i, '');
      cleaned = cleaned.replace(/\n?```$/i, '');
    }
  }

  cleaned = cleaned.trim();

  // If it still doesn't look like JSON, try locating the first '{' or '[' and last matching brace/bracket
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  return JSON.parse(cleaned) as T;
}
