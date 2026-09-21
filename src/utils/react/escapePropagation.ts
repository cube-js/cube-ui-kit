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
 * Let `Escape` keep travelling out of a trigger or list, and hold every other
 * key exactly as before (CUB-4839).
 *
 * `Escape` is how whatever surrounds a control — a Dialog, most often — gets
 * dismissed, and these handlers never act on it. Every other key stays
 * contained: releasing them too would let `Enter` and typeahead reach ancestor
 * shortcuts and form submits, which callers have always had held here.
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
export function allowEscapeToPropagate(event: MaybeAugmentedKeyboardEvent) {
  const isEscape = event.key === 'Escape';

  if (typeof event.continuePropagation === 'function') {
    if (isEscape) {
      event.continuePropagation();
    } else if (event.isPropagationStopped?.() === false) {
      // Only ever called when the flag is already clear, which is the one case
      // `stopPropagation` does not warn about.
      event.stopPropagation();
    }

    return;
  }

  if (!isEscape) event.stopPropagation();
}
