import type { DisabledBehavior } from '@react-types/shared';

/**
 * How a collection's React Stately state treats its disabled items.
 *
 * A disabled item stays focusable (`'selection'`), as WAI-ARIA keeps a
 * disabled item of a composite widget reachable, so a keyboard or screen
 * reader user hears it and why it is unavailable. The selection manager then
 * no longer reports it as disabled, so the component reads that from the
 * collection and keeps the item inert itself. A disabled collection keeps
 * every item out of the keyboard (`'all'`), as a disabled field does.
 */
export function getDisabledBehavior(
  isCollectionDisabled: boolean | undefined,
): DisabledBehavior {
  return isCollectionDisabled ? 'all' : 'selection';
}
