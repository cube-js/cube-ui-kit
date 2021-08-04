import { forwardRef } from 'react';
import { useSlotProps } from '../../utils/react';
import { Space, SpaceProps } from '../../components/Space';

export const ButtonGroup = forwardRef((props: SpaceProps, ref) => {
  props = useSlotProps(props, 'buttonGroup');

  return <Space gridArea="buttonGroup" ref={ref} {...props} />;
});
