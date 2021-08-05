import { forwardRef } from 'react';
import { useSlotProps } from '../../utils/react';
import { Space, CubeSpaceProps } from '../../components/Space';

export const ButtonGroup = forwardRef((props: CubeSpaceProps, ref) => {
  props = useSlotProps(props, 'buttonGroup');

  return <Space gridArea="buttonGroup" ref={ref} {...props} />;
});
