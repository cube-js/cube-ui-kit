import { BasePropsWithoutChildren, Styles, tasty, Tokens } from '@tenphi/tasty';
import { KeyboardEvent, useEffect, useEffectEvent } from 'react';
import { useFocusRing, useHover, useMove } from 'react-aria';

import { useDebouncedValue } from '../../../_internal/hooks/use-debounced-value';
import { mergeProps } from '../../../utils/react/mergeProps';

import type { Side } from './LayoutContext';

/**
 * The resize handle of `Layout.Panel` and `Layout.Pane`.
 *
 * Its owner keeps the handle's box: size, position and transforms, with
 * `$handle-edge-inset` in its styles. Inside that box the handle draws the
 * edge: a line at `$handle-edge-inset` from its `anchor` side, which thickens
 * away from that side while the handle is in use. The grip and the touch area
 * centre on that line. Nothing outside the handle moves.
 */
const ResizeHandleElement = tasty({
  styles: {
    position: 'absolute',
    padding: 0,
    boxSizing: 'border-box',
    touchAction: 'none',
    radius: true,
    // At a limit the edge can move one way only, and the cursor says which.
    cursor: {
      '': 'row-resize',
      horizontal: 'col-resize',
      '(limit=min & side=left) | (limit=max & side=right)': 'e-resize',
      '(limit=max & side=left) | (limit=min & side=right)': 'w-resize',
      '(limit=min & side=top) | (limit=max & side=bottom)': 's-resize',
      '(limit=max & side=top) | (limit=min & side=bottom)': 'n-resize',
    },
    outline: {
      '': '$ring-width #focus.0',
      focused: '$ring-width #focus',
    },
    outlineOffset: '$outline-offset',
    transition: 'theme',

    // Where the line starts, from the anchor side. The owner sets it.
    '$handle-edge-inset': '0px',
    // A marker line in device pixels while the handle is in use, like the
    // table's column resizer and drop indicators.
    '$handle-line-size': '2px',

    // The edge. A hairline at rest, where the box has no border of its own to
    // show it; a marker line in device pixels while the handle is in use.
    Line: {
      position: 'absolute',
      inset: {
        '': '0 auto 0 $handle-edge-inset',
        'anchor=right': '0 $handle-edge-inset 0 auto',
        'anchor=top': '$handle-edge-inset 0 auto 0',
        'anchor=bottom': 'auto 0 $handle-edge-inset 0',
      },
      width: {
        '': 'auto',
        horizontal: '1bw',
        'horizontal & (hovered | drag | focused)': '$handle-line-size',
      },
      height: {
        '': '1bw',
        'hovered | drag | focused': '$handle-line-size',
        horizontal: 'auto',
      },
      fill: {
        '': '#clear',
        'edge-line': '#border',
        'hovered | drag | focused': '#purple',
      },
      transition: {
        '': 'theme',
        drag: 'none',
      },
    },

    // A capsule on the line where nothing can hover (touch screens), as there
    // is no hover to reveal the edge before a drag.
    Grip: {
      position: 'absolute',
      hide: {
        '': true,
        '@media(hover: none)': false,
      },
      inset: {
        '': '50% auto auto $grip-inset',
        'anchor=right': '50% $grip-inset auto auto',
        'anchor=top': '$grip-inset auto auto 50%',
        'anchor=bottom': 'auto auto $grip-inset 50%',
      },
      transform: {
        '': 'translate(-50%, 0)',
        horizontal: 'translate(0, -50%)',
      },
      width: {
        '': '$grip-length',
        horizontal: '$grip-size',
      },
      height: {
        '': '$grip-size',
        horizontal: '$grip-length',
      },
      radius: 'round',
      fill: {
        '': '#dark-03',
        drag: '#purple',
      },
      // Device pixels, so the capsule stays crisp: its thickness and length,
      // a little larger while dragging.
      '$grip-size': {
        '': '4px',
        drag: '6px',
      },
      '$grip-length': {
        '': '24px',
        drag: '28px',
      },
      // Centred on the line; kept inside the box where the line is drawn
      // inside it, as an item beyond the box paints over anything past it.
      '$grip-inset': {
        '': '($handle-edge-inset + ($handle-line-size - $grip-size) / 2)',
        inward: '$handle-edge-inset',
      },
    },

    // A finger is less precise than a mouse pointer, so a coarse pointer gets
    // a wider target on the line, without moving the handle.
    TouchArea: {
      position: 'absolute',
      hide: {
        '': true,
        '@media(pointer: coarse)': false,
      },
      inset: {
        '': '0 auto 0 $touch-inset',
        'anchor=right': '0 $touch-inset 0 auto',
        'anchor=top': '$touch-inset 0 auto 0',
        'anchor=bottom': 'auto 0 $touch-inset 0',
      },
      width: {
        '': 'auto',
        horizontal: '$touch-size',
      },
      height: {
        '': '$touch-size',
        horizontal: 'auto',
      },
      // Device pixels: a touch target's size is a physical one.
      '$touch-size': '20px',
      // Centred on the line, or inside the box as the grip is.
      '$touch-inset': {
        '': '($handle-edge-inset + ($handle-line-size - $touch-size) / 2)',
        inward: '$handle-edge-inset',
      },
    },
  },
});

