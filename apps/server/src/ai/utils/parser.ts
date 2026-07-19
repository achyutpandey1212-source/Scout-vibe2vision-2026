export function safeParseJson<T = any>(text: string): T {
  let cleaned = text.trim();

  // Strip Markdown JSON code block wrappers if present
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      cleaned = match[1].trim();
    } else {
      cleaned = cleaned.replace(/^```(?:json)?\n?/i, '');
      cleaned = cleaned.replace(/\n?```$/i, '');
    }
  }

  // Strip single backticks wrapping the JSON (common with some models)
  if (cleaned.startsWith('`')) {
    cleaned = cleaned
      .replace(/^`+(?:json)?\s*/i, '')
      .replace(/\s*`+$/i, '')
      .trim();
  }

  // Tier 1: Immediate Parse
  try {
    return JSON.parse(cleaned) as T;
  } catch (initialErr) {
    // Fail-soft: proceed to Tier 2 (lightweight repair)
  }

  // Tier 2: Extract First JSON Structure (handles preamble/postscript or trailing garbage)
  const extracted = extractFirstJsonStructure(cleaned);
  if (extracted !== null) {
    try {
      return JSON.parse(extracted) as T;
    } catch (extractedErr) {
      cleaned = extracted; // If it failed, use the extracted block for further fuzzy repairs
    }
  } else if (!cleaned.startsWith('{') && !cleaned.startsWith('[') && cleaned.includes(':')) {
    cleaned = '{' + cleaned + '}';
    try {
      return JSON.parse(cleaned) as T;
    } catch (wrapErr) {
      // Proceed to Tier 3 fuzzy cleanup
    }
  }

  // Tier 3: Fuzzy JSON Repair
  // 3a. Replace backticks used as quotes for keys/values
  cleaned = cleaned.replace(/`([^`\n]+)`/g, '"$1"');

  // 3b. Convert single quotes around keys/values to double quotes
  cleaned = cleaned.replace(/'([a-zA-Z0-9_]+)'\s*:/g, '"$1":');
  cleaned = cleaned.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
  cleaned = cleaned.replace(/\[\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, '["$1"');
  cleaned = cleaned.replace(/,\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ', "$1"');

  // 3c. Quote unquoted property names (e.g. {key: "value"} → {"key": "value"})
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

  // 3d. Quote unquoted string values (e.g. "reason": CSIR CBRI. → "reason": "CSIR CBRI.")
  cleaned = cleaned.replace(/:\s*(true|false|null|[a-zA-Z_][a-zA-Z0-9_\s.]*)/g, (match, value) => {
    if (value === 'true' || value === 'false' || value === 'null') return match;
    if (value.startsWith('"') || value.startsWith("'")) return match;
    return ': "' + value + '"';
  });

  // 3e. Remove trailing commas in JSON object/array structures (invalid in strict JSON)
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  return JSON.parse(cleaned) as T;
}

function extractFirstJsonStructure(text: string): string | null {
  const openers = ['{', '['];
  const closers: Record<string, string> = { '{': '}', '[': ']' };

  for (let i = 0; i < text.length; i++) {
    if (!openers.includes(text[i])) continue;

    const opener = text[i];
    const closer = closers[opener];
    let depth = 1;
    let inString = false;
    let escapeNext = false;

    for (let j = i + 1; j < text.length; j++) {
      const char = text[j];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === opener) {
        depth++;
      } else if (char === closer) {
        depth--;
        if (depth === 0) {
          return text.substring(i, j + 1);
        }
      }
    }
  }

  return null;
}
