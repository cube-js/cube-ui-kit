import { ForwardedRef, forwardRef } from 'react';

import { tasty } from '../../../tasty';

import { CubeLayoutContentProps, LayoutContent } from './LayoutContent';

const FlexElement = tasty(LayoutContent, {
  qa: 'LayoutFlex',
  styles: {
    flexShrink: 0,
    flexGrow: 0,

    Inner: {
      display: 'flex',
    },
  },
});

export interface CubeLayoutFlexProps extends CubeLayoutContentProps {}

function LayoutFlex(
  props: CubeLayoutFlexProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { children, scrollbar = 'tiny', ...otherProps } = props;

  return (
    <FlexElement {...otherProps} ref={ref} scrollbar={scrollbar}>
      {children}
    </FlexElement>
  );
}

const _LayoutFlex = forwardRef(LayoutFlex);

_LayoutFlex.displayName = 'Layout.Flex';

export { _LayoutFlex as LayoutFlex };
