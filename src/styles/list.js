export const BASE_STYLES = ['display'];

export const POSITION_STYLES = [
  'grow',
  'shrink',
  'order',
  'column',
  'row',
  'place',
  'z',
  'margin',
];

export const BLOCK_STYLES = [
  'reset',
  'padding',
  'shadow',
  'border',
  'radius',
  'opacity',
];

export const COLOR_STYLES = ['color', 'fill'];

export const TEXT_STYLES = [
  'size',
  'textAlign',
  'textTransform',
  'fontWeight',
  'fontStyle',
  'font',
];

export const DIMENSION_STYLES = ['width', 'height', 'basis'];

export const FLOW_STYLES = [
  'flow',
  'items',
  'content',
  'gap',
  'columns',
  'rows',
];

export const CONTAINER_STYLES = [
  ...BASE_STYLES,
  ...COLOR_STYLES,
  ...DIMENSION_STYLES,
  ...POSITION_STYLES,
  ...BLOCK_STYLES,
  ...FLOW_STYLES,
];

export const OUTER_STYLES = [...POSITION_STYLES, ...DIMENSION_STYLES];
