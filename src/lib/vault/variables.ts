/**
 * Variable extraction for Prompt Vault entries.
 *
 * A "variable" is a `{token}` placeholder inside a prompt's body: e.g.
 *   "Write a caption for {product} on {platform}."
 * has variables ["product", "platform"].
 *
 * Rules:
 * - Tokens are alphanumeric + hyphen + underscore, 1..40 chars.
 * - Duplicates collapse (first occurrence wins).
 * - Whitespace inside braces trims cleanly.
 * - Empty braces `{}` and multi-word braces `{a b}` are ignored.
 */

const VAR_RE = /\{\s*([a-zA-Z][a-zA-Z0-9_-]{0,39})\s*\}/g;

export function extractVariables(content: string): string[] {
  if (!content) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of content.matchAll(VAR_RE)) {
    const token = match[1];
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

/**
 * Given a prompt body and a map of variable → value, return the body with
 * every `{variable}` replaced by its value. Missing values leave the token
 * intact so the caller can render "still needs a value" affordances.
 */
export function fillVariables(
  content: string,
  values: Record<string, string>,
): string {
  return content.replace(VAR_RE, (whole, token: string) => {
    const value = values[token];
    return value ? value : whole;
  });
}
