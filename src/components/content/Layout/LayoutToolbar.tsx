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

const ToolbarElement = tasty({
  as: 'div',
  qa: 'Toolbar',
  role: 'toolbar',
  styles: {
    display: 'flex',
    flow: 'row nowrap',
    placeContent: 'center space-between',
    placeItems: 'center stretch',
    gap: '1x',
    padding: '($content-padding, 1x)',
    width: '100%',
    height: 'min 5x',
    overflow: 'hidden',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
});

export interface CubeLayoutToolbarProps extends BaseProps, ContainerStyleProps {
  children?: ReactNode;
}

function LayoutToolbar(
  props: CubeLayoutToolbarProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { children, ...otherProps } = props;
  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  return (
    <ToolbarElement
      ref={ref}
      {...filterBaseProps(otherProps, { eventProps: true })}
      styles={styles}
    >
      <LayoutContextReset>{children}</LayoutContextReset>
    </ToolbarElement>
  );
}

const _LayoutToolbar = forwardRef(LayoutToolbar);

_LayoutToolbar.displayName = 'Layout.Toolbar';

export { _LayoutToolbar as LayoutToolbar };
