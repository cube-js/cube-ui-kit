export function alignStyle({ align }) {
  if (typeof align !== 'string') return;

  if (!align) return;

  return {
    'align-items': align,
    'align-content': align,
  };
}

alignStyle.__lookupStyles = ['align'];
