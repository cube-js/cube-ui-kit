import { ForwardedRef, forwardRef, ReactNode, useMemo } from 'react';

import {
  BASE_STYLES,
  BaseProps,
  BaseStyleProps,
  BLOCK_STYLES,
  BlockStyleProps,
  COLOR_STYLES,
  ColorStyleProps,
  DIMENSION_STYLES,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../tasty';

const PanelElement = tasty({
  as: 'section',
  qa: 'Panel',
  styles: {
    position: {
      '': 'relative',
      'stretched | floating': 'absolute',
    },
    inset: {
      '': 'initial',
      stretched: true,
    },
    display: 'block',
    radius: {
      '': '0',
      card: '1r',
    },
    border: {
      '': '0',
      card: '1bw',
    },
    flexGrow: 1,
  },
});

const PanelInnerElement = tasty({
  styles: {
    position: 'absolute',
    display: {
      '': 'grid',
      flex: 'flex',
    },
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'auto',
    styledScrollbar: true,
    gridColumns: 'minmax(100%, 100%)',
    gridRows: {
      '': 'initial',
      stretched: 'minmax(0, 1fr)',
    },
    radius: {
      '': '0',
      card: '(1r - 1bw)',
    },
    flow: 'row',
    placeContent: 'start stretch',
  },
  styleProps: [...OUTER_STYLES, ...BASE_STYLES, ...COLOR_STYLES],
});

export interface CubePanelProps
  extends OuterStyleProps,
    BlockStyleProps,
    BaseStyleProps,
    ColorStyleProps,
    BaseProps {
  isStretched?: boolean;
  isCard?: boolean;
  isFloating?: boolean;
  styles?: Styles;
  innerStyles?: Styles;
  placeContent?: Styles['placeContent'];
  placeItems?: Styles['placeItems'];
  gridColumns?: Styles['gridTemplateColumns'];
  gridRows?: Styles['gridTemplateRows'];
  flow?: Styles['flow'];
  gap?: Styles['gap'];
  isFlex?: boolean;
  children?: ReactNode;
  extra?: ReactNode;
}

const STYLES = [
  'placeContent',
  'placeItems',
  'gridColumns',
  'gridRows',
  'flow',
  'gap',
  'padding',
  'overflow',
  'fill',
  'color',
  'preset',
] as const;

function Panel(props: CubePanelProps, ref: ForwardedRef<HTMLDivElement>) {
  let {
    qa,
    mods,
    isStretched,
    isFloating,
    isCard,
    isFlex,
    styles,
    innerStyles,
    children,
    extra,
    style,
    ...otherProps
  } = props;

  STYLES.forEach((style) => {
    if (props[style]) {
      innerStyles = { ...innerStyles, [style]: props[style] };

      delete otherProps[style];
    }
  });

  [
    ...OUTER_STYLES,
    ...BASE_STYLES,
    ...BLOCK_STYLES,
    ...COLOR_STYLES,
    ...DIMENSION_STYLES,
  ].forEach((style) => {
    if (style in props) {
      styles = { ...styles, [style]: props[style] };

      delete otherProps[style];
    }
  });

  const appliedMods = useMemo(
    () => ({
      floating: isFloating,
      stretched: isStretched,
      card: isCard,
      flex: isFlex,
      ...mods,
    }),
    [isStretched, isCard, mods],
  );

  return (
    <PanelElement
      ref={ref}
      qa={qa}
      mods={appliedMods}
      styles={styles}
      style={style}
      {...otherProps}
    >
      <PanelInnerElement mods={appliedMods} styles={innerStyles}>
        {children}
      </PanelInnerElement>
      {extra}
    </PanelElement>
  );
}

const _Panel = forwardRef(Panel);

_Panel.displayName = 'Panel';

export { _Panel as Panel };
