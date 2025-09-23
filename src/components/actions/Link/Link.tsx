import { FocusableRef } from '@react-types/shared';
import { forwardRef } from 'react';

import { Button, CubeButtonProps } from '../../actions';

export const Link = forwardRef(function Link(
  props: CubeButtonProps,
  ref: FocusableRef<HTMLElement>,
) {
  return <Button type="link" {...props} ref={ref} />;
});
