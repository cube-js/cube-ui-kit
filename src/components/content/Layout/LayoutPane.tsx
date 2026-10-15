import {
  BaseProps,
  ContainerStyleProps,
  filterBaseProps,
  INNER_STYLES,
  mergeStyles,
  OUTER_STYLES,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import { useFocusRing, useHover, useMove } from 'react-aria';

import { useDebouncedValue } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';

import { useTinyScrollbar } from './hooks/useTinyScrollbar';
import { ScrollbarType } from './LayoutContent';
import { LayoutContextReset } from './LayoutContext';
import { clampSize } from './utils';

// Handler dimensions
const HANDLER_WIDTH = 9; // Interactive area
const HANDLER_RESERVED = 5; // Space reserved in Inner padding

// Sent to the items beside a pane that gives way, as it starts and ends a
// resize: a pane among them that gives way takes the size it is drawn at as
// its own. `detail` is whether the resize is horizontal.
const ADOPT_DRAWN_SIZE_EVENT = 'cube-layout-pane-adopt-drawn-size';

function setPaneSize(pane: HTMLElement, size: number) {
  pane.style.setProperty('--pane-size', `${size}px`);
}

function getDrawnSize(element: HTMLElement, isHorizontal: boolean) {
  const style = getComputedStyle(element);

  return Math.round(parseFloat(isHorizontal ? style.width : style.height));
}

function givesWay(element: Element) {
  return parseFloat(getComputedStyle(element).flexShrink) > 0;
}

/**
 * The flex container a pane gives way in along its resize axis, or `null`
 * when it holds its size there.
 */
function getYieldingContainer(pane: HTMLElement, isHorizontal: boolean) {
  const container = pane.parentElement;

  if (!container || !givesWay(pane)) return null;

  const style = getComputedStyle(container);
  const isFlex = style.display === 'flex' || style.display === 'inline-flex';

  return isFlex &&
    style.flexDirection.startsWith('row') === isHorizontal &&
    style.flexWrap === 'nowrap'
    ? container
    : null;
}

/** How far a flex container's items run past its content box. */
function getOverflow(container: HTMLElement, isHorizontal: boolean) {
  const style = getComputedStyle(container);
  const available = isHorizontal
    ? container.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight)
    : container.clientHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom);
  let used = 0;
  let count = 0;

  for (const item of Array.from(container.children)) {
    const itemStyle = getComputedStyle(item);

    if (
      itemStyle.display === 'none' ||
      itemStyle.position === 'absolute' ||
      itemStyle.position === 'fixed'
    ) {
      continue;
    }

    const rect = item.getBoundingClientRect();

    used += isHorizontal
      ? rect.width +
        parseFloat(itemStyle.marginLeft) +
        parseFloat(itemStyle.marginRight)
      : rect.height +
        parseFloat(itemStyle.marginTop) +
        parseFloat(itemStyle.marginBottom);
    count += 1;
  }

  const gap = parseFloat(isHorizontal ? style.columnGap : style.rowGap) || 0;

  return used + gap * Math.max(count - 1, 0) - available;
}

/**
 * Flex shares an overflow by size, so a pane that gave way would otherwise
 * take part of every move back by its old, larger size.
 */
function adoptDrawnSizesBeside(
  pane: HTMLElement,
  container: HTMLElement,
  isHorizontal: boolean,
) {
  for (const item of Array.from(container.children)) {
    if (item !== pane) {
      item.dispatchEvent(
        new CustomEvent(ADOPT_DRAWN_SIZE_EVENT, { detail: isHorizontal }),
      );
    }
  }
}

interface PaneMove {
  /** The size so far, ahead of the rendered one. */
  size: number;
  /** The flex container the pane gives way in; it holds its size while moving. */
  container: HTMLElement | null;
  /** How far the container's items may run past it, as they did at the start. */
  maxOverflow: number;
}

