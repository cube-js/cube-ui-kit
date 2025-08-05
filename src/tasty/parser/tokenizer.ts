export type TokenCallback = (
  token: string,
  isComma: boolean,
  precedingChar: string | null,
) => void;

export function scan(src: string, cb: TokenCallback) {
  let depth = 0;
  let inUrl = false;
  let inQuote: string | 0 = 0;
  let start = 0;
  let i = 0;

  const flush = (isComma: boolean) => {
    if (start < i) {
      const prevChar = start > 0 ? src[start - 1] : null;
      cb(src.slice(start, i), isComma, prevChar);
    } else if (isComma) {
      cb('', true, null); // empty token followed by comma => group break.
    }
    start = i + 1;
  };

  for (; i < src.length; i++) {
    const ch = src[i];

    // quote mode
    if (inQuote) {
      if (ch === inQuote && src[i - 1] !== '\\') inQuote = 0;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      continue;
    }

    // paren & url tracking (not inside quotes)
    if (ch === '(') {
      // detect url(
      if (!depth) {
        const maybe = src.slice(Math.max(0, i - 3), i + 1);
        if (maybe === 'url(') inUrl = true;
      }
      depth++;
      continue;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      if (inUrl && depth === 0) inUrl = false;
      continue;
    }

    if (inUrl) continue; // inside url(...) treat everything as part of token

    if (!depth) {
      if (ch === ',') {
        flush(true);
        continue;
      }
      if (
        ch === ' ' ||
        ch === '\n' ||
        ch === '\t' ||
        ch === '\r' ||
        ch === '\f'
      ) {
        flush(false);
        continue;
      }
    }
  }
  flush(false); // tail
}
