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

  if (isGrid) {
    return { gap };
  }

  const isReverse = isFlex && flow.includes('reverse');
  const gapDir
    = gap && !isGrid
      ? (!isReverse
        ? (flow.includes('row') ? 'right' : 'bottom')
        : (flow.includes('row') ? 'left' : 'top'))
      : '';
  const marginFirst = isReverse ? 'margin-left' : 'margin-right';
  const marginSecond = isReverse ? 'margin-top' : 'margin-bottom';

  console.log('! reverse', isReverse);
  console.log('! wrap', isWrap);
  console.log('! dir', gapDir, marginFirst, marginSecond);
  console.log('!', display, flow, gap);

  return isWrap
    ? [
        {
          [marginFirst]: `calc(-1 * ${values[1] || values[0]})`,
          [marginSecond]: `calc(-1 * ${values[0]})`,
        },
        {
          $: '& > *',
          [marginFirst]: values[1] || values[0],
          [marginSecond]: values[0],
        },
      ]
    : {
        $: '& > *:not(:last-child)',
        [`margin-${gapDir}`]: gap,
      };
}

gapStyle.__lookupStyles = ['display', 'flow', 'gap'];
