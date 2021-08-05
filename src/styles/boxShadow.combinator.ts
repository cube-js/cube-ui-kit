import { isNoValue } from '../utils/styles';

export function boxShadowCombinator(styles) {
  const values = boxShadowCombinator.__lookupStyles.reduce(
    (list: string[], style) => {
      const value = styles[style];

      if (!isNoValue(value)) {
        list.push(`var(--local-${style}-box-shadow)`);
      }

      return list;
    },
    [],
  );

  if (!values.length) return '';

  return { 'box-shadow': values.join(', ') };
}

boxShadowCombinator.__lookupStyles = ['outline', 'shadow'];
