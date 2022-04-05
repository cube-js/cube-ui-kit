import { forwardRef } from 'react';
import { Button, CubeButtonProps } from '../../actions';
import { FocusableRef } from '@react-types/shared';

export const Link = forwardRef(
  (props: CubeButtonProps, ref: FocusableRef<HTMLElement>) => {
    return <Button type="link" {...props} ref={ref} />;
  },
);
