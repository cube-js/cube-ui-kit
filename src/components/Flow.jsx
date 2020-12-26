import React from 'react';
import Base from './Base';

const DEFAULT_STYLES = {
  display: 'block',
  flow: 'column',
};

export default React.forwardRef(function Flow({ ...props }, ref) {
  return (
    <Base
      defaultStyles={DEFAULT_STYLES}
      styleAttrs={[
        'fill',
        'color',
        'gap',
        'height',
        'width',
        'place',
        'padding',
        'border',
        'shadow',
        'radius',
      ]}
      {...props}
      ref={ref}
    />
  );
});
