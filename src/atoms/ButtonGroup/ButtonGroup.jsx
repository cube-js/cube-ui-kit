import React, { forwardRef } from 'react';
import { useSlotProps } from '../../utils/react';
import { Space } from '../../components/Space';

export const ButtonGroup = forwardRef((props, ref) => {
  props = useSlotProps(props, 'buttonGroup');

  return (
    <Space
      area="buttonGroup"
      ref={ref}
      {...props}
    />
  );
});
