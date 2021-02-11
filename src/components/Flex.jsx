import React from 'react';
import Base from './Base';
import {
  BLOCK_STYLES,
  COLOR_STYLES,
  DIMENSION_STYLES,
  FLOW_STYLES,
  POSITION_STYLES,
} from '../styles/list';

const DEFAULT_STYLES = {
  display: 'flex',
  flow: 'row',
};

export default function Flex(props) {
  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        ...COLOR_STYLES,
        ...BLOCK_STYLES,
        ...POSITION_STYLES,
        ...DIMENSION_STYLES,
        ...FLOW_STYLES,
      ]}
      {...props}
    />
  );
}
