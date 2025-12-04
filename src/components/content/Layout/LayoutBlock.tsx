import { ForwardedRef, forwardRef } from 'react';

import { tasty } from '../../../tasty';

import { CubeLayoutContentProps, LayoutContent } from './LayoutContent';

const BlockElement = tasty(LayoutContent, {
  qa: 'LayoutBlock',
  styles: {
    flexShrink: 0,

    Inner: {
      display: 'block',
    },
  },
});

export interface CubeLayoutBlockProps extends CubeLayoutContentProps {}

function LayoutBlock(
  props: CubeLayoutBlockProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { children, scrollbar = 'tiny', ...otherProps } = props;

  return (
    <BlockElement {...otherProps} ref={ref} scrollbar={scrollbar}>
      {children}
    </BlockElement>
  );
}

const _LayoutBlock = forwardRef(LayoutBlock);

_LayoutBlock.displayName = 'Layout.Block';

export { _LayoutBlock as LayoutBlock };
