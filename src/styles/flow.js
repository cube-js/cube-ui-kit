import { createRule } from '../utils/styles';

export default function flowStyle({ display, flow }) {
  let style;

  if (display.includes('grid')) {
    style = 'grid-auto-flow';
  } else if (display.includes('flex')) {
    style = 'flex-flow';
  }

  return style ? createRule(style, flow) : '';
}

flowStyle.__styleLookup = ['display', 'flow'];
