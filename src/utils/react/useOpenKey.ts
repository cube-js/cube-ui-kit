import { useState } from 'react';

/**
 * A key that changes every time `isOpen` turns true. Put it on an overlay's
 * contents so that every opening mounts them afresh.
 *
 * A closed overlay stays mounted while it plays its exit, and reopened inside
 * that window it shows the same contents again rather than new ones. Whatever
 * runs only as they mount then does not run for that opening: React Aria's
 * `autoFocus`, a `FocusScope`'s `autoFocus`, a mount effect. Focus stayed on
 * the trigger, and the `Escape` meant for the overlay went nowhere (CUB-8552).
 * With this key, a reopen during the exit is an opening like any other.
 *
 * The key does not change on close, so the exit plays the contents it closed
 * with.
 */
export function useOpenKey(isOpen: boolean): number {
  const [opening, setOpening] = useState({ isOpen, key: 0 });

  if (opening.isOpen !== isOpen) {
    const next = { isOpen, key: isOpen ? opening.key + 1 : opening.key };

    setOpening(next);

    return next.key;
  }

  return opening.key;
}
