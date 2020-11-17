import { createRule, parseStyle } from '../utils/styles';

export default function radiusStyle({ radius }) {
  if (radius === true) radius = '1r';

  const { values } = parseStyle(radius);

  return createRule('border-radius', values.join(' '));
}

radiusStyle.__styleLookup = ['radius'];
