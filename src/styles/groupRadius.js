import { hasNegativeMod, parseStyle } from '../utils/styles';

const MAP = {
  row: ['* 0 0 *', '0 * * 0'],
  column: ['* * 0 0', '0 0 * *'],
};

export function groupRadiusAttr({ groupRadius, flow }) {
  if (!groupRadius) return '';

  if (groupRadius === true) groupRadius = '1r';

  const { values, mods } = parseStyle(groupRadius);

  flow = flow || 'row';

  const reverse = mods.includes('reverse');
  let value = values[0];

  if (hasNegativeMod(mods)) {
    value = '0';
  }

  if (!value) {
    if (mods.includes('round')) {
      value = '9999rem';
    } else if (mods.includes('ellipse')) {
      value = '50%';
    } else {
      value = 'var(--radius)';
    }
  }

  const startValue = MAP[flow][reverse ? 1 : 0].replace(/\*/g, value);
  const endValue = MAP[flow][reverse ? 0 : 1].replace(/\*/g, value);

  return [
    {
      $: '>:first-child:not(:last-child)',
      'border-radius': startValue,
      '--local-radius': startValue,
    },
    {
      $: '>:last-child:not(:first-child)',
      'border-radius': endValue,
      '--local-radius': endValue,
    },
    {
      $: '>:last-child:first-child',
      'border-radius': value,
      '--local-radius': value,
    },
    {
      $: '>:not(:last-child):not(:first-child)',
      'border-radius': '0',
      '--local-radius': '0',
    },
  ];
}

groupRadiusAttr.__lookupStyles = ['groupRadius', 'flow'];
