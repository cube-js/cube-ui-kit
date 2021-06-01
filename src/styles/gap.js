import { parseStyle } from '../utils/styles.js';

export function gapStyle({ display, flow, gap }) {
  if (!gap) return '';

  const isGrid = display.includes('grid');
  const isFlex = display.includes('flex');

  if (!isGrid && flow == null) {
    flow = isFlex ? 'row' : 'column';
  }

  if (typeof gap === 'number') {
    gap = `${gap}px`;
  }

  if (!gap) {
    return;
  }

  if (gap === true) {
    gap = '1.5x';
  }

  const { values } = parseStyle(gap);

  gap = values.join(' ');

  const gapDir =
    gap && !isGrid ? (flow.includes('row') ? 'right' : 'bottom') : '';

  return gap
    ? isGrid
      ? { gap }
      : {
          $: '& > *:not(:last-child)',
          [`margin-${gapDir}`]: gap,
        }
    : '';
}

gapStyle.__lookupStyles = ['display', 'flow', 'gap'];
