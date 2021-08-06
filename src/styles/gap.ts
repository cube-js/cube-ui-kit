import { parseStyle } from '../utils/styles';

export function gapStyle({ display, flow, gap }) {
  if (!gap) return '';

  const isGrid = display.includes('grid');
  const isFlex = display.includes('flex');
  const isWrap = flow
    ? flow.includes('wrap') && !flow.includes('nowrap')
    : false;

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

  const gapDir
    = gap && !isGrid ? (flow.includes('row') ? 'right' : 'bottom') : '';

  return gap
    ? isGrid
      ? { gap }
      : isWrap
      ? [
          {
            'margin-right': `calc(-1 * ${values[1] || values[0]})`,
            'margin-bottom': `calc(-1 * ${values[0]})`,
          },
          {
            $: '& > *',
            'margin-right': values[1] || values[0],
            'margin-bottom': values[0],
          },
        ]
      : {
          $: '& > *:not(:last-child)',
          [`margin-${gapDir}`]: gap,
        }
    : '';
}

gapStyle.__lookupStyles = ['display', 'flow', 'gap'];
