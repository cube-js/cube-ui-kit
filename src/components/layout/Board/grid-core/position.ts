/**
 * Resize direction math.
 *
 * Vendored and trimmed from react-grid-layout v2 (`src/core/position.ts`).
 * See ./NOTICE.md for attribution and license.
 *
 * Only the resize-direction helpers are kept; CSS style generation and the
 * PositionStrategy abstraction are handled by the UI Kit React layer via tasty.
 */

import type { Position, ResizeHandleAxis } from './types';

/** Constrain width to not overflow container. */
function constrainWidth(
  left: number,
  currentWidth: number,
  newWidth: number,
  containerWidth: number,
): number {
  return left + newWidth > containerWidth ? currentWidth : newWidth;
}

/** Constrain height to not go above container (negative top). */
function constrainHeight(
  top: number,
  currentHeight: number,
  newHeight: number,
): number {
  return top < 0 ? currentHeight : newHeight;
}

/** Constrain left to not be negative. */
function constrainLeft(left: number): number {
  return Math.max(0, left);
}

/** Constrain top to not be negative. */
function constrainTop(top: number): number {
  return Math.max(0, top);
}

type ResizeHandler = (
  currentSize: Position,
  newSize: Position,
  containerWidth: number,
) => Position;

const resizeNorth: ResizeHandler = (currentSize, newSize, _containerWidth) => {
  const { left, height, width } = newSize;
  const top = currentSize.top - (height - currentSize.height);

  return {
    left,
    width,
    height: constrainHeight(top, currentSize.height, height),
    top: constrainTop(top),
  };
};

const resizeEast: ResizeHandler = (currentSize, newSize, containerWidth) => {
  const { top, left, height, width } = newSize;
  return {
    top,
    height,
    width: constrainWidth(
      currentSize.left,
      currentSize.width,
      width,
      containerWidth,
    ),
    left: constrainLeft(left),
  };
};

const resizeWest: ResizeHandler = (currentSize, newSize, _containerWidth) => {
  const { top, height, width } = newSize;
  const left = currentSize.left + currentSize.width - width;

  if (left < 0) {
    return {
      height,
      width: currentSize.left + currentSize.width,
      top: constrainTop(top),
      left: 0,
    };
  }

  return {
    height,
    width,
    top: constrainTop(top),
    left,
  };
};

const resizeSouth: ResizeHandler = (currentSize, newSize, _containerWidth) => {
  const { top, left, height, width } = newSize;
  return {
    width,
    left,
    height: constrainHeight(top, currentSize.height, height),
    top: constrainTop(top),
  };
};

const resizeNorthEast: ResizeHandler = (currentSize, newSize, containerWidth) =>
  resizeNorth(
    currentSize,
    resizeEast(currentSize, newSize, containerWidth),
    containerWidth,
  );

const resizeNorthWest: ResizeHandler = (currentSize, newSize, containerWidth) =>
  resizeNorth(
    currentSize,
    resizeWest(currentSize, newSize, containerWidth),
    containerWidth,
  );

const resizeSouthEast: ResizeHandler = (currentSize, newSize, containerWidth) =>
  resizeSouth(
    currentSize,
    resizeEast(currentSize, newSize, containerWidth),
    containerWidth,
  );

const resizeSouthWest: ResizeHandler = (currentSize, newSize, containerWidth) =>
  resizeSouth(
    currentSize,
    resizeWest(currentSize, newSize, containerWidth),
    containerWidth,
  );

const resizeHandlerMap: Record<ResizeHandleAxis, ResizeHandler> = {
  n: resizeNorth,
  ne: resizeNorthEast,
  e: resizeEast,
  se: resizeSouthEast,
  s: resizeSouth,
  sw: resizeSouthWest,
  w: resizeWest,
  nw: resizeNorthWest,
};

/**
 * Resize an item in a specific direction, clamping to container bounds.
 *
 * Handles the logic of resizing from different edges/corners, ensuring the item
 * doesn't overflow the container.
 */
export function resizeItemInDirection(
  direction: ResizeHandleAxis,
  currentSize: Position,
  newSize: Position,
  containerWidth: number,
): Position {
  const handler = resizeHandlerMap[direction];

  if (!handler) {
    return newSize;
  }

  return handler(currentSize, { ...currentSize, ...newSize }, containerWidth);
}
