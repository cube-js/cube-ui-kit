export const BASE_STYLES = [
  'display',
  'font',
  'preset',
  'hide',
  'opacity',
  'whiteSpace',
] as const;

export const POSITION_STYLES = [
  'gridArea',
  'order',
  'gridColumn',
  'gridRow',
  'placeSelf',
  'alignSelf',
  'justifySelf',
  'zIndex',
  'margin',
  'inset',
  'position',
] as const;

export const BLOCK_STYLES = [
  'reset',
  'padding',
  'paddingInline',
  'paddingBlock',
  'shadow',
  'border',
  'radius',
  'opacity',
  'overflow',
  'scrollbar',
  'hide',
  'outline',
  'textAlign',
] as const;

export const COLOR_STYLES = ['color', 'fill', 'fade'] as const;

export const TEXT_STYLES = [
  'textTransform',
  'fontWeight',
  'fontStyle',
] as const;

export const DIMENSION_STYLES = [
  'width',
  'height',
  'flexBasis',
  'flexGrow',
  'flexShrink',
  'flex',
] as const;

export const FLOW_STYLES = [
  'flow',
  'placeItems',
  'placeContent',
  'alignItems',
  'alignContent',
  'justifyItems',
  'justifyContent',
  'align',
  'justify',
  'gap',
  'columnGap',
  'rowGap',
  'gridColumns',
  'gridRows',
  'gridTemplate',
  'gridAreas',
] as const;

export const CONTAINER_STYLES = [
  ...BASE_STYLES,
  ...COLOR_STYLES,
  ...DIMENSION_STYLES,
  ...POSITION_STYLES,
  ...BLOCK_STYLES,
  ...FLOW_STYLES,
] as const;

export const OUTER_STYLES = [...POSITION_STYLES, ...DIMENSION_STYLES] as const;

export const INNER_STYLES = [
  ...BASE_STYLES,
  ...COLOR_STYLES,
  ...BLOCK_STYLES,
  ...FLOW_STYLES,
] as const;
