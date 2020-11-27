import { createRule, parseStyle } from '../utils/styles';

export default function gapStyle({ display, flow, gap }) {
  if (!gap) return '';

  const isGrid = display.includes('grid');
  const isFlex = display.includes('flex');

  if (!isGrid && flow == null) {
    flow = isFlex ? 'row' : 'column';
  }

  if (typeof gap === 'number') {
    gap = `${gap}x`;
  }

  if (!gap) {
    return;
  }

  if (gap === true) {
    gap = '2x';
  }

  const { values } = parseStyle(gap);

  gap = values.join(' ');

  const gapDir =
    gap && !isGrid ? (flow.includes('row') ? 'right' : 'bottom') : '';

  return gap
    ? isGrid
      ? createRule('grid-gap', gap)
      : createRule(`margin-${gapDir}`, gap, '& > *:not(:last-child)')
    : '';
}

gapStyle.__styleLookup = ['display', 'flow', 'gap'];
