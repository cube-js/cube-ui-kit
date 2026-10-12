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
const OVERLAY_KEYS = new Set(['Escape', 'Tab']);

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
 *   stopped unless the handler opts out. `createEventHandler` also keeps that
 *   decision for the LIFE of the handler rather than per event — nothing
 *   resets it when the next key arrives — so an earlier opt-out would keep
 *   releasing later keys until a render replaced the handler. Re-asserting the
 *   default here is what keeps the opt-out from outliving its own event.
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
