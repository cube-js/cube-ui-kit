export function fontStyle({ font }) {
  if (font == null || font === false) return null;

  const fontFamily
    = font === 'monospace'
      ? 'var(--monospace-font)'
      : font === true
      ? 'var(--font)'
      : `${font}, var(--font)`;

  return {
    'font-family': fontFamily,
    '--font-family': fontFamily,
  };
}

fontStyle.__lookupStyles = ['font'];
