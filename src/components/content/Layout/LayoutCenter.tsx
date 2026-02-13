import { ForwardedRef, forwardRef } from 'react';

import { tasty } from '../../../tasty';

import { CubeLayoutContainerProps, LayoutContainer } from './LayoutContainer';

const CenterElement = tasty(LayoutContainer, {
  qa: 'LayoutCenter',
  styles: {
    placeItems: 'stretch',
    placeContent: 'stretch',

    Inner: {
      textAlign: 'center',
      placeItems: 'center',
      placeContent: 'center',
    },
  },
});

export interface CubeLayoutCenterProps extends CubeLayoutContainerProps {}

function LayoutCenter(
  props: CubeLayoutCenterProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { children, ...otherProps } = props;

  return (
    <CenterElement {...otherProps} ref={ref}>
      {children}
    </CenterElement>
  );
}

const _LayoutCenter = forwardRef(LayoutCenter);

_LayoutCenter.displayName = 'Layout.Center';

export { _LayoutCenter as LayoutCenter };
