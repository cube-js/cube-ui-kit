export function justifyStyle({ justify }) {
  if (typeof justify !== 'string') return;

  if (!justify) return;

  return {
    'justify-items': justify,
    'justify-content': justify,
  };
}

justifyStyle.__lookupStyles = ['justify'];
