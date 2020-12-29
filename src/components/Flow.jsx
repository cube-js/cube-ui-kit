import React from 'react';
import Base from './Base';
import { COLOR_STYLES, DIMENSION_STYLES } from '../styles/list';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
};

export default React.forwardRef(function Flow({ ...props }, ref) {
  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        ...COLOR_STYLES,
        ...DIMENSION_STYLES,
        'gap',
        'place',
        'border',
        'shadow',
        'radius',
      ]}
      {...props}
      ref={ref}
    />
  );
});
