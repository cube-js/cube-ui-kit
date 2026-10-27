import type { KeyboardEvent } from 'react';

/**
 * A key event as it reaches a handler that may or may not have been wrapped by
 * React Aria's `useKeyboard`.
 */
type MaybeAugmentedKeyboardEvent = KeyboardEvent<any> & {
  continuePropagation?: () => void;
  isPropagationStopped?: () => boolean;
};

/**
 * Keys whose final handling belongs to the overlay around a control, not to
 * the control. `Escape` dismisses it (CUB-4839). `Tab` is how its `FocusScope`
 * keeps focus inside: React Aria contains focus from a `keydown` listener on
 * the document, so a `Tab` held here left a Dialog's first or last control
 * unable to wrap (CUB-5603).
 */
export const OVERLAY_KEYS = new Set(['Escape', 'Tab']);

/**
 * Let `Escape` and `Tab` keep travelling out of a trigger or list, and hold
 * every other key exactly as before.
 *
 * Every other key stays contained: releasing them too would let `Enter` and
 * typeahead reach ancestor shortcuts and form submits, which callers have
 * always had held here.
 *
 * Shape-aware because the same `onKeyDown` is reached two ways and the DEFAULT
 * is opposite between them:
 *
 * - Wrapped by `useKeyboard`, the event is augmented and propagation is
 *   stopped after the handler unless it opts out, decided per event. A
 *   handler that already opted out keeps every key except `Escape` and `Tab`
 *   contained here all the same, by re-asserting the stop.
 * - Spread straight onto an element, the event is an ordinary React one and
 *   propagation is the default, so containment is what has to be asked for.
 *
 * Getting this backwards is silent in one direction and loud in the other:
 * calling `stopPropagation()` on a plain event really does stop it.
 */
export function allowOverlayKeysToPropagate(
  event: MaybeAugmentedKeyboardEvent,
) {
  const isOverlayKey = OVERLAY_KEYS.has(event.key);

  if (typeof event.continuePropagation === 'function') {
    if (isOverlayKey) {
      event.continuePropagation();
    } else if (event.isPropagationStopped?.() === false) {
      // Only ever called when the flag is already clear, which is the one case
      // `stopPropagation` does not warn about.
      event.stopPropagation();
    }

    return;
  }

  if (!isOverlayKey) event.stopPropagation();
}

/**
 * Where `Escape` and `Tab` go from a field a user types into, once the field
 * and its caller's `onKeyDown` have both seen the key: a prevented one stops
 * at the field, any other goes on to the overlay around it. Other keys are
 * left as they are.
 *
 * Prevention is the signal because that is how the overlay reads it too: a
 * Dialog stays open on a prevented `Escape` (`useOverlayEscapeGuard`). React
 * Aria's `FocusScope` does not: it moves focus on every `Tab` that reaches it
 * and ignores `defaultPrevented`, so a `Tab` a field or caller takes over has
 * to stop here or focus moves anyway.
 *
 * Shape-aware like `allowOverlayKeysToPropagate`: an event wrapped by
 * `useKeyboard` stops unless released, a plain one travels unless stopped.
 * A key an IME is composing with is left as it is: it cancels or confirms
 * the composition, and the overlay ignores it anyway.
 */
export function settleOverlayKey(event: MaybeAugmentedKeyboardEvent) {
  if (!OVERLAY_KEYS.has(event.key) || event.nativeEvent.isComposing) return;

  const isAugmented = typeof event.continuePropagation === 'function';

  if (!event.isDefaultPrevented()) {
    if (isAugmented) event.continuePropagation!();
  } else if (!isAugmented || event.isPropagationStopped?.() === false) {
    // Only when the flag is clear, the one case `stopPropagation` does not
    // warn about on a wrapped event.
    event.stopPropagation();
  }
}

/**
 * A text field's `onKeyDown`, followed by `settleOverlayKey`. Without a
 * handler there is nothing to wrap: React Aria then leaves every key to
 * propagate, `Escape` and `Tab` included.
 */
export function withOverlayKeys<E extends MaybeAugmentedKeyboardEvent>(
  onKeyDown: ((event: E) => void) | undefined,
) {
  if (!onKeyDown) return undefined;

  return (event: E) => {
    onKeyDown(event);
    settleOverlayKey(event);
  };
}