type Limit = 'min' | 'max';

export interface LayoutResizeHandleProps {
  /** The side of the handle the resized box is on. */
  side: Side;
  /**
   * The side of the handle the edge line keeps to; it thickens away from it.
   * The owner's styles set the line's distance from it, `$handle-edge-inset`.
   * Opposite `side`, the line is drawn inside the box, and so are the grip
   * and the touch target.
   */
  anchor: Side;
  /** Draw the edge at rest. Off where the box shows its own border there. */
  hasEdgeLine?: boolean;
  label: string;
  /** The id of the resized element. */
  controls?: string;
  /** The current size in pixels. */
  size: number;
  isDragging?: boolean;
  /** The smallest size in pixels, when it is known. */
  minSize?: number;
  /** The largest size in pixels, when it is known. */
  maxSize?: number;
  moveProps: ReturnType<typeof useMove>['moveProps'];
  /** Home and End: resize to the smallest or the largest size. */
  onJump?: (limit: Limit) => void;
  onDoubleClick?: () => void;
  onHoverChange?: (isHovered: boolean) => void;
  /** Whether the handle has keyboard focus. */
  onFocusChange?: (isFocusVisible: boolean) => void;
  qa?: string;
  /** The handle's box: size, position and transforms. */
  styles?: Styles;
  mods?: BasePropsWithoutChildren['mods'];
  tokens?: Tokens;
  'data-element'?: string;
}

export function LayoutResizeHandle(props: LayoutResizeHandleProps) {
  const {
    side,
    anchor,
    hasEdgeLine = false,
    label,
    controls,
    size,
    isDragging = false,
    minSize,
    maxSize,
    moveProps,
    onJump,
    onDoubleClick,
    onHoverChange,
    onFocusChange,
    qa,
    styles,
    mods,
    tokens,
    'data-element': dataElement,
  } = props;
  const isHorizontal = side === 'left' || side === 'right';
  const { hoverProps, isHovered } = useHover({ onHoverChange });
  const { focusProps, isFocusVisible } = useFocusRing();
  const localIsHovered = useDebouncedValue(isHovered, 150);

  // Keyboard focus only: a pointer that focuses the handle to drag it does
  // not count.
  const notifyFocusChange = useEffectEvent((isVisible: boolean) =>
    onFocusChange?.(isVisible),
  );

  useEffect(() => {
    notifyFocusChange(isFocusVisible);
  }, [isFocusVisible]);

  // The size drawn is held within the limits even while the stored one is
  // not, as CSS clamps it, where the minimum wins.
  const value = Math.round(
    Math.max(minSize ?? 0, Math.min(maxSize ?? Infinity, size)),
  );
  const limit: Limit | undefined =
    minSize != null && value <= minSize
      ? 'min'
      : maxSize != null && value >= maxSize
        ? 'max'
        : undefined;

  const onKeyDown = (event: KeyboardEvent) => {
    const target: Limit | undefined =
      event.key === 'Home' && minSize != null
        ? 'min'
        : event.key === 'End' && maxSize != null
          ? 'max'
          : undefined;

    if (!target || !onJump) return;

    event.preventDefault();
    onJump(target);
  };

  return (
    <ResizeHandleElement
      qa={qa}
      data-element={dataElement}
      styles={styles}
      tokens={tokens}
      {...mergeProps(
        hoverProps,
        // `mergeProps` chains handlers: `useMove` handles the arrow keys in
        // its own `onKeyDown`, which a plain prop would replace.
        focusProps,
        moveProps,
        {
          mods: {
            side,
            anchor,
            inward: anchor !== side,
            horizontal: isHorizontal,
            drag: isDragging,
            hovered: localIsHovered,
            focused: isFocusVisible,
            'edge-line': hasEdgeLine,
            limit,
            ...mods,
          },
          tabIndex: 0,
          role: 'separator',
          'aria-orientation': isHorizontal ? 'vertical' : 'horizontal',
          'aria-label': label,
          'aria-controls': controls,
          'aria-valuenow': value,
          'aria-valuemin': minSize,
          'aria-valuemax': maxSize,
          onKeyDown,
          onDoubleClick,
        },
      )}
    >
      <div data-element="TouchArea" />
      <div data-element="Line" />
      <div data-element="Grip" />
    </ResizeHandleElement>
  );
}
