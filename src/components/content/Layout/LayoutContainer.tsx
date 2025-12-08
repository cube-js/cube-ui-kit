import { ForwardedRef, forwardRef, ReactNode, useMemo } from 'react';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  mergeStyles,
  Mods,
  Styles,
  tasty,
} from '../../../tasty';

import { LayoutContextReset, useLayoutContext } from './LayoutContext';

const ContainerElement = tasty({
  as: 'div',
  qa: 'LayoutContainer',
  styles: {
    display: 'flex',
    flow: 'column',
    flexGrow: 1,
    flexShrink: 1,
    placeItems: 'center start',
    placeContent: 'stretch',
    overflow: 'auto',
    scrollbar: 'thin',
    padding: '$content-padding',
    placeSelf: 'stretch',
    width: '100%',
    border: {
      '': 0,
      'bordered & !:last-child': 'bottom',
    },

    Inner: {
      $: '>',
      placeSelf: 'center',
      display: 'flex',
      flow: 'column',
      width: '40x 100% 120x',
      boxSizing: 'border-box',
    },
  },
});

export interface CubeLayoutContainerProps
  extends BaseProps,
    ContainerStyleProps {
  children?: ReactNode;
  /** Custom styles for container and inner elements */
  styles?: Styles;
  /** Custom styles for the inner element */
  innerStyles?: Styles;
  /** Additional modifiers to apply */
  mods?: Mods;
}

function LayoutContainer(
  props: CubeLayoutContainerProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    styles,
    innerStyles: innerStylesProp,
    mods: externalMods,
    ...otherProps
  } = props;
  const layoutContext = useLayoutContext();
  const innerStyles = extractStyles(
    otherProps,
    CONTAINER_STYLES,
    innerStylesProp,
  );

  const hasInnerStyles = Object.keys(innerStyles).length > 0;

  const finalStyles = useMemo(() => {
    return mergeStyles(styles, hasInnerStyles ? { Inner: innerStyles } : null);
  }, [styles, hasInnerStyles, innerStyles]);

  const mods = useMemo(
    () => ({
      ...externalMods,
      bordered: layoutContext?.isVertical,
    }),
    [externalMods, layoutContext?.isVertical],
  );

  return (
    <ContainerElement
      ref={ref}
      {...filterBaseProps(otherProps, { eventProps: true })}
      mods={mods}
      styles={finalStyles}
    >
      <div data-element="Inner">
        <LayoutContextReset>{children}</LayoutContextReset>
      </div>
    </ContainerElement>
  );
}

const _LayoutContainer = forwardRef(LayoutContainer);

_LayoutContainer.displayName = 'Layout.Container';

export { _LayoutContainer as LayoutContainer };
