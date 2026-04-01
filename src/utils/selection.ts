import { Key } from 'react-aria';

/**
 * Deduplicate/toggle keys in a selection: if a key appears twice it is
 * removed (toggled off), otherwise it is kept (selected).
 */
export function processSelectionArray(iterable: Iterable<Key>): string[] {
  const resultSet = new Set<string>();
  for (const key of iterable) {
    const nKey = String(key);
    if (resultSet.has(nKey)) {
      resultSet.delete(nKey);
    } else {
      resultSet.add(nKey);
    }
  }
  return Array.from(resultSet);
}
