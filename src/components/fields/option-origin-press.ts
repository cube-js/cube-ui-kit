import type { SelectionManager } from '@react-stately/selection';
import type { Key } from '@react-types/shared';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

/**
 * A mouse press on a list option, from pointer down until the pointer is
 * released anywhere in the window.
 */
interface OriginPress {
  element: HTMLElement;
  key: Key;
  manager: SelectionManager;
  /** The option's box when the press started. */
  rect: DOMRect;
  /** Escape, another key or a pointer cancel ended the press early. */
  isCancelled: boolean;
}

// One mouse press at a time, so one record serves every list on the page.
let activePress: OriginPress | null = null;

function isInside(rect: DOMRect, event: PointerEvent) {
  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}

function cancelPress() {
  if (activePress) activePress.isCancelled = true;
}

function forgetPress() {
  activePress = null;
  window.removeEventListener('pointerup', settleOnRelease, true);
  window.removeEventListener('pointerup', forgetPress);
  window.removeEventListener('pointercancel', cancelPress, true);
  window.removeEventListener('keydown', cancelPress, true);
}

// Capture phase, before React and the options' own press handling. When the
// list moved under the pointer (it was still opening, or scrolled while
// closing), the option the press started on may no longer be under it. Select
// that option here if the pointer comes up inside the box it had when the
// press started.
function settleOnRelease(event: PointerEvent) {
  const press = activePress;

  if (!press || press.isCancelled || event.button !== 0) return;

  const target = event.target instanceof Node ? event.target : null;

  // Released on the option itself: React Aria selects it as usual.
  if ((target && press.element.contains(target)) || !press.element.isConnected)
    return;

  if (isInside(press.rect, event) && press.manager.canSelectItem(press.key)) {
    press.manager.select(press.key, event);
  }
}

/**
 * Makes a mouse press on a list option pick the option it started on.
 *
 * The lists select on press up, so that a press that opened a picker can end
 * on an option. React Aria then selects whichever option the pointer is
 * released over, or none when the press must end where it started. If the
 * list moves between press and release (it is still animating in, or scrolls
 * while closing), the release lands on a neighbour or on nothing. With this
 * hook a mouse press selects the option it started on when the pointer comes
 * up inside that option's original box. Released elsewhere, or after Escape,
 * any other key or a pointer cancel, it selects nothing.
 *
 * Put `onPointerDown` on the option element and wrap the option's own
 * `onPointerUp` with `wrapPointerUp`, which ignores a release over an option
 * other than the one pressed.
 */
export function useOptionOriginPress(options: {
  key: Key;
  ref: RefObject<HTMLElement | null>;
  manager: SelectionManager;
  isDisabled?: boolean;
}) {
  const { key, ref, manager, isDisabled } = options;

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const element = ref.current;

    forgetPress();

    if (
      isDisabled ||
      !element ||
      event.pointerType !== 'mouse' ||
      event.button !== 0
    ) {
      return;
    }

    activePress = {
      element,
      key,
      manager,
      rect: element.getBoundingClientRect(),
      isCancelled: false,
    };

    window.addEventListener('pointerup', settleOnRelease, true);
    // Bubble phase: after every option has seen the release.
    window.addEventListener('pointerup', forgetPress);
    window.addEventListener('pointercancel', cancelPress, true);
    window.addEventListener('keydown', cancelPress, true);
  };

  const wrapPointerUp =
    <E extends ReactPointerEvent<HTMLElement>>(
      handler: ((event: E) => void) | undefined,
    ) =>
    (event: E) => {
      // The press started on another option, or was cancelled: this release
      // doesn't pick anything.
      if (
        activePress &&
        (activePress.isCancelled || activePress.element !== ref.current)
      ) {
        return;
      }

      handler?.(event);
    };

  return { onPointerDown, wrapPointerUp };
}
