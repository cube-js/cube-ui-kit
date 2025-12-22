import { parseStyle } from '../utils/styles';

import { convertColorChainToRgbChain } from './createStyle';

export function fillStyle({ fill }) {
  if (!fill) return '';

  const processed = parseStyle(fill);
  fill = processed.groups[0]?.colors[0] || fill;

  const match = fill.match(/var\(--(.+?)-color/);
  let name = '';

  if (match) {
    name = match[1];
  }

  const styles: any[] = [
    {
      'background-color': fill,
    },
  ];

  if (name) {
    styles.push({
      $: '>*',
      '--context-fill-color': fill,
      '--context-fill-color-rgb': convertColorChainToRgbChain(fill),
    });
  }

  return styles;
}

fillStyle.__lookupStyles = ['fill'];
