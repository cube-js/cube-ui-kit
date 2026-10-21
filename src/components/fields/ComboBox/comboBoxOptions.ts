import { Key } from '@react-types/shared';

import {
  getEdgeVisibleKey,
  ListStateLike,
  markKeyboardFocus,
} from '../ListBoxPopover/listNavigation';

/** An option the typed text can name. */
export interface ComboBoxOption {
  key: Key;
  textValue: string;
}

export interface CollectionLike {
  getItem: (key: Key) => { textValue?: string } | null | undefined;
}

type ListState = ListStateLike & { collection: CollectionLike };

/**
 * The text the input shows for `key`: its option's label, or the key itself
 * for a custom value or an option that has not loaded yet.
 */
export function getItemLabel(collection: CollectionLike, key: Key): string {
  return collection.getItem(key)?.textValue || String(key);
}

function getDataKey(item: unknown): Key | undefined {
  return (item as any)?.key ?? (item as any)?.id;
}

/**
 * `items` with the item keyed `key` moved to the front, or `items` itself when
 * there is no such item.
 */
export function sortSelectedFirst<T>(
  items: Iterable<T>,
  key: Key | null,
): Iterable<T> {
  if (!key) return items;

  const isSelected = (item: T) => {
    const itemKey = getDataKey(item);

    return itemKey != null && String(itemKey) === String(key);
  };
  const itemsArray = Array.isArray(items) ? items : Array.from(items);
  const selectedItem = itemsArray.find(isSelected);

  if (!selectedItem) return items;

  return [selectedItem, ...itemsArray.filter((item) => !isSelected(item))];
}

/** The options among (filtered) collection nodes, read through sections. */
export function collectOptions(nodes: Iterable<any>): ComboBoxOption[] {
  const options: ComboBoxOption[] = [];

  for (const node of nodes) {
    const children = node.type === 'section' ? (node.childNodes ?? []) : [node];

    for (const child of children) {
      if (child.type === 'item') {
        options.push({ key: child.key, textValue: child.textValue || '' });
      }
    }
  }

  return options;
}

/**
 * The option the typed text names, or `null` when it names none that can be
 * selected: the exact match, otherwise the only option the filter left. Among
 * options sharing the label, the selection wins, then an enabled one. A
 * disabled match names nothing, as it cannot be picked any other way either,
 * unless it is already the selection.
 */
export function findTypedOption(
  options: ComboBoxOption[],
  text: string,
  selectedKey: Key | null,
  disabledKeys: Set<Key>,
  isSameText: (textValue: string, text: string) => boolean,
): Key | null {
  const term = text.trim();

  if (!term) return null;

  const exactMatches = options.filter((option) =>
    isSameText(option.textValue, term),
  );
  const match =
    exactMatches.find((option) => option.key === selectedKey) ??
    exactMatches.find((option) => !disabledKeys.has(option.key)) ??
    exactMatches[0] ??
    (options.length === 1 ? options[0] : null);

  if (!match || (match.key !== selectedKey && disabledKeys.has(match.key))) {
    return null;
  }

  return match.key;
}

/**
 * The option the list should highlight: the one it already highlights while
 * the filter keeps it, otherwise the selection when shown, otherwise the first
 * enabled option.
 */
export function resolveHighlightedKey(
  listState: ListState,
  selectedKey: Key | null,
): Key | null {
  const { collection, selectionManager } = listState;
  const focusedKey = selectionManager.focusedKey;

  if (focusedKey != null && collection.getItem(focusedKey) != null) {
    return focusedKey;
  }

  if (selectedKey != null && collection.getItem(selectedKey) != null) {
    return selectedKey;
  }

  return getEdgeVisibleKey(listState, 'first');
}

/**
 * Moves the list's virtual focus to {@link resolveHighlightedKey}, scrolling it
 * into view, and returns that key. `null` while the list has not mounted or
 * has nothing to highlight.
 */
export function highlightOption(
  listState: ListState | null | undefined,
  selectedKey: Key | null,
): Key | null {
  if (!listState?.selectionManager || !listState.collection) return null;

  const key = resolveHighlightedKey(listState, selectedKey);

  markKeyboardFocus(listState);

  if (key != null && key !== listState.selectionManager.focusedKey) {
    listState.selectionManager.setFocusedKey(key);
  }

  return key;
}
