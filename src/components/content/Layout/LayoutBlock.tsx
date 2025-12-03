import { ForwardedRef, forwardRef, ReactNode } from 'react';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../../../tasty';

import { LayoutContextReset } from './LayoutContext';

const BlockElement = tasty({
  as: 'div',
  qa: 'LayoutBlock',
  styles: {
    display: 'block',
    padding: '($content-padding, 1x)',
    flexShrink: 0,
  },
});

export interface CubeLayoutBlockProps extends BaseProps, ContainerStyleProps {
  children?: ReactNode;
}

function LayoutBlock(
  props: CubeLayoutBlockProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { children, ...otherProps } = props;
  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  return (
    <BlockElement
      {...filterBaseProps(otherProps, { eventProps: true })}
      ref={ref}
      styles={styles}
    >
      <LayoutContextReset>{children}</LayoutContextReset>
    </BlockElement>
  );
}

const _LayoutBlock = forwardRef(LayoutBlock);

_LayoutBlock.displayName = 'Layout.Block';

export { _LayoutBlock as LayoutBlock };
