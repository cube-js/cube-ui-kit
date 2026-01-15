import { DIRECTIONS, filterMods, parseStyle } from '../utils/styles';

const DIRECTION_MAP = {
  right: 'to left',
  left: 'to right',
  top: 'to bottom',
  bottom: 'to top',
};

export function fadeStyle({ fade }) {
  if (!fade) return;

  const processed = parseStyle(fade);
  let { values, mods } =
    processed.groups[0] ?? ({ values: [], mods: [] } as any);

  let directions = filterMods(mods, DIRECTIONS);

  if (!values.length) {
    values = ['var(--fade-width)'];
  }

  if (!directions.length) {
    directions = ['top', 'right', 'bottom', 'left'];
  }

  return {
    mask: directions
      .map((direction: (typeof DIRECTIONS)[number], index: number) => {
        const size = values[index] || values[index % 2] || values[0];

        return `linear-gradient(${DIRECTION_MAP[direction]}, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 1) ${size})`;
      })
      .join(', '),
    'mask-composite': 'intersect',
  };
}

fadeStyle.__lookupStyles = ['fade'];
