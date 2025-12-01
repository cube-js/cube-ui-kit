import { ForwardedRef, forwardRef, ReactNode, useMemo, useRef } from 'react';
import { useHover } from 'react-aria';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
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
    display: 'block',
    flexGrow: 1,
    minHeight: 0,
    overflow: 'hidden',
    boxSizing: 'border-box',

    Inner: {
      position: 'absolute',
      inset: 0,
      display: 'block',
      overflow: 'auto',
      scrollbar: {
        '': 'thin',
        'scrollbar=tiny | scrollbar=none': 'none',
      },
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
        '(hovered | focused) & scrollbar=tiny': 1,
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
        '(hovered | focused) & scrollbar=tiny': 1,
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
}

function LayoutContent(
  props: CubeLayoutContentProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { children, scrollbar = 'thin', ...otherProps } = props;
  const extractedStyles = extractStyles(otherProps, CONTAINER_STYLES);
  const innerRef = useRef<HTMLDivElement>(null);
  const combinedRef = useCombinedRefs(ref);
  const isTinyScrollbar = scrollbar === 'tiny';
  const { hoverProps, isHovered } = useHover({});

  const { handleVStyle, handleHStyle, hasOverflowY, hasOverflowX } =
    useTinyScrollbar(innerRef, isTinyScrollbar);

  const scrollbarStyle = useMemo(() => {
    if (!isTinyScrollbar) return {};

    return {
      ...handleVStyle,
      ...handleHStyle,
    };
  }, [isTinyScrollbar, handleVStyle, handleHStyle]);

  const mods = useMemo(
    () => ({
      scrollbar,
      hovered: isHovered,
    }),
    [scrollbar, isHovered],
  );

  // Apply container styles (like padding) to the Inner element
  const finalStyles = useMemo(() => {
    return {
      Inner: extractedStyles,
    };
  }, [extractedStyles]);

  return (
    <ContentElement
      ref={combinedRef}
      {...filterBaseProps(otherProps, { eventProps: true })}
      {...hoverProps}
      mods={mods}
      styles={finalStyles}
      style={scrollbarStyle}
    >
      <div ref={innerRef} data-element="Inner">
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
