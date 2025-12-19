import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useMemo,
  useRef,
} from 'react';
import { useHover } from 'react-aria';

import {
  BaseProps,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  INNER_STYLES,
  mergeStyles,
  Mods,
  OUTER_STYLES,
  tasty,
} from '../../../tasty';
import { useCombinedRefs } from '../../../utils/react';

import { useTinyScrollbar } from './hooks/useTinyScrollbar';
import { LayoutContextReset } from './LayoutContext';

const ContentElement = tasty({
  as: 'div',
  qa: 'LayoutContent',
  styles: {
    position: 'relative',
    display: 'grid',
    gridColumns: '1sf',
    gridRows: '1sf',
    placeContent: 'stretch',
    placeItems: 'stretch',
    placeSelf: 'stretch',
    flexGrow: 1,
    flexShrink: 1,
    height: 'min 0',
    overflow: 'hidden',
    boxSizing: 'content-box',
    border: {
      '': 0,
      '!:last-child': '($layout-border-size, 1bw) solid #border bottom',
    },

    Inner: {
      $: '>',
      display: 'flex',
      flow: 'column',
      padding: '($content-padding, 1x)',
      overflow: {
        '': 'auto',
        'scrollbar=none': 'clip',
      },
      placeSelf: 'stretch',
      scrollbar: {
        '': 'thin',
        'scrollbar=tiny | scrollbar=none': 'none',
      },

      '$layout-border-size': '0',
    },

    // Custom scrollbar handles (when scrollbar="tiny")
    ScrollbarV: {
      position: 'absolute',
      right: '1px',
      top: '$scrollbar-v-top',
      width: '1ow',
      height: '$scrollbar-v-height',
      radius: 'round',
      fill: '#dark.35',
      opacity: {
        '': 0,
        '(focused | scrolling) & scrollbar=tiny': 1,
      },
      transition: 'opacity 0.15s',
      pointerEvents: 'none',
    },

    ScrollbarH: {
      position: 'absolute',
      bottom: '1px',
      left: '$scrollbar-h-left',
      height: '1ow',
      width: '$scrollbar-h-width',
      radius: 'round',
      fill: '#dark.35',
      opacity: {
        '': 0,
        '(focused | scrolling) & scrollbar=tiny': 1,
      },
      transition: 'opacity 0.15s',
      pointerEvents: 'none',
    },
  },
});

export type ScrollbarType = 'default' | 'thin' | 'tiny' | 'none';

export interface CubeLayoutContentProps extends BaseProps, ContainerStyleProps {
  /** Scrollbar style: 'default' | 'thin' | 'tiny' | 'none' */
  scrollbar?: ScrollbarType;
  children?: ReactNode;
  /** Additional modifiers to apply */
  mods?: Mods;
  /** Ref for the inner content element */
  innerRef?: ForwardedRef<HTMLDivElement>;
  /** Props to spread on the Inner sub-element */
  innerProps?: HTMLAttributes<HTMLDivElement>;
}

function LayoutContent(
  props: CubeLayoutContentProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    scrollbar = 'thin',
    styles,
    mods: externalMods,
    innerRef: innerRefProp,
    innerProps,
    ...otherProps
  } = props;
  const outerStyles = extractStyles(otherProps, OUTER_STYLES);
  const innerStyles = extractStyles(otherProps, INNER_STYLES);
  const internalInnerRef = useRef<HTMLDivElement>(null);
  const combinedInnerRef = useCombinedRefs(innerRefProp, internalInnerRef);
  const combinedRef = useCombinedRefs(ref);
  const isTinyScrollbar = scrollbar === 'tiny';
  const { hoverProps, isHovered } = useHover({});

  const {
    handleVStyle,
    handleHStyle,
    hasOverflowY,
    hasOverflowX,
    isScrolling,
  } = useTinyScrollbar(internalInnerRef, isTinyScrollbar);

  const scrollbarStyle = useMemo(() => {
    if (!isTinyScrollbar) return {};

    return {
      ...handleVStyle,
      ...handleHStyle,
    };
  }, [isTinyScrollbar, handleVStyle, handleHStyle]);

  const mods = useMemo(
    () => ({
      ...externalMods,
      scrollbar,
      hovered: isHovered,
      scrolling: isScrolling,
    }),
    [externalMods, scrollbar, isHovered, isScrolling],
  );

  // Merge styles: outer styles to root, inner styles to Inner element
  const finalStyles = useMemo(() => {
    return mergeStyles(
      styles,
      outerStyles,
      innerStyles ? { Inner: innerStyles } : null,
    );
  }, [styles, outerStyles, innerStyles]);

  return (
    <ContentElement
      ref={combinedRef}
      {...filterBaseProps(otherProps, { eventProps: true })}
      {...hoverProps}
      mods={mods}
      styles={finalStyles}
      style={scrollbarStyle}
    >
      <div ref={combinedInnerRef} data-element="Inner" {...innerProps}>
        <LayoutContextReset>{children}</LayoutContextReset>
      </div>
      {isTinyScrollbar && hasOverflowY && <div data-element="ScrollbarV" />}
      {isTinyScrollbar && hasOverflowX && <div data-element="ScrollbarH" />}
    </ContentElement>
  );
}

const _LayoutContent = forwardRef(LayoutContent);

_LayoutContent.displayName = 'Layout.Content';

export { _LayoutContent as LayoutContent };
