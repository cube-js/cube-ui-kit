/**
 * Trusted touch input for the browser suite (`*.browser.test.tsx` only: it
 * drives Chromium through CDP, which jsdom has no equivalent of).
 *
 * Chromium's touch emulation turns these into real pointer events, but its
 * gesture recognizer reads every touch as a tap: a long hold fires neither the
 * `contextmenu` Android would nor a long-press gesture, and still ends in a
 * `click`. So a held touch here behaves like iOS plus a late click.
 */
import { act } from '@testing-library/react';
import { cdp } from 'vitest/browser';

export interface Point {
  x: number;
  y: number;
}

/**
 * A point inside `element`, `inset` px from its leading edge and halfway down:
 * on the label rather than on actions at the trailing end.
 */
export function pointIn(element: Element, inset = 40): Point {
  const rect = element.getBoundingClientRect();

  return { x: rect.left + inset, y: rect.top + rect.height / 2 };
}

/** Chromium's coordinates for a point in the test iframe, which Vitest can scale. */
export function nativePosition(x: number, y: number): Point {
  const frame = window.frameElement as HTMLElement | null;
  const bounds = frame?.getBoundingClientRect();
  const scaleX = bounds && frame ? bounds.width / frame.offsetWidth : 1;
  const scaleY = bounds && frame ? bounds.height / frame.offsetHeight : 1;

  return {
    x: (bounds?.left ?? 0) + (x + (frame?.clientLeft ?? 0)) * scaleX,
    y: (bounds?.top ?? 0) + (y + (frame?.clientTop ?? 0)) * scaleY,
  };
}

/** Turns touch emulation on for each test of the calling `describe`. */
export function useTouchEmulation() {
  beforeEach(async () => {
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true });
  });

  afterEach(async () => {
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
  });
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Puts a finger down at `point`, holds it for `ms`, and lifts it. `during`
 * runs while the finger is still down, after the hold.
 */
export async function touchHold(
  point: Point,
  ms: number,
  during?: () => void | Promise<void>,
) {
  await act(async () => {
    await cdp().send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [nativePosition(point.x, point.y)],
    });
    await wait(ms);
    await during?.();
    await cdp().send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    // Let the click that Chromium sends after the lift arrive.
    await wait(50);
  });
}

/** Moves the finger `touchHold` holds down to `point`: call it in `during`. */
export async function touchMove(point: Point) {
  await cdp().send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [nativePosition(point.x, point.y)],
  });
}
