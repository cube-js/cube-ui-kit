import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';

import { tasty } from '../../../tasty';
import { Button, CubeButtonProps } from '../Button';
import { useItemActionContext } from '../ItemActionContext';

export interface CubeItemActionProps extends CubeButtonProps {
  // All props from Button are inherited
}

const StyledButton = tasty(Button, {
  styles: {
    border: 0,
    height: '($size - 1x)',
    width: '($size - 1x)',
    margin: {
      '': '0 1bw 0 1bw',
      ':last-child & !:first-child': '0 (.5x - 1bw) 0 0',
      '!:last-child & :first-child': '0 0 0 (.5x - 1bw)',
      ':last-child & :first-child': '0 (.5x - 1bw)',
      context: '0',
    },
  },
});

export const ItemAction = forwardRef(function ItemAction(
  props: CubeItemActionProps,
  ref: FocusableRef<HTMLElement>,
) {
  const { type: contextType } = useItemActionContext();
  const { type = contextType ?? 'neutral', ...rest } = props;

  return (
    <StyledButton
      tabIndex={contextType ? -1 : undefined}
      {...rest}
      ref={ref}
      mods={{ context: !!contextType }}
      type={type}
    />
  );
});
