export const BASE_STYLES = [
  'display',
  'font',
  'preset',
  'hide',
  'opacity',
] as const;

export const POSITION_STYLES = [
  'gridArea',
  'flexGrow',
  'flexShrink',
  'order',
  'gridColumn',
  'gridRow',
  'placeSelf',
  'zIndex',
  'margin',
] as const;

export const BLOCK_STYLES = [
  'reset',
  'padding',
  'shadow',
  'border',
  'radius',
  'opacity',
  'overflow',
  'styledScrollbar',
  'hide',
  'outline',
  'textAlign',
] as const;

export const COLOR_STYLES = ['color', 'fill'] as const;

export const TEXT_STYLES = [
  'textTransform',
  'fontWeight',
  'fontStyle',
] as const;

export const DIMENSION_STYLES = ['width', 'height', 'flexBasis'] as const;

export const FLOW_STYLES = [
  'flow',
  'placeItems',
  'placeContent',
  'alignItems',
  'alignContent',
  'justifyItems',
  'justifyContent',
  'gap',
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
