import { describe, it, expect } from 'vitest';
import { safeParseJson } from './parser';

describe('safeParseJson', () => {
  it('parses valid JSON', () => {
    const result = safeParseJson<{ key: string }>('{"key": "value"}');
    expect(result.key).toBe('value');
  });

  it('strips markdown code fences', () => {
    const input = '```json\n{"key": "value"}\n```';
    const result = safeParseJson<{ key: string }>(input);
    expect(result.key).toBe('value');
  });

  it('strips backticks wrapping JSON', () => {
    const input = '`{"key": "value"}`';
    const result = safeParseJson<{ key: string }>(input);
    expect(result.key).toBe('value');
  });

  it('extracts JSON from preamble and postscript', () => {
    const input = 'Here is the result: {"key": "value"} Hope this helps!';
    const result = safeParseJson<{ key: string }>(input);
    expect(result.key).toBe('value');
  });

  it('handles trailing text after closing brace', () => {
    const input = '{"key": "value"} some trailing text here';
    const result = safeParseJson<{ key: string }>(input);
    expect(result.key).toBe('value');
  });

  it('handles nested objects with strings containing braces', () => {
    const input = '{"outer": {"inner": "use {this} format"}, "key": "value"}';
    const result = safeParseJson<{ outer: { inner: string }; key: string }>(input);
    expect(result.outer.inner).toBe('use {this} format');
    expect(result.key).toBe('value');
  });

  it('handles escaped quotes inside strings', () => {
    const input = '{"reason": "She said \\"hello\\" to me"}';
    const result = safeParseJson<{ reason: string }>(input);
    expect(result.reason).toBe('She said "hello" to me');
  });

  it('converts single-quoted keys to double-quoted', () => {
    const input = "{'key': 'value'}";
    const result = safeParseJson<{ key: string }>(input);
    expect(result.key).toBe('value');
  });

  it('removes trailing commas', () => {
    const input = '{"key": "value",}';
    const result = safeParseJson<{ key: string }>(input);
    expect(result.key).toBe('value');
  });

  it('quotes unquoted string values', () => {
    const input = '{"reason": CSIR CBRI.}';
    const result = safeParseJson<{ reason: string }>(input);
    expect(result.reason).toBe('CSIR CBRI.');
  });

  it('preserves numbers and booleans', () => {
    const input = '{"count": 42, "active": true, "missing": null}';
    const result = safeParseJson<{ count: number; active: boolean; missing: null }>(input);
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.missing).toBe(null);
  });

  it('handles array output', () => {
    const input = '[{"name": "a"}, {"name": "b"}]';
    const result = safeParseJson<Array<{ name: string }>>(input);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('a');
  });

  it('wraps key-value list in braces', () => {
    const input = 'key: "value", another: 123';
    const result = safeParseJson<{ key: string; another: number }>(input);
    expect(result.key).toBe('value');
    expect(result.another).toBe(123);
  });

  it('extracts JSON from text without leading braces', () => {
    const input = 'Some text here {"key": "value"} more text';
    const result = safeParseJson<{ key: string }>(input);
    expect(result.key).toBe('value');
  });
});
