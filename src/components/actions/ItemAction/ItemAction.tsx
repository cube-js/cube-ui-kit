import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';

import { tasty } from '../../../tasty';
import { Button, CubeButtonProps } from '../Button';

export interface CubeItemActionProps extends CubeButtonProps {
  // All props from Button are inherited
}

export const ItemAction = tasty(Button, {
  type: 'neutral',
  styles: {
    height: '($size - 1x)',
    width: '($size - 1x)',
    margin: '0 (.5x - 1bw)',
  },
});
