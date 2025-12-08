import { ForwardedRef, forwardRef, useMemo } from 'react';

import { tasty } from '../../../tasty';

import { CubeLayoutContentProps, LayoutContent } from './LayoutContent';

const FooterElement = tasty(LayoutContent, {
  as: 'footer',
  qa: 'LayoutFooter',
  role: 'contentinfo',
  styles: {
    border: {
      '': 0,
      'bordered & !:last-child': 'bottom',
    },
    height: 'min 5x',
    flexShrink: 0,
    flexGrow: 0,
    whiteSpace: 'nowrap',

    Inner: {
      display: 'flex',
      flow: {
        '': 'row nowrap',
        inverted: 'row-reverse nowrap',
      },
      placeContent: 'center space-between',
      placeItems: 'center stretch',
      gap: '1x',
    },
  },
});

export interface CubeLayoutFooterProps extends CubeLayoutContentProps {
  /** Inverts the order of children (primary action on right) */
  invertOrder?: boolean;
}

function LayoutFooter(
  props: CubeLayoutFooterProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    invertOrder,
    scrollbar = 'tiny',
    mods,
    ...otherProps
  } = props;

  const finalMods = useMemo(
    () => ({
      inverted: invertOrder,
      ...mods,
    }),
    [invertOrder, mods],
  );

  return (
    <FooterElement
      {...otherProps}
      ref={ref}
      mods={finalMods}
      scrollbar={scrollbar}
    >
      {children}
    </FooterElement>
  );
}

const _LayoutFooter = forwardRef(LayoutFooter);

_LayoutFooter.displayName = 'Layout.Footer';

export { _LayoutFooter as LayoutFooter };
