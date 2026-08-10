import type { Collection, Key, Node } from '@react-types/shared';

/**
 * A `Collection<Node<T>>` over a plain row array.
 *
 * React Aria's selection primitives — `SelectionManager`, `useSelectableItem`,
 * `useSelectableCollection` — need a collection, but the only thing they ask of
 * it is key order and lookup. `useTableState` would build a `Node` per header
 * row, per column, per body row *and per cell*, which a table whose page size
 * goes to 500 (and whose "Load all results" removes the cap entirely) cannot
 * afford.
 *
 * So the array is the collection. Nodes are built lazily on `getItem` and
 * memoized, which means a 100k-row table allocates nodes only for the handful
 * of keys selection actually touches.
 */
export class RowCollection<T> implements Collection<Node<T>> {
  private rows: readonly T[];
  private keys: Key[];
  private indexByKey: Map<Key, number>;
  private nodeCache = new Map<Key, Node<T>>();
  private disabledKeys: Set<Key>;

  constructor(
    rows: readonly T[],
    getKey: (row: T, index: number) => Key,
    disabledKeys: Set<Key> = new Set(),
  ) {
    this.rows = rows;
    this.keys = rows.map(getKey);
    this.disabledKeys = disabledKeys;
    this.indexByKey = new Map();

    // A duplicate key would make selection ambiguous — two rows would answer to
    // the same identity. First occurrence wins, matching how React resolves a
    // duplicated `key`.
    this.keys.forEach((key, index) => {
      if (!this.indexByKey.has(key)) this.indexByKey.set(key, index);
    });
  }

  get size() {
    return this.rows.length;
  }

  getKeys() {
    return this.keys;
  }

  getItem(key: Key): Node<T> | null {
    const index = this.indexByKey.get(key);

    if (index == null) return null;

    const cached = this.nodeCache.get(key);

    if (cached) return cached;

    const node: Node<T> = {
      type: 'item',
      key,
      value: this.rows[index],
      level: 0,
      hasChildNodes: false,
      childNodes: [],
      rendered: null,
      textValue: '',
      index,
      // `SelectionManager` reads this to decide whether a key can be selected
      // at all, before `disabledBehavior` is even considered.
      'aria-label': undefined,
      parentKey: null,
      prevKey: index > 0 ? this.keys[index - 1] : null,
      nextKey: index < this.keys.length - 1 ? this.keys[index + 1] : null,
    } as Node<T>;

    this.nodeCache.set(key, node);

    return node;
  }

  at(index: number): Node<T> | null {
    const key = this.keys[index];

    return key == null ? null : this.getItem(key);
  }

  getKeyBefore(key: Key): Key | null {
    const index = this.indexByKey.get(key);

    return index == null || index === 0 ? null : this.keys[index - 1];
  }

  getKeyAfter(key: Key): Key | null {
    const index = this.indexByKey.get(key);

    return index == null || index >= this.keys.length - 1
      ? null
      : this.keys[index + 1];
  }

  getFirstKey(): Key | null {
    return this.keys[0] ?? null;
  }

  getLastKey(): Key | null {
    return this.keys[this.keys.length - 1] ?? null;
  }

  getChildren(): Iterable<Node<T>> {
    return [];
  }

  /** Not part of `Collection`, but selection asks about it constantly. */
  isDisabled(key: Key) {
    return this.disabledKeys.has(key);
  }

  indexOf(key: Key): number {
    return this.indexByKey.get(key) ?? -1;
  }

  *[Symbol.iterator](): Iterator<Node<T>> {
    for (const key of this.keys) {
      const node = this.getItem(key);

      if (node) yield node;
    }
  }
}
