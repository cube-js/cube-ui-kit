import type { Key } from '@react-types/shared';

export interface TableTreeNode<T> {
  key: Key;
  row: T;
  parentKey: Key | null;
  level: number;
  siblingIndex: number;
  siblingCount: number;
  sourceIndex: number;
  children: TableTreeNode<T>[];
}

export interface TableTreeModel<T> {
  roots: TableTreeNode<T>[];
  byKey: Map<Key, TableTreeNode<T>>;
  parentOf: Map<Key, Key | null>;
  childrenOf: Map<Key, Key[]>;
  duplicateKeys: Key[];
  cyclicKeys: Key[];
}

/** Build identity and parent/child indexes without modifying consumer rows. */
export function buildTableTree<T>(
  rows: readonly T[],
  getChildren: (row: T) => readonly T[] | undefined,
  getKey: (row: T, sourceIndex: number) => Key,
): TableTreeModel<T> {
  const byKey = new Map<Key, TableTreeNode<T>>();
  const parentOf = new Map<Key, Key | null>();
  const childrenOf = new Map<Key, Key[]>();
  const duplicateKeys: Key[] = [];
  const cyclicKeys: Key[] = [];
  const visiting = new Set<Key>();
  const visitingRows = new Set<T>();
  let sourceIndex = 0;

  const visit = (
    input: readonly T[],
    parentKey: Key | null,
    level: number,
  ): TableTreeNode<T>[] => {
    const output: TableTreeNode<T>[] = [];

    input.forEach((row, siblingIndex) => {
      const currentSourceIndex = sourceIndex++;
      const key = getKey(row, currentSourceIndex);

      if (visiting.has(key) || visitingRows.has(row)) {
        cyclicKeys.push(key);
        return;
      }

      if (byKey.has(key)) {
        duplicateKeys.push(key);
        return;
      }

      const node: TableTreeNode<T> = {
        key,
        row,
        parentKey,
        level,
        siblingIndex,
        siblingCount: input.length,
        sourceIndex: currentSourceIndex,
        children: [],
      };

      byKey.set(key, node);
      parentOf.set(key, parentKey);
      visiting.add(key);
      visitingRows.add(row);
      node.children = visit(getChildren(row) ?? [], key, level + 1);
      visiting.delete(key);
      visitingRows.delete(row);
      childrenOf.set(
        key,
        node.children.map((child) => child.key),
      );
      output.push(node);
    });

    return output;
  };

  const roots = visit(rows, null, 0);

  return {
    roots,
    byKey,
    parentOf,
    childrenOf,
    duplicateKeys,
    cyclicKeys,
  };
}

export function sortTableTree<T>(
  nodes: readonly TableTreeNode<T>[],
  compare: (a: TableTreeNode<T>, b: TableTreeNode<T>) => number,
): TableTreeNode<T>[] {
  const sorted = nodes
    .map((node) => ({
      ...node,
      children: sortTableTree(node.children, compare),
    }))
    .sort(compare);

  return sorted.map((node, siblingIndex) => ({
    ...node,
    siblingIndex,
    siblingCount: sorted.length,
  }));
}

export interface FilteredTableTree<T> {
  roots: TableTreeNode<T>[];
  forcedExpandedKeys: Set<Key>;
}

/**
 * Keep matching rows, their ancestor paths, and the complete subtree of a row
 * that matches itself. Every retained branch is opened while filtering so a
 * match can never remain hidden behind a collapsed ancestor.
 */
export function filterTableTree<T>(
  nodes: readonly TableTreeNode<T>[],
  matches: (node: TableTreeNode<T>) => boolean,
): FilteredTableTree<T> {
  const forcedExpandedKeys = new Set<Key>();

  const cloneComplete = (node: TableTreeNode<T>): TableTreeNode<T> => {
    const children = node.children.map(cloneComplete);
    if (children.length) forcedExpandedKeys.add(node.key);

    return { ...node, children: reindexTableTree(children) };
  };

  const visit = (node: TableTreeNode<T>): TableTreeNode<T> | null => {
    if (matches(node)) return cloneComplete(node);

    const children = node.children
      .map(visit)
      .filter((child): child is TableTreeNode<T> => child != null);

    if (!children.length) return null;

    forcedExpandedKeys.add(node.key);
    return { ...node, children: reindexTableTree(children) };
  };

  return {
    roots: reindexTableTree(
      nodes.map(visit).filter((node): node is TableTreeNode<T> => node != null),
    ),
    forcedExpandedKeys,
  };
}

/** Re-number a transformed sibling collection for its rendered treegrid. */
export function reindexTableTree<T>(
  nodes: readonly TableTreeNode<T>[],
): TableTreeNode<T>[] {
  return nodes.map((node, siblingIndex) => ({
    ...node,
    siblingIndex,
    siblingCount: nodes.length,
    children: reindexTableTree(node.children),
  }));
}

export function flattenTableTree<T>(
  nodes: readonly TableTreeNode<T>[],
  expandedKeys?: ReadonlySet<Key>,
): TableTreeNode<T>[] {
  const output: TableTreeNode<T>[] = [];

  const visit = (items: readonly TableTreeNode<T>[]) => {
    for (const node of items) {
      output.push(node);
      if (expandedKeys == null || expandedKeys.has(node.key)) {
        visit(node.children);
      }
    }
  };

  visit(nodes);
  return output;
}

export function tableTreeDescendantKeys<T>(node: TableTreeNode<T>): Key[] {
  return flattenTableTree(node.children).map((child) => child.key);
}

export function isTableTreeDescendant<T>(
  model: Pick<TableTreeModel<T>, 'parentOf'>,
  possibleDescendant: Key,
  ancestor: Key,
) {
  let parent = model.parentOf.get(possibleDescendant);

  while (parent != null) {
    if (parent === ancestor) return true;
    parent = model.parentOf.get(parent);
  }

  return false;
}
