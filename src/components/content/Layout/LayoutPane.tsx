import {
  ContainerStyleProps,
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
  useId,
  useRef,
  useState,
} from 'react';
import { useHover, useMove } from 'react-aria';

import { useDebouncedValue } from '../../../_internal/hooks/use-debounced-value';
import { useI18n } from '../../../i18n/useI18n';
import { filterComponentBaseProps } from '../../../utils/react/componentBaseProps';
import { useCombinedRefs } from '../../../utils/react/useCombinedRefs';
import { extractStyles, mergeStyleLayers } from '../../../utils/styles';

import { useTinyScrollbar } from './hooks/useTinyScrollbar';
import { ScrollbarType } from './LayoutContent';
import { LayoutContextReset } from './LayoutContext';
import { LayoutResizeHandle } from './LayoutResizeHandle';
import { clampSize } from './utils';

import type { ComponentBaseProps } from '../../../utils/react/componentBaseProps';

// Handler dimensions
const HANDLER_WIDTH = 9; // Interactive area
const HANDLER_RESERVED = 5; // Space reserved in Inner padding

/** Mounted panes by element: the axis each resizes along, and how it takes a size. */
const mountedPanes = new WeakMap<
  Element,
  { isHorizontal: boolean; adoptSize: (drawn: number) => void }
>();

function setPaneSize(pane: HTMLElement, size: number) {
  pane.style.setProperty('--pane-size', `${size}px`);
}

/** The size an element is drawn at, or `NaN` when it is not drawn. */
function getDrawnSize(element: HTMLElement, isHorizontal: boolean) {
  // Hidden, an element reports the size it is set to.
  if (!element.getClientRects().length) return NaN;

  const style = getComputedStyle(element);

  return parseFloat(isHorizontal ? style.width : style.height);
}

function givesWay(element: Element) {
  return parseFloat(getComputedStyle(element).flexShrink) > 0;
}

/** A container's content size along an axis: the room its items have. */
function getAvailableSize(container: HTMLElement, isHorizontal: boolean) {
  const style = getComputedStyle(container);

  return isHorizontal
    ? container.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight)
    : container.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
}

/** How far a flex container's items run past its content box. */
function getOverflow(container: HTMLElement, isHorizontal: boolean) {
  const style = getComputedStyle(container);
  const rect = container.getBoundingClientRect();
  // Items are measured as drawn, which a zoomed or scaled ancestor makes
  // differ from the container's own layout size.
  const scale =
    (isHorizontal
      ? rect.width / container.offsetWidth
      : rect.height / container.offsetHeight) || 1;
  const available = getAvailableSize(container, isHorizontal);
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

    const itemRect = item.getBoundingClientRect();

    used += isHorizontal
      ? itemRect.width / scale +
        parseFloat(itemStyle.marginLeft) +
        parseFloat(itemStyle.marginRight)
      : itemRect.height / scale +
        parseFloat(itemStyle.marginTop) +
        parseFloat(itemStyle.marginBottom);
    count += 1;
  }

  const gap = parseFloat(isHorizontal ? style.columnGap : style.rowGap) || 0;

  return used + gap * Math.max(count - 1, 0) - available;
}

/**
 * The other drawn panes that give way along the same axis, when this one gives
 * way in a non-wrapping flex container along it.
 */
function getPanesBeside(pane: HTMLElement, isHorizontal: boolean) {
  const container = pane.parentElement;

  if (!container || !givesWay(pane)) return [];

  const style = getComputedStyle(container);

  if (
    (style.display !== 'flex' && style.display !== 'inline-flex') ||
    style.flexDirection.startsWith('row') !== isHorizontal ||
    style.flexWrap !== 'nowrap'
  ) {
    return [];
  }

  return Array.from(container.children as HTMLCollectionOf<HTMLElement>).filter(
    (item) =>
      item !== pane &&
      mountedPanes.get(item)?.isHorizontal === isHorizontal &&
      givesWay(item) &&
      Number.isFinite(getDrawnSize(item, isHorizontal)),
  );
}

