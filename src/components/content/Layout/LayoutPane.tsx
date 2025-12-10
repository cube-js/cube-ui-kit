import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFocusRing, useHover, useMove } from 'react-aria';

import { useDebouncedValue } from '../../../_internal/hooks';
import {
  BaseProps,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  INNER_STYLES,
  mergeStyles,
  OUTER_STYLES,
  Styles,
  tasty,
} from '../../../tasty';
import { mergeProps, useCombinedRefs } from '../../../utils/react';

import { useTinyScrollbar } from './hooks/useTinyScrollbar';
import { ScrollbarType } from './LayoutContent';
import { LayoutContextReset } from './LayoutContext';
import { clampSize } from './utils';

// Handler dimensions
const HANDLER_WIDTH = 9; // Interactive area
const HANDLER_RESERVED = 5; // Space reserved in Inner padding

const PaneElement = tasty({
  as: 'div',
  qa: 'LayoutPane',
  styles: {
    position: 'relative',
    display: 'grid',
    gridColumns: '1sf',
    gridRows: '1sf',
    placeContent: 'stretch',
    placeItems: 'stretch',
    placeSelf: 'stretch',
    flexShrink: 0,
    flexGrow: 0,
    // Size is set via CSS custom property for performance during drag
    width: {
      '': 'auto',
      'edge=right': '2x $pane-size $pane-size',
    },
    height: {
      '': '2x $pane-size $pane-size',
      'edge=right': 'auto',
    },
    boxSizing: 'content-box',

    Inner: {
      $: '>',
      display: 'flex',
      flow: 'column',
      padding: '($content-padding, 1x)',
      // Reserve space for handler on resize edge
      paddingRight: {
        '': '($content-padding, 1x)',
        'edge=right': `calc(($content-padding, 1x) + ${HANDLER_RESERVED}px)`,
      },
      paddingBottom: {
        '': '($content-padding, 1x)',
        'edge=bottom': `calc(($content-padding, 1x) + ${HANDLER_RESERVED}px)`,
      },
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
      right: {
        '': '1px',
        'edge=right': `${HANDLER_RESERVED + 1}px`,
      },
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
      bottom: {
        '': '1px',
        'edge=bottom': `${HANDLER_RESERVED + 1}px`,
      },
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

    // Compact resize handler - only drag dots
    ResizeHandler: {
      position: 'absolute',
      zIndex: 1,
      // Size: 9px interactive area
      width: {
        '': '100%',
        'edge=right': `${HANDLER_WIDTH}px`,
      },
      height: {
        '': `${HANDLER_WIDTH}px`,
        'edge=right': '100%',
      },
      // Position at edge, centered on the reserved space boundary
      right: {
        '': 'initial',
        'edge=right': `${(HANDLER_RESERVED - HANDLER_WIDTH) / 2}px`,
      },
      bottom: {
        '': `${(HANDLER_RESERVED - HANDLER_WIDTH) / 2}px`,
        'edge=right': 'initial',
      },
      top: {
        '': 'initial',
        'edge=right': 0,
      },
      left: {
        '': 0,
        'edge=right': 'initial',
      },
      cursor: {
        '': 'row-resize',
        'edge=right': 'col-resize',
        disabled: 'not-allowed',
      },
      padding: 0,
      outline: 0,
      boxSizing: 'border-box',
      transition: 'theme',
    },

    Drag: {
      display: 'grid',
      gap: '2bw',
      border: 0,
      flow: {
        '': 'row',
        'edge=right': 'column',
      },
      gridColumns: {
        '': '3px 3px 3px 3px 3px',
        'edge=right': 'auto',
      },
      gridRows: {
        '': 'auto',
        'edge=right': '3px 3px 3px 3px 3px',
      },
      width: {
        '': 'auto',
        'edge=right': '3px',
      },
      height: {
        '': '3px',
        'edge=right': 'auto',
      },
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      transition: 'theme',
      radius: 'round',
      outline: {
        '': '0',
        'focused | drag': '1bw #purple-text',
      },
      outlineOffset: 1,
    },

    DragPart: {
      radius: true,
      fill: {
        '': '#dark-03',
        'handlerHovered | drag | focused': '#purple-text',
        disabled: '#dark-04',
      },
    },
  },
});

export type ResizeEdge = 'right' | 'bottom';

export interface CubeLayoutPaneProps extends BaseProps, ContainerStyleProps {
  /** Edge where resize handler appears */
  resizeEdge?: ResizeEdge;
  /** Enable resize functionality */
  isResizable?: boolean;
  /** Controlled size (width for right edge, height for bottom edge) */
  size?: number | string;
  /** Default size for uncontrolled state */
  defaultSize?: number | string;
  /** Minimum size constraint */
  minSize?: number | string;
  /** Maximum size constraint */
  maxSize?: number | string;
  /** Size change callback */
  onSizeChange?: (size: number) => void;
  /** Scrollbar style */
  scrollbar?: ScrollbarType;
  /** Custom styles */
  styles?: Styles;
  children?: ReactNode;
  /** Ref for the inner content element */
  innerRef?: ForwardedRef<HTMLDivElement>;
  /** Props to spread on the Inner sub-element */
  innerProps?: HTMLAttributes<HTMLDivElement>;
}

interface PaneResizeHandlerProps {
  edge: ResizeEdge;
  isDisabled?: boolean;
  moveProps: ReturnType<typeof useMove>['moveProps'];
  onDoubleClick?: () => void;
  onHoverChange?: (isHovered: boolean) => void;
  onFocusChange?: (isFocused: boolean) => void;
}

function PaneResizeHandler(props: PaneResizeHandlerProps) {
  const {
    edge,
    isDisabled,
    moveProps,
    onDoubleClick,
    onHoverChange,
    onFocusChange,
  } = props;
  const { hoverProps, isHovered } = useHover({
    onHoverChange,
  });
  const { focusProps, isFocusVisible } = useFocusRing();
  const isHorizontal = edge === 'right';

  // Notify parent of focus changes
  useEffect(() => {
    onFocusChange?.(isFocusVisible);
  }, [isFocusVisible, onFocusChange]);

  return (
    <div
      data-element="ResizeHandler"
      {...mergeProps(hoverProps, focusProps, isDisabled ? {} : moveProps, {
        tabIndex: isDisabled ? undefined : 0,
        role: 'separator',
        'aria-orientation': isHorizontal ? 'vertical' : 'horizontal',
        'aria-label': `Resize pane ${edge}`,
        onDoubleClick: isDisabled ? undefined : onDoubleClick,
      })}
    >
      {!isDisabled && (
        <div data-element="Drag">
          <div data-element="DragPart" />
          <div data-element="DragPart" />
          <div data-element="DragPart" />
          <div data-element="DragPart" />
          <div data-element="DragPart" />
        </div>
      )}
    </div>
  );
}

function LayoutPane(
  props: CubeLayoutPaneProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    resizeEdge = 'right',
    isResizable = false,
    size: providedSize,
    defaultSize = 200,
    minSize,
    maxSize,
    onSizeChange,
    scrollbar = 'thin',
    styles,
    mods,
    children,
    innerRef: innerRefProp,
    innerProps,
    ...otherProps
  } = props;

  const combinedRef = useCombinedRefs(ref);
  const internalInnerRef = useRef<HTMLDivElement>(null);
  const combinedInnerRef = useCombinedRefs(innerRefProp, internalInnerRef);
  const prevProvidedSizeRef = useRef(providedSize);
  const isHorizontal = resizeEdge === 'right';

  // Resize state
  const [isDragging, setIsDragging] = useState(false);
  const [isHandlerHovered, setIsHandlerHovered] = useState(false);
  const [isHandlerFocused, setIsHandlerFocused] = useState(false);
  const debouncedHandlerHovered = useDebouncedValue(isHandlerHovered, 150);
  const [size, setSize] = useState<number>(() => {
    const initialSize =
      typeof providedSize === 'number'
        ? providedSize
        : typeof defaultSize === 'number'
          ? defaultSize
          : 200;

    return clampSize(initialSize, minSize, maxSize);
  });

  // Extract outer wrapper styles and inner content styles
  const outerStyles = extractStyles(otherProps, OUTER_STYLES);
  const innerStyles = extractStyles(otherProps, INNER_STYLES);

  const isTinyScrollbar = scrollbar === 'tiny';
  const { hoverProps, isHovered } = useHover({});

  const {
    handleVStyle,
    handleHStyle,
    hasOverflowY,
    hasOverflowX,
    isScrolling,
  } = useTinyScrollbar(internalInnerRef, isTinyScrollbar);

  // Clamp size to min/max constraints
  const clampValue = useCallback(
    (value: number) => clampSize(value, minSize, maxSize),
    [minSize, maxSize],
  );

  const { moveProps } = useMove({
    onMoveStart() {
      if (!isResizable) return;
      setIsDragging(true);
    },
    onMove(e) {
      if (!isResizable) return;

      let delta: number;

      if (e.pointerType === 'keyboard') {
        // Keyboard resize: 10px per step, 50px with Shift
        const step = e.shiftKey ? 50 : 10;
        const rawDelta = isHorizontal ? e.deltaX : e.deltaY;
        delta = rawDelta * step;
      } else {
        // Pointer resize: use exact delta values
        delta = isHorizontal ? e.deltaX : e.deltaY;
      }

      setSize((currentSize) => clampValue(currentSize + delta));
    },
    onMoveEnd() {
      setIsDragging(false);
      // Round to integer on release and notify parent
      setSize((currentSize) => {
        const finalSize = Math.round(clampValue(currentSize));
        onSizeChange?.(finalSize);
        return finalSize;
      });
    },
  });

  // Sync provided size with internal state (only when providedSize actually changes)
  // This prevents resetting size when only isDragging changes (which would cause a flash)
  useEffect(() => {
    if (prevProvidedSizeRef.current !== providedSize) {
      prevProvidedSizeRef.current = providedSize;
      if (typeof providedSize === 'number' && !isDragging) {
        setSize(clampValue(providedSize));
      }
    }
  }, [providedSize, isDragging, clampValue]);

  // Reset to default size on double-click
  const handleResetSize = useCallback(() => {
    const resetSize =
      typeof defaultSize === 'number' ? defaultSize : parseInt(defaultSize, 10);
    const clampedSize = clampValue(resetSize || 200);
    setSize(clampedSize);
    onSizeChange?.(clampedSize);
  }, [defaultSize, clampValue, onSizeChange]);

  const scrollbarStyle = useMemo(() => {
    if (!isTinyScrollbar) return {};

    return {
      ...handleVStyle,
      ...handleHStyle,
    };
  }, [isTinyScrollbar, handleVStyle, handleHStyle]);

  const paneMods = useMemo(
    () => ({
      scrollbar,
      hovered: isHovered,
      scrolling: isScrolling,
      handlerHovered: debouncedHandlerHovered,
      focused: isHandlerFocused,
      disabled: !isResizable,
      edge: resizeEdge,
      drag: isDragging,
      ...mods,
    }),
    [
      scrollbar,
      isHovered,
      isScrolling,
      debouncedHandlerHovered,
      isHandlerFocused,
      isResizable,
      resizeEdge,
      isDragging,
      mods,
    ],
  );

  // Merge styles: outer styles to root, inner styles to Inner element
  // Size is NOT included here - it's set via CSS custom property in paneStyle for performance
  const finalStyles = useMemo(() => {
    return mergeStyles(
      styles,
      outerStyles,
      innerStyles ? { Inner: innerStyles } : null,
    );
  }, [styles, outerStyles, innerStyles]);

  // Size is set via CSS custom property for performance during drag
  // This avoids expensive style recalculation on every mouse move
  const paneStyle = useMemo(
    () => ({
      ...scrollbarStyle,
      '--pane-size': `${size}px`,
      '--min-size': typeof minSize === 'number' ? `${minSize}px` : minSize,
      '--max-size': typeof maxSize === 'number' ? `${maxSize}px` : maxSize,
    }),
    [scrollbarStyle, size, minSize, maxSize],
  );

  return (
    <PaneElement
      ref={combinedRef}
      {...filterBaseProps(otherProps, { eventProps: true })}
      {...hoverProps}
      mods={paneMods}
      styles={finalStyles}
      style={paneStyle}
    >
      <div ref={combinedInnerRef} data-element="Inner" {...innerProps}>
        <LayoutContextReset>{children}</LayoutContextReset>
      </div>
      {isTinyScrollbar && hasOverflowY && <div data-element="ScrollbarV" />}
      {isTinyScrollbar && hasOverflowX && <div data-element="ScrollbarH" />}
      {isResizable && (
        <PaneResizeHandler
          edge={resizeEdge}
          isDisabled={!isResizable}
          moveProps={moveProps}
          onDoubleClick={handleResetSize}
          onHoverChange={setIsHandlerHovered}
          onFocusChange={setIsHandlerFocused}
        />
      )}
    </PaneElement>
  );
}

const _LayoutPane = forwardRef(LayoutPane);

_LayoutPane.displayName = 'Layout.Pane';

export { _LayoutPane as LayoutPane };
