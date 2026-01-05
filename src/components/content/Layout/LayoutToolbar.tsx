import { ForwardedRef, forwardRef } from 'react';

import { tasty } from '../../../tasty';

import { CubeLayoutContentProps, LayoutContent } from './LayoutContent';

const ToolbarElement = tasty(LayoutContent, {
  qa: 'Toolbar',
  role: 'toolbar',
  styles: {
    container: 'none',
    height: 'min 5x',
    flexShrink: 0,
    flexGrow: 0,

    Inner: {
      display: 'flex',
      flow: 'row nowrap',
      placeContent: 'center space-between',
      placeItems: 'center stretch',
      gap: '1x',
      padding: '0 ($content-padding, 1x)',
    },
  },
});

export interface CubeLayoutToolbarProps extends CubeLayoutContentProps {}

function LayoutToolbar(
  props: CubeLayoutToolbarProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { children, scrollbar = 'tiny', ...otherProps } = props;

  return (
    <ToolbarElement {...otherProps} ref={ref} scrollbar={scrollbar}>
      {children}
    </ToolbarElement>
  );
}

const _LayoutToolbar = forwardRef(LayoutToolbar);

_LayoutToolbar.displayName = 'Layout.Toolbar';

export { _LayoutToolbar as LayoutToolbar };
