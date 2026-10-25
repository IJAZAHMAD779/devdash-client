/**
 * Decodes HTML entities (numeric decimal, numeric hex, and common named entities)
 * in a single pass without DOM or innerHTML dependencies. Safe for SSR and client.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

export function decodeEntities(input: string | null | undefined): string {
  if (!input) return "";

  // Single-pass replacement to avoid double-decoding (e.g. &amp;#39;)
  return input.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (match, entity) => {
    // Numeric hexadecimal: &#x27; or &#X27;
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const hex = entity.slice(2);
      const codePoint = parseInt(hex, 16);
      if (
        !Number.isNaN(codePoint) &&
        codePoint >= 0 &&
        codePoint <= 0x10ffff &&
        !(codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        try {
          return String.fromCodePoint(codePoint);
        } catch {
          return match;
        }
      }
      return match;
    }

    // Numeric decimal: &#39; or &#039;
    if (entity.startsWith("#")) {
      const dec = entity.slice(1);
      const codePoint = parseInt(dec, 10);
      if (
        !Number.isNaN(codePoint) &&
        codePoint >= 0 &&
        codePoint <= 0x10ffff &&
        !(codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        try {
          return String.fromCodePoint(codePoint);
        } catch {
          return match;
        }
      }
      return match;
    }

    // Named entity
    const lower = entity.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, lower)) {
      return NAMED_ENTITIES[lower];
    }

    return match;
  });
}
