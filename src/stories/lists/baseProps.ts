import {
  BASE_STYLES,
  CONTAINER_STYLES,
  BLOCK_STYLES,
  COLOR_STYLES,
  FLOW_STYLES,
  OUTER_STYLES,
  DIMENSION_STYLES,
  TEXT_STYLES,
  POSITION_STYLES,
} from '../../tasty/styles/list';

const allStyles: string[] = Array.from(
  new Set([
    ...BASE_STYLES,
    ...POSITION_STYLES,
    ...CONTAINER_STYLES,
    ...BLOCK_STYLES,
    ...COLOR_STYLES,
    ...FLOW_STYLES,
    ...OUTER_STYLES,
    ...DIMENSION_STYLES,
    ...TEXT_STYLES,
    ...POSITION_STYLES,
  ]),
);

export const baseProps = [
  'qa',
  'qaVal',
  'block',
  'inline',
  'style',
  'styles',
  'css',
  'styleName',
  'hidden',
  'disabled',
  'mods',
  'breakpoints',
  'isHidden',
  'element',
  ...allStyles,
];
