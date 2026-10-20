import { useEffect } from 'react';

/**
 * Where focus has been lately, for an overlay that restores focus by hand.
 *
 * A `hideOnClose` overlay keeps its `FocusScope` mounted, so the scope's
 * restore-on-unmount never runs and `Dialog` restores focus itself. The element
 * focused when it opened is the target, but it can be gone by the close: a
 * menu item that opened the dialog leaves with its menu. React Aria then
 * restores to wherever the closed menu would have, the element focused before
 * it; this trail is how `Dialog` finds that element.
 *
 * Recorded only while an overlay that needs it is mounted.
 */
const MAX_LENGTH = 20;

let trail: Element[] = [];
let users = 0;

function onFocusIn(event: FocusEvent) {
  const target = event.target;

  if (!(target instanceof Element)) return;

  // Drop the target's earlier place, and anything that has left the document.
  trail = [
    ...trail.filter((node) => node !== target && node.isConnected),
    target,
  ].slice(-MAX_LENGTH);
}

function track() {
  if (users === 0) document.addEventListener('focusin', onFocusIn, true);

  users += 1;

  return () => {
    users -= 1;

    if (users > 0) return;

    document.removeEventListener('focusin', onFocusIn, true);
    trail = [];
  };
}

/** Record where focus goes while `isActive`. */
export function useFocusTrail(isActive: boolean) {
  useEffect(() => (isActive ? track() : undefined), [isActive]);
}

/** Recently focused elements, newest first. */
export function getFocusTrail(): Element[] {
  return [...trail].reverse();
}
