import {
  createRule,
  isNoValue,
} from '../utils/styles';

export default function boxShadowCombinator(styles) {
  const values = boxShadowCombinator.__styleLookup.reduce((list, style) => {
    const value = styles[style];

    if (!isNoValue(value)) {
      list.push(`var(--local-${style}-box-shadow)`);
    }

    return list;
  }, []);

  if (!values.length) return '';

  return createRule('box-shadow', values.join(', '));
}

boxShadowCombinator.__styleLookup = ['outline', 'shadow'];
