import type { Key } from '@react-types/shared';

/**
 * The DOM id of the option with `key` in the listbox whose id is `listBoxId`,
 * for the `aria-activedescendant` of an input that drives the list with virtual
 * focus. React Aria's `useOption` assigns it, and `react-aria` does not
 * re-export its `getItemId`, so this mirrors that format: the listbox id, then
 * `-option-`, then the key with whitespace removed.
 */
export function getListBoxOptionId(listBoxId: string, key: Key): string {
  const normalizedKey =
    typeof key === 'string' ? key.replace(/\s*/g, '') : String(key);

  return `${listBoxId}-option-${normalizedKey}`;
}
