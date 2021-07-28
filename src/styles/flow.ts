export function flowStyle({ display, flow }) {
  let style;

  if (display.includes('grid')) {
    style = 'grid-auto-flow';
  } else if (display.includes('flex')) {
    style = 'flex-flow';
  }

  return style ? { [style]: flow } : null;
}

flowStyle.__lookupStyles = ['display', 'flow'];
