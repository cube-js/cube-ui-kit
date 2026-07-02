import { Key } from '@react-types/shared';

/**
 * Minimal view of a React Stately list state. Kept structural (no imports from
 * `react-stately`) so the helpers can be used from any collection-backed
 * component without dragging extra types in.
 */
export interface ListStateLike {
  selectionManager: {
    focusedKey: Key | null;
    setFocusedKey: (key: Key | null) => void;
  };
  collection: Iterable<any>;
  disabledKeys?: Set<Key>;
  lastFocusSourceRef?: { current: 'keyboard' | 'mouse' | 'other' };
}

export type NavigationDirection = 1 | -1;
export type NavigationEdge = 'first' | 'last';

/**
 * Walks a collection (possibly nested under sections) and collects the keys of
 * selectable items, skipping disabled ones. Mirrors the inline walker that
 * used to live in `useComboBoxKeyboard`.
 */
export function collectVisibleKeys(
  nodes: Iterable<any>,
  out: Key[],
  disabledKeys?: Set<Key>,
): void {
  for (const node of nodes) {
    if (node.type === 'item') {
      if (!disabledKeys?.has(node.key)) {
        out.push(node.key);
      }
    } else if (node.childNodes) {
      collectVisibleKeys(node.childNodes, out, disabledKeys);
    }
  }
}

/** Convenience: returns the flat list of selectable keys for a list state. */
export function getVisibleKeys(listState: ListStateLike): Key[] {
  const keys: Key[] = [];
  collectVisibleKeys(
    listState.collection,
    keys,
    listState.disabledKeys as Set<Key> | undefined,
  );
  return keys;
}

/**
 * Computes the next key to focus when navigating with ArrowUp/ArrowDown.
 *
 * - If `fromKey` is omitted, reads `selectionManager.focusedKey`.
 * - When nothing is focused (or the focused key is no longer visible), falls
 *   back to the first/last visible key depending on `direction`.
 * - When the current key is the boundary, either returns `null` (default) or
 *   wraps to the opposite edge when `opts.wrap` is true.
 */
export function getNextVisibleKey(
  listState: ListStateLike,
  direction: NavigationDirection,
  opts?: { wrap?: boolean; fromKey?: Key | null },
): Key | null {
  const visibleKeys = getVisibleKeys(listState);
  if (visibleKeys.length === 0) return null;

  const isForward = direction === 1;
  const currentKey = opts?.fromKey ?? listState.selectionManager.focusedKey;

  if (currentKey == null) {
    return isForward ? visibleKeys[0] : visibleKeys[visibleKeys.length - 1];
  }

  const currentIndex = visibleKeys.indexOf(currentKey);

  if (currentIndex === -1) {
    // Focused item was filtered out — restart from the matching edge.
    return isForward ? visibleKeys[0] : visibleKeys[visibleKeys.length - 1];
  }

  const newIndex = currentIndex + direction;
  if (newIndex >= 0 && newIndex < visibleKeys.length) {
    return visibleKeys[newIndex];
  }

  if (opts?.wrap) {
    return isForward ? visibleKeys[0] : visibleKeys[visibleKeys.length - 1];
  }

  return null;
}

/** Returns the first or last selectable key. */
export function getEdgeVisibleKey(
  listState: ListStateLike,
  edge: NavigationEdge,
): Key | null {
  const visibleKeys = getVisibleKeys(listState);
  if (visibleKeys.length === 0) return null;
  return edge === 'first'
    ? visibleKeys[0]
    : visibleKeys[visibleKeys.length - 1];
}

/**
 * Marks a focus change as keyboard-driven so the underlying ListBox scrolls the
 * highlighted option into view. No-op when the list state doesn't expose a
 * `lastFocusSourceRef`.
 */
export function markKeyboardFocus(listState: ListStateLike): void {
  if (listState.lastFocusSourceRef) {
    listState.lastFocusSourceRef.current = 'keyboard';
  }
}

export type TextFilterFn = (textValue: string, inputValue: string) => boolean;

/** Options controlling how {@link filterCollectionNodes} matches nodes. */
export interface FilterCollectionOptions {
  /**
   * Also match against a node's plain-text `children` and `description` props
   * in addition to its `textValue`. Defaults to `false` so the search stays
   * consistent with the visible `textValue` (which is what components like
   * ComboBox document). Components that surface `children`/`description` in the
   * option list (e.g. CommandTextArea) can opt in.
   */
  matchExtraFields?: boolean;
}

/**
 * Collects the strings a node can be matched against. Always includes the
 * node's `textValue`; when `matchExtraFields` is set, also includes any
 * plain-text `children` and `description` props. Non-string children/description
 * (e.g. React elements) are ignored since we can't reliably read their text.
 */
function getSearchableStrings(node: any, matchExtraFields: boolean): string[] {
  const strings: string[] = [];

  if (node.textValue) {
    strings.push(node.textValue);
  }

  if (matchExtraFields) {
    const props = node.props;
    if (props) {
      if (typeof props.children === 'string') {
        strings.push(props.children);
      }
      if (typeof props.description === 'string') {
        strings.push(props.description);
      }
    }
  }

  return strings.length > 0 ? strings : [node.textValue || ''];
}

/** True when the term matches any of the node's searchable strings. */
function nodeMatchesTerm(
  node: any,
  term: string,
  textFilterFn: TextFilterFn,
  matchExtraFields: boolean,
): boolean {
  return getSearchableStrings(node, matchExtraFields).some((text) =>
    textFilterFn(text, term),
  );
}

/**
 * Filters collection nodes by a search term while preserving section structure.
 * By default a node matches only when the term matches its `textValue`; pass
 * `{ matchExtraFields: true }` to also match its plain-text `children` and
 * `description`. Sections whose children all fail the filter are dropped.
 */
export function filterCollectionNodes(
  nodes: Iterable<any>,
  term: string,
  textFilterFn: TextFilterFn,
  options: FilterCollectionOptions = {},
): Iterable<any> {
  if (!term) {
    return nodes;
  }

  const matchExtraFields = options.matchExtraFields ?? false;

  return [...nodes]
    .map((node: any) => {
      if (node.type === 'section' && node.childNodes) {
        const filteredChildren = [...node.childNodes].filter((child: any) =>
          nodeMatchesTerm(child, term, textFilterFn, matchExtraFields),
        );

        if (filteredChildren.length === 0) {
          return null;
        }

        return {
          ...node,
          childNodes: filteredChildren,
          hasChildNodes: true,
        };
      }

      return nodeMatchesTerm(node, term, textFilterFn, matchExtraFields)
        ? node
        : null;
    })
    .filter(Boolean);
}
