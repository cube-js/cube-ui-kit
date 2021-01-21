import React from 'react';
import Base from './Base';
import { BLOCK_STYLES, DIMENSION_STYLES, COLOR_STYLES } from '../styles/list';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
  radius: '1x',
  fill: '#white',
  border: true,
  padding: '3x',
};


export default function Card({ ...props }) {
  return (
    <Base
      role="region"
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        'gap',
        'flow',
        'display',
        ...BLOCK_STYLES,
        ...COLOR_STYLES,
        ...DIMENSION_STYLES,
      ]}
      {...props}
    />
  );
}