const PaneElement = tasty({
  as: 'div',
  qa: 'LayoutPane',
  styles: {
    container: 'pane / inline-size',
    position: 'relative',
    display: 'grid',
    gridColumns: '1sf',
    gridRows: '1sf',
    placeContent: 'stretch',
    placeItems: 'stretch',
    placeSelf: 'stretch',
    // Holds its size. With `flexShrink={1}` it gives way down to its minimum
    // when a flex container runs short.
    flexShrink: 0,
    flexGrow: 0,
    // Size is set via CSS custom property for performance during drag
    width: {
      '': 'auto',
      'edge=right': '($pane-min-size, 2x) $pane-size $pane-size',
    },
    height: {
      '': '($pane-min-size, 2x) $pane-size $pane-size',
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
      $: '>',
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
        'focused | drag': '1bw #primary-text',
      },
      outlineOffset: 1,
    },

    DragPart: {
      radius: true,
      fill: {
        '': '#dark-03',
        'handlerHovered | drag | focused': '#primary-text',
        disabled: '#disabled-surface-text',
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
  const { t } = useI18n();
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
        'aria-label':
          edge === 'right'
            ? t('layout.resizePaneRight', 'Resize pane right')
            : t('layout.resizePaneBottom', 'Resize pane bottom'),
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

  const moveRef = useRef<PaneMove | null>(null);

  const { moveProps } = useMove({
    onMoveStart() {
      if (!isResizable) return;
      setIsDragging(true);

      // Flex shrinking or a CSS minimum can draw the pane at another size than
      // `size`; resize from the one on screen, or the first moves do nothing.
      const pane = combinedRef.current;
      const drawn = pane ? getDrawnSize(pane, isHorizontal) : NaN;
      const start =
        Number.isFinite(drawn) && Math.abs(drawn - size) >= 1 ? drawn : size;
      const container = pane ? getYieldingContainer(pane, isHorizontal) : null;

      // A pane that gives way would also give back part of every move to the
      // panes beside it, so it holds its size until the move ends. Keyboard
      // moves start and end within one event, so this goes to the DOM, not
      // through a render.
      if (pane && container) {
        setPaneSize(pane, start);
        pane.style.flexShrink = '0';
        adoptDrawnSizesBeside(pane, container, isHorizontal);
      }

      moveRef.current = {
        size: start,
        container,
        maxOverflow: container
          ? Math.max(getOverflow(container, isHorizontal), 0)
          : 0,
      };
      setSize(start);
    },
    onMove(e) {
      const move = moveRef.current;

      if (!isResizable || !move) return;

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

      let next = clampValue(move.size + delta);
      const pane = combinedRef.current;

      // Holding its size, the pane would push the content beside it out of
      // the container once nothing there can give way. Grow only into the room
      // it would have taken while giving way.
      if (pane && move.container && next > move.size) {
        setPaneSize(pane, next);

        const excess =
          getOverflow(move.container, isHorizontal) - move.maxOverflow;

        if (excess > 0) {
          next = Math.max(next - excess, move.size);
          setPaneSize(pane, next);
        }
      }

      move.size = next;
      setSize(next);
    },
    onMoveEnd() {
      const move = moveRef.current;

      moveRef.current = null;
      setIsDragging(false);

      if (!move) return;

      // Round to integer on release and notify parent
      const finalSize = Math.round(clampValue(move.size));
      const pane = combinedRef.current;

      if (pane && move.container) {
        setPaneSize(pane, finalSize);
        adoptDrawnSizesBeside(pane, move.container, isHorizontal);
        pane.style.removeProperty('flex-shrink');
      }

      setSize(finalSize);
      onSizeChange?.(finalSize);
    },
  });

  const onAdoptDrawnSize = useEffectEvent((event: Event) => {
    const pane = combinedRef.current;

    if (
      !pane ||
      (event as CustomEvent<boolean>).detail !== isHorizontal ||
      !givesWay(pane)
    ) {
      return;
    }

    const drawn = getDrawnSize(pane, isHorizontal);
    // Ahead of `size` when this pane already took a size in the same event.
    const current = parseFloat(pane.style.getPropertyValue('--pane-size'));

    if (!Number.isFinite(drawn) || Math.abs(drawn - current) < 1) return;

    setPaneSize(pane, drawn);
    setSize(drawn);
    onSizeChange?.(drawn);
  });

  useEffect(() => {
    const pane = combinedRef.current;

    if (!pane) return;

    pane.addEventListener(ADOPT_DRAWN_SIZE_EVENT, onAdoptDrawnSize);

    return () => {
      pane.removeEventListener(ADOPT_DRAWN_SIZE_EVENT, onAdoptDrawnSize);
    };
  }, [combinedRef]);

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
  const handleResetSize = () => {
    const resetSize =
      typeof defaultSize === 'number' ? defaultSize : parseInt(defaultSize, 10);
    const clampedSize = clampValue(resetSize || 200);
    setSize(clampedSize);
    onSizeChange?.(clampedSize);
  };

  const scrollbarStyle = isTinyScrollbar
    ? { ...handleVStyle, ...handleHStyle }
    : {};

  const paneMods = {
    scrollbar,
    hovered: isHovered,
    scrolling: isScrolling,
    handlerHovered: debouncedHandlerHovered,
    focused: isHandlerFocused,
    disabled: !isResizable,
    edge: resizeEdge,
    drag: isDragging,
    ...mods,
  };

  // Merge styles: outer styles to root, inner styles to Inner element
  // Size is NOT included here - it's set via CSS custom property in paneStyle for performance
  const finalStyles = mergeStyles(
    styles,
    outerStyles,
    innerStyles ? { Inner: innerStyles } : null,
  );

  // Size is set via CSS custom property for performance during drag
  // This avoids expensive style recalculation on every mouse move
  const paneStyle = {
    ...scrollbarStyle,
    '--pane-size': `${size}px`,
    // Reset rather than left unset: a custom property inherits, and an
    // enclosing pane's minimum is not this one's.
    '--pane-min-size':
      minSize == null
        ? 'initial'
        : typeof minSize === 'number'
          ? `${minSize}px`
          : minSize,
  };

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
