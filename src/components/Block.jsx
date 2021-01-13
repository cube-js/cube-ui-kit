import React from 'react';
import Base from './Base';
import {
  COLOR_STYLES,
  DIMENSION_STYLES,
  POSITION_STYLES,
  BLOCK_STYLES,
} from '../styles/list';

const DEFAULT_STYLES = {
  display: 'block',
};

const STYLE_ATTRS = [
  ...COLOR_STYLES,
  ...DIMENSION_STYLES,
  ...POSITION_STYLES,
  ...BLOCK_STYLES,
  'padding',
  'border',
  'shadow',
  'radius',
];

export default function Block({ ...props }) {
  return (
    <Base defaultStyles={DEFAULT_STYLES} styleAttrs={STYLE_ATTRS} {...props} />
  );
}
