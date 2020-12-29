import React from 'react';
import Base from './Base';
import {
  COLOR_STYLES,
  DIMENSION_STYLES,
  POSITION_STYLES,
} from '../styles/list';

const DEFAULT_STYLES = {
  display: 'grid',
  flow: 'row',
};

export default function Grid({ ...props }) {
  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        ...COLOR_STYLES,
        ...POSITION_STYLES,
        ...DIMENSION_STYLES,
        'gap',
        'flow',
        'columns',
        'rows',
        'place',
        'content',
        'items',
        'border',
        'shadow',
        'radius',
        'margin',
      ]}
      {...props}
    />
  );
}
