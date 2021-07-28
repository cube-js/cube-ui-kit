export function fontStyle({ font }) {
  if (font == null || font === false) return null;

  return {
    'font-family':
      font === 'monospace'
        ? 'var(--monospace-font)'
        : font === true
        ? 'var(--font)'
        : `${font}, var(--font)`,
  };
}

fontStyle.__lookupStyles = ['font'];
