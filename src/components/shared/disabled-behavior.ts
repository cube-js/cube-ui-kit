import type {
  DisabledBehavior,
  Key,
  SelectionBehavior,
} from '@react-types/shared';

/**
 * How a collection's React Stately state treats its disabled items.
 *
 * A disabled item stays focusable (`'selection'`), as WAI-ARIA keeps a
 * disabled item of a composite widget reachable, so a keyboard or screen
 * reader user hears it and why it is unavailable. The selection manager then
 * no longer reports it as disabled, so the component asks `isItemDisabled`
 * and keeps the item inert itself. A disabled collection keeps every item out
 * of the keyboard (`'all'`), as a disabled field does. So does a collection
 * where focus selects (`selectionBehavior: 'replace'`): focusing a disabled
 * item would clear the selection.
 */
export function getDisabledBehavior(
  isCollectionDisabled: boolean | undefined,
  selectionBehavior?: SelectionBehavior,
): DisabledBehavior {
  return isCollectionDisabled || selectionBehavior === 'replace'
    ? 'all'
    : 'selection';
}

/** The parts of a collection state that say which items are disabled. */
export interface DisabledItemsState {
  disabledKeys?: Set<Key>;
  collection: object;
}

/**
 * Whether an item is disabled: listed in `disabledKeys` or marked with its own
 * `isDisabled`. Under `disabledBehavior: 'selection'` React Aria's
 * `selectionManager.isDisabled` no longer says so (see `getDisabledBehavior`).
 */
export function isItemDisabled(state: DisabledItemsState, key: Key): boolean {
  const collection = state.collection as {
    getItem?: (key: Key) => { props?: { isDisabled?: unknown } } | null;
  };

  return (
    !!state.disabledKeys?.has(key) ||
    !!collection.getItem?.(key)?.props?.isDisabled
  );
}
