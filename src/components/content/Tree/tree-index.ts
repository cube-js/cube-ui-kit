import type { CubeTreeNodeData } from './types';

/**
 * Map of `key -> { node, parentKey, childKeys }` for fast cascading lookups.
 *
 * Built from the public `treeData` rather than from React Stately's
 * collection, because we need the consumer's original (controlled)
 * shape to derive parent/child relationships and to call back with the
 * actual `node` objects.
 *
 * Shared between `Tree.tsx` (for `nodesByKey` / `parentOf`) and
 * `useCheckboxTree` (cascading checked state) so a single tree walk
 * powers all three maps.
 */
export interface TreeIndex {
  byKey: Map<string, CubeTreeNodeData>;
  parentOf: Map<string, string | null>;
  childrenOf: Map<string, string[]>;
}

/**
 * A node's plain-text label: its `textValue`, else its `title` when that
 * is a string, else its key.
 */
export function getTreeNodeText(node: CubeTreeNodeData): string {
  if (node.textValue != null) return node.textValue;
  return typeof node.title === 'string' ? node.title : node.key;
}

export function buildTreeIndex(treeData: CubeTreeNodeData[]): TreeIndex {
  const byKey = new Map<string, CubeTreeNodeData>();
  const parentOf = new Map<string, string | null>();
  const childrenOf = new Map<string, string[]>();

  const visit = (nodes: CubeTreeNodeData[], parent: string | null) => {
    for (const node of nodes) {
      byKey.set(node.key, node);
      parentOf.set(node.key, parent);
      const childKeys = (node.children ?? []).map((c) => c.key);
      childrenOf.set(node.key, childKeys);
      if (node.children) {
        visit(node.children, node.key);
      }
    }
  };

  visit(treeData, null);

  return { byKey, parentOf, childrenOf };
}