interface PaneMove {
  /** Where the pointer or keys ask the pane to be. */
  target: number;
  /** The size so far, ahead of the rendered one. */
  size: number;
  /** The size the move begins at. */
  start: number;
  /** The pane's own size before the move. */
  ownSize: string;
  /** What began the move: a pointer or the keyboard. */
  pointerType: string;
  /** The flex container the pane gives way in beside other panes, or `null`. */
  container: HTMLElement | null;
  /** The panes beside it, sized as drawn for the move. */
  beside: HTMLElement[];
  /** Their own sizes before the move. */
  besideSizes: string[];
  /** The panes that hold their size until the move ends. */
  held: HTMLElement[];
  /** How far the container's items may run past it, as they did at the start. */
  maxOverflow: number;
}

/**
 * Gives the panes beside a move back their own sizes and lets go of every
 * held pane.
 */
function undoMove(move: PaneMove) {
  move.beside.forEach((item, index) =>
    item.style.setProperty('--pane-size', move.besideSizes[index]),
  );
  move.held.forEach((item) => item.style.removeProperty('flex-shrink'));
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
      // It sits a device pixel in from the edge.
      '$scrollbar-inset': '1px',
      position: 'absolute',
      right: {
        '': '$scrollbar-inset',
        'edge=right': `(${HANDLER_RESERVED}px + $scrollbar-inset)`,
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
      transition: 'opacity $scrollbar-transition',
      pointerEvents: 'none',
    },

    ScrollbarH: {
      $: '>',
      // It sits a device pixel in from the edge.
      '$scrollbar-inset': '1px',
      position: 'absolute',
      bottom: {
        '': '$scrollbar-inset',
        'edge=bottom': `(${HANDLER_RESERVED}px + $scrollbar-inset)`,
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
      transition: 'opacity $scrollbar-transition',
      pointerEvents: 'none',
    },
  },
});

// The handle's box, centred on the room the pane reserves beside its content;
// LayoutResizeHandle draws the edge inside it.
const PANE_HANDLE_STYLES: Styles = {
  // Device pixels: the handle's thickness, so its offsets stay whole pixels.
  '$handle-size': `${HANDLER_WIDTH}px`,
  // The edge line lies on the pane's edge and thickens into the pane: an item
  // after the pane paints over anything drawn past it.
  '$handle-edge-inset': `${(HANDLER_WIDTH - HANDLER_RESERVED) / 2}px`,
  width: {
    '': '100%',
    horizontal: '$handle-size',
  },
  height: {
    '': '$handle-size',
    horizontal: '100%',
  },
  right: {
    '': 'initial',
    horizontal: `${(HANDLER_RESERVED - HANDLER_WIDTH) / 2}px`,
  },
  bottom: {
    '': `${(HANDLER_RESERVED - HANDLER_WIDTH) / 2}px`,
    horizontal: 'initial',
  },
  top: {
    '': 'initial',
    horizontal: 0,
  },
  left: {
    '': 0,
    horizontal: 'initial',
  },
};

export type ResizeEdge = 'right' | 'bottom';

