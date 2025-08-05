import { parseStyle } from '../utils/styles';

export function gapStyle({
  display = 'block',
  flow,
  gap,
}: {
  display?: string;
  flow?: string;
  gap?: string | number | boolean;
}) {
  if (typeof gap === 'number') {
    gap = `${gap}px`;
  }

  if (!gap) {
    return;
  }

  if (gap === true) {
    gap = '1x';
  }

  const isGrid = display.includes('grid');
  const isFlex = display.includes('flex');
  const isWrap = flow
    ? flow.includes('wrap') && !flow.includes('nowrap')
    : false;

  if (!isGrid && flow == null) {
    flow = isFlex ? 'row' : 'column';
  }

  const processed = parseStyle(gap);
  const { values } = processed.groups[0] ?? ({ values: [] } as any);

  gap = values.join(' ');

  if (isGrid || isFlex) {
    return { gap };
  }

  const gapDir = flow?.includes('row') ? 'right' : 'bottom';

  return isWrap
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
      };
}

gapStyle.__lookupStyles = ['display', 'flow', 'gap'];
