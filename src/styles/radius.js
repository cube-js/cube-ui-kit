import { createRule, parseStyle } from '../utils/styles';

export default function radiusStyle({ radius }) {
  if (!radius) return '';

  if (radius === true) radius = '1r';

  if (radius === 'round') radius = '9999rem';

  if (radius === 'ellipse') radius = '50%';

  const { values } = parseStyle(radius);

  return createRule('border-radius', values.join(' '));
}

radiusStyle.__styleLookup = ['radius'];