export interface CubeLayoutPaneProps
  extends ComponentBaseProps, ContainerStyleProps {
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
  /**
   * Size change callback. With `flexShrink={1}`, also called when another
   * such pane beside it is resized and this pane keeps the size it is drawn
   * at.
   */
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
  const { t } = useI18n();
  // The resize handle controls the pane, so a resizable pane needs an id.
  const generatedId = useId();
  const paneId = otherProps.id ?? generatedId;

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
    handleVTokens,
    handleHTokens,
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

  const beginMove = (pane: HTMLElement, pointerType: string): PaneMove => {
    const drawn = getDrawnSize(pane, isHorizontal);
    const beside = getPanesBeside(pane, isHorizontal);
    const rounded = Math.round(drawn);
    // Flex shrinking or a CSS minimum can draw the pane at another size than
    // `size`; resize from the one on screen, or the first moves do nothing.
    // Beside other panes the move begins exactly there, so nothing shifts.
    const start = beside.length
      ? drawn
      : Math.abs(rounded - size) >= 1
        ? rounded
        : size;
    const move: PaneMove = {
      target: start,
      size: start,
      start,
      ownSize: pane.style.getPropertyValue('--pane-size'),
      pointerType,
      container: beside.length ? pane.parentElement : null,
      beside,
      besideSizes: beside.map((item) =>
        item.style.getPropertyValue('--pane-size'),
      ),
      held: [],
      maxOverflow: 0,
    };

    // Beside other panes that give way, this one would hand them part of every
    // move: flex shares the room by size, and theirs are larger than drawn. So
    // they take the sizes they are drawn at, and this pane holds its size until
    // the move ends, as do the panes before its grip: the room comes from
    // beyond the grip. Keyboard moves start and end within one event, so this
    // goes to the DOM, not through a render. Every size is read before one is
    // written, as each write reflows the rest.
    if (move.container) {
      const side = isHorizontal ? 'left' : 'top';
      const paneStart = pane.getBoundingClientRect()[side];
      const sizes = beside.map((item) => getDrawnSize(item, isHorizontal));

      move.maxOverflow = Math.max(getOverflow(move.container, isHorizontal), 0);
      move.held = [
        pane,
        ...beside.filter(
          (item) => item.getBoundingClientRect()[side] < paneStart,
        ),
      ];
      beside.forEach((item, index) => setPaneSize(item, sizes[index]));
      move.held.forEach((item) => item.style.setProperty('flex-shrink', '0'));
    }

    return move;
  };

  const endMove = (move: PaneMove) => {
    // Round to integer when the move ends and notify parent
    const finalSize = Math.round(clampValue(move.size));
    const pane = combinedRef.current;

    if (move.container) {
      // A move that ends where it began, as a key pressed at a stop does,
      // leaves every pane as it found them.
      if (finalSize === Math.round(move.start)) {
        undoMove(move);
        pane.style.setProperty('--pane-size', move.ownSize);
        setSize(parseFloat(move.ownSize));

        return;
      }

      setPaneSize(pane, finalSize);

      // The panes beside it keep the sizes they are left at, read while the
      // panes still hold, before one is written. A pane left at its own size,
      // or hidden meanwhile, keeps its own.
      const sizes = move.beside.map((item) =>
        Math.round(getDrawnSize(item, isHorizontal)),
      );

      undoMove(move);
      move.beside.forEach((item, index) => {
        if (
          Number.isFinite(sizes[index]) &&
          sizes[index] !== Math.round(parseFloat(move.besideSizes[index]))
        ) {
          mountedPanes.get(item)?.adoptSize(sizes[index]);
        }
      });
    }

    setSize(finalSize);
    onSizeChange?.(finalSize);
  };

  // The current move, or a new one. An arrow key pressed during a drag joins it.
  const continueMove = (pointerType: string) => {
    const move = moveRef.current ?? beginMove(combinedRef.current, pointerType);

    moveRef.current = move;

    return move;
  };

  const moveBy = (move: PaneMove, delta: number) => {
    const pane = combinedRef.current;

    move.target += delta;

    let next = clampValue(move.target);

    if (!move.container) {
      // On its own, the pane keeps no travel past its limits.
      move.target = next;
    } else {
      setPaneSize(pane, next);

      // Holding its size, the pane would push the items beyond its grip out
      // of the container once none of them can give way. It grows only into
      // the room it would have taken while giving way, and the target keeps
      // the travel past that, as flex did.
      if (next > move.size) {
        const excess =
          getOverflow(move.container, isHorizontal) - move.maxOverflow;

        if (excess > 0) {
          next = Math.max(next - excess, move.size);
          setPaneSize(pane, next);
        }
      }
    }

    move.size = next;
    setSize(next);
  };

  const finishMove = (pointerType: string) => {
    const move = moveRef.current;

    // Beside other panes, a key pressed during a drag leaves the move to the
    // pointer. On its own, the pane reports at the key's end, and the drag
    // goes on as a new move, as before.
    if (move?.container && move.pointerType !== pointerType) return;

    moveRef.current = null;
    setIsDragging(false);

    if (move) endMove(move);
  };

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

      // A move across the resize axis changes nothing.
      if (!delta) return;

      moveBy(continueMove(e.pointerType), delta);
    },
    onMoveEnd(e) {
      finishMove(e.pointerType);
    },
  });

  // Home and End: a keyboard move to the pane's own minimum or maximum, which
  // the panes beside it limit as they limit any other move.
  const minSizePx = typeof minSize === 'number' ? minSize : undefined;
  const maxSizePx = typeof maxSize === 'number' ? maxSize : undefined;

  // With no maximum in pixels, the handle's value range ends at the room the
  // pane's container has: a screen reader reads a missing maximum as 100,
  // browsing the page as well as on focus, so the room is kept current.
  const [containerSize, setContainerSize] = useState<number>();
  const measuresContainer = isResizable && maxSizePx == null;

  useEffect(() => {
    const container = combinedRef.current?.parentElement;

    if (!measuresContainer || !container) return;

    const observer = new ResizeObserver(() => {
      const room = Math.round(getAvailableSize(container, isHorizontal));

      // A container that is not laid out (hidden, or `display: contents`)
      // measures nothing, which is no limit.
      setContainerSize(room > 0 ? room : undefined);
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [combinedRef, measuresContainer, isHorizontal]);

  const handleJump = (limit: 'min' | 'max') => {
    const target = limit === 'min' ? minSizePx : maxSizePx;

    if (target == null) return;

    const move = continueMove('keyboard');

    moveBy(move, target - move.target);
    finishMove('keyboard');
  };

  const adoptSize = useEffectEvent((drawn: number) => {
    setPaneSize(combinedRef.current, drawn);
    setSize(drawn);
    onSizeChange?.(drawn);
  });

  useEffect(() => {
    const pane = combinedRef.current;

    mountedPanes.set(pane, {
      isHorizontal,
      adoptSize: (drawn) => adoptSize(drawn),
    });

    return () => {
      mountedPanes.delete(pane);

      // Unmounted or turned to the other axis mid-move, the pane gives the
      // panes beside it back.
      if (moveRef.current) undoMove(moveRef.current);

      moveRef.current = null;
    };
  }, [combinedRef, isHorizontal]);

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

  const scrollbarTokens = isTinyScrollbar
    ? { ...handleVTokens, ...handleHTokens }
    : undefined;

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

  // The handle draws its Line, Grip and TouchArea itself, so a consumer's
  // styles for them go to the handle, where they outrank its own. From the
  // pane, a selector for them would tie with the handle's and lose.
  const { Line, Grip, TouchArea, ...paneStyles } = styles ?? {};
  const handleStyles =
    (Line ?? Grip ?? TouchArea)
      ? // oxlint-disable-next-line tasty/no-runtime-styles-mutation -- forwards the consumer's `styles.Line`, `styles.Grip` and `styles.TouchArea` to the handle that draws them
        mergeStyleLayers(PANE_HANDLE_STYLES, { Line, Grip, TouchArea })
      : PANE_HANDLE_STYLES;

  // Merge styles: outer styles to root, inner styles to Inner element
  // Size is NOT included here - it's set via the `$pane-size` token in paneTokens for performance
  const finalStyles = mergeStyles(
    paneStyles,
    outerStyles,
    // oxlint-disable-next-line tasty/no-runtime-styles-mutation -- forwards the consumer's `innerStyles` to `Inner`
    innerStyles ? { Inner: innerStyles } : null,
  );

  // Size is set via CSS custom property for performance during drag
  // This avoids expensive style recalculation on every mouse move
  const paneTokens = {
    ...scrollbarTokens,
    '$pane-size': `${size}px`,
    // Reset rather than left unset: a custom property inherits, and an
    // enclosing pane's minimum is not this one's.
    '$pane-min-size':
      minSize == null
        ? 'initial'
        : typeof minSize === 'number'
          ? `${minSize}px`
          : minSize,
  };

  return (
    <PaneElement
      ref={combinedRef}
      {...filterComponentBaseProps(otherProps, { eventProps: true })}
      id={isResizable ? paneId : otherProps.id}
      {...hoverProps}
      mods={paneMods}
      styles={finalStyles}
      tokens={{ ...paneTokens, ...otherProps.tokens }}
    >
      <div ref={combinedInnerRef} data-element="Inner" {...innerProps}>
        <LayoutContextReset>{children}</LayoutContextReset>
      </div>
      {isTinyScrollbar && hasOverflowY && <div data-element="ScrollbarV" />}
      {isTinyScrollbar && hasOverflowX && <div data-element="ScrollbarH" />}
      {isResizable && (
        <LayoutResizeHandle
          data-element="ResizeHandler"
          side={isHorizontal ? 'left' : 'top'}
          anchor={resizeEdge}
          hasEdgeLine
          label={
            isHorizontal
              ? t('layout.resizePaneRight', 'Resize pane right')
              : t('layout.resizePaneBottom', 'Resize pane bottom')
          }
          controls={paneId}
          size={size}
          minSize={minSizePx}
          maxSize={maxSizePx ?? containerSize}
          isDragging={isDragging}
          styles={handleStyles}
          moveProps={moveProps}
          onJump={handleJump}
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
