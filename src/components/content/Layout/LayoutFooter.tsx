import { ForwardedRef, forwardRef, ReactNode, useMemo } from 'react';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  tasty,
} from '../../../tasty';

import { LayoutContextReset } from './LayoutContext';

const FooterElement = tasty({
  as: 'footer',
  qa: 'LayoutFooter',
  role: 'contentinfo',
  styles: {
    display: 'flex',
    flow: {
      '': 'row nowrap',
      inverted: 'row-reverse nowrap',
    },
    placeContent: 'center space-between',
    placeItems: 'center stretch',
    gap: '1x',
    padding: '($content-padding, 1x)',
    border: 'top',
    width: '100%',
    height: 'min 5x',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
});

export interface CubeLayoutFooterProps extends BaseProps, ContainerStyleProps {
  /** Inverts the order of children (primary action on right) */
  invertOrder?: boolean;
  children?: ReactNode;
}

function LayoutFooter(
  props: CubeLayoutFooterProps,
  ref: ForwardedRef<HTMLElement>,
) {
  const { children, invertOrder, mods, ...otherProps } = props;
  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  const finalMods = useMemo(
    () => ({
      inverted: invertOrder,
      ...mods,
    }),
    [invertOrder, mods],
  );

  return (
    <FooterElement
      ref={ref}
      {...filterBaseProps(otherProps, { eventProps: true })}
      mods={finalMods}
      styles={styles}
    >
      <LayoutContextReset>{children}</LayoutContextReset>
    </FooterElement>
  );
}

const _LayoutFooter = forwardRef(LayoutFooter);

_LayoutFooter.displayName = 'Layout.Footer';

export { _LayoutFooter as LayoutFooter };
