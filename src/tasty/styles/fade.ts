import { parseStyle, DIRECTIONS, filterMods } from '../utils/styles';

export function fadeStyle({ fade }) {
  if (!fade) return '';

  let { values, mods } = parseStyle(fade);

  let directions = filterMods(mods, DIRECTIONS);

  if (!values.length) {
    values = ['var(--fade-width)'];
  }

  if (!directions.length) {
    directions = ['right'];
  }

  const size = values[0];
  const direction = directions[0];

  const gradientDirection = {
    right: 'to left',
    left: 'to right',
    top: 'to bottom',
    bottom: 'to top',
  }[direction];

  return {
    maskImage: `linear-gradient(${gradientDirection}, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) ${size})`,
  };
}

fadeStyle.__lookupStyles = ['fade'];
