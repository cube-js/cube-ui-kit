import { tasty } from '@tenphi/tasty';
import { forwardRef } from 'react';

import { useSlotProps } from '../../../utils/react';
import { CubeSpaceProps, Space } from '../../layout/Space';

const ButtonGroupElement = tasty(Space, {
  qa: 'ButtonGroup',
  styles: {
    gridArea: 'buttonGroup',
  },
});

export const ButtonGroup = forwardRef(function ButtonGroup(
  props: CubeSpaceProps,
  ref,
) {
  return (
    <ButtonGroupElement ref={ref} {...useSlotProps(props, 'buttonGroup')} />
  );
});
