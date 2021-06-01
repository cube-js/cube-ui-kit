import { parseStyle } from '../utils/styles.js';

export function radiusStyle({ radius }) {
  if (!radius) return '';

  if (radius === true) radius = '1r';

  if (radius === 'round') radius = '9999rem';

  if (radius === 'ellipse') radius = '50%';

  const { values } = parseStyle(radius);

  return { 'border-radius': values.join(' ') };
}

radiusStyle.__lookupStyles = ['radius'];
