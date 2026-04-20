import { useMemo, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';

import type { Key } from '@react-types/shared';
import type { CubeTreeNodeData, TreeOnCheckInfo } from './types';

export interface UseCheckboxTreeOptions {
  treeData: CubeTreeNodeData[];
  isCheckable: boolean;
  defaultCheckedKeys?: string[];
  /** Either an array (AntD's default) or `{ checked, halfChecked }`. */
  checkedKeys?: string[] | { checked: string[]; halfChecked?: string[] };
  onCheck?: (
    checked: Key[] | { checked: Key[]; halfChecked: Key[] },
    info: TreeOnCheckInfo,
  ) => void;
}

export interface CheckboxTree {
  /** Set of keys that are fully checked. */
  checkedSet: Set<string>;
  /** Set of keys that are in the indeterminate (half-checked) state. */
  halfCheckedSet: Set<string>;
  /** Toggle a key, propagating to descendants and updating ancestors. */
  toggle: (key: string) => void;
}

/**
 * Map of `key -> { node, parentKey, childKeys }` for fast cascading lookups.
 *
 * Built from the public `treeData` rather than from React Stately's
 * collection, because we need the consumer's original (controlled)
 * shape to derive parent/child relationships and to call back with the
 * actual `node` objects in `onCheck`'s `info`.
 */
interface NodeIndex {
  byKey: Map<string, CubeTreeNodeData>;
  parentOf: Map<string, string | null>;
  childrenOf: Map<string, string[]>;
}

function buildIndex(treeData: CubeTreeNodeData[]): NodeIndex {
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

/**
 * Returns whether a node should be checkable (i.e. clicking the
 * checkbox should affect it).
 *
 * Skips:
 * - explicitly disabled nodes (`isDisabled === true`)
 * - explicitly disabled checkboxes (`isCheckboxDisabled === true`)
 * - nodes that opted out via `isCheckable === false`
 */
function isNodeEligible(node: CubeTreeNodeData | undefined): boolean {
  if (!node) return false;
  if (node.isDisabled) return false;
  if (node.isCheckboxDisabled) return false;
  if (node.isCheckable === false) return false;
  return true;
}

function normalizeControlledChecked(
  controlled: UseCheckboxTreeOptions['checkedKeys'],
): { checked: Set<string>; halfChecked: Set<string> } | null {
  if (controlled == null) return null;
  if (Array.isArray(controlled)) {
    return {
      checked: new Set(controlled),
      halfChecked: new Set(),
    };
  }
  return {
    checked: new Set(controlled.checked ?? []),
    halfChecked: new Set(controlled.halfChecked ?? []),
  };
}

/**
 * Local hook implementing AntD-style cascading checkbox state.
 *
 * - `checked` and `halfChecked` are always derived together from a single
 *   `checked` set (the source of truth) so callers don't need to track
 *   indeterminate keys themselves.
 * - When the consumer passes `checkedKeys` as `{ checked, halfChecked }`,
 *   we keep the wire shape on the way out — same as AntD.
 * - Toggling a node propagates *down* (skipping ineligible descendants)
 *   and recomputes ancestors *up* in a single pass.
 */
export function useCheckboxTree(opts: UseCheckboxTreeOptions): CheckboxTree {
  const { treeData, isCheckable, defaultCheckedKeys, checkedKeys, onCheck } =
    opts;

  const index = useMemo(() => buildIndex(treeData), [treeData]);

  const controlled = normalizeControlledChecked(checkedKeys);
  const isControlled = controlled != null;
  const wantsObjectShape = checkedKeys != null && !Array.isArray(checkedKeys);

  const [uncontrolledChecked, setUncontrolledChecked] = useState<Set<string>>(
    () => new Set(defaultCheckedKeys ?? []),
  );

  const sourceChecked = isControlled
    ? controlled!.checked
    : uncontrolledChecked;

  /**
   * Derive `{ checked, halfChecked }` from the source-of-truth `checked` set
   * by walking the tree bottom-up:
   *
   * - A parent is considered fully checked iff every eligible descendant
   *   leaf is checked.
   * - A parent is half-checked iff at least one eligible descendant is
   *   checked or half-checked, but not all.
   *
   * Ineligible nodes (disabled / opt-out) are ignored when computing the
   * parent's state — they neither force a parent into the unchecked nor
   * half state.
   */
  const { checkedSet, halfCheckedSet } = useMemo(() => {
    if (!isCheckable) {
      return {
        checkedSet: new Set<string>(),
        halfCheckedSet: new Set<string>(),
      };
    }

    if (isControlled) {
      return {
        checkedSet: new Set(sourceChecked),
        halfCheckedSet: new Set(controlled!.halfChecked),
      };
    }

    const checked = new Set(sourceChecked);
    const half = new Set<string>();

    const visit = (
      node: CubeTreeNodeData,
    ): { allChecked: boolean; anyChecked: boolean; anyEligible: boolean } => {
      const childKeys = index.childrenOf.get(node.key) ?? [];

      if (childKeys.length === 0) {
        const eligible = isNodeEligible(node);
        const isChecked = checked.has(node.key);
        return {
          allChecked: !eligible || isChecked,
          anyChecked: isChecked,
          anyEligible: eligible,
        };
      }

      let allChecked = true;
      let anyChecked = false;
      let anyEligible = false;

      for (const childKey of childKeys) {
        const child = index.byKey.get(childKey);
        if (!child) continue;
        const r = visit(child);
        if (r.anyEligible) anyEligible = true;
        if (!r.allChecked) allChecked = false;
        if (r.anyChecked) anyChecked = true;
      }

      const eligible = isNodeEligible(node);

      if (anyEligible && allChecked) {
        checked.add(node.key);
        half.delete(node.key);
      } else if (anyChecked || half.has(node.key)) {
        checked.delete(node.key);
        half.add(node.key);
      } else {
        checked.delete(node.key);
      }

      return {
        allChecked: !eligible
          ? allChecked
          : checked.has(node.key) && allChecked,
        anyChecked: anyChecked || checked.has(node.key),
        anyEligible: anyEligible || eligible,
      };
    };

    for (const root of treeData) {
      visit(root);
    }

    return { checkedSet: checked, halfCheckedSet: half };
  }, [isCheckable, isControlled, sourceChecked, controlled, treeData, index]);

  const toggle = useEvent((key: string) => {
    const node = index.byKey.get(key);
    if (!node || !isNodeEligible(node)) return;

    const isCurrentlyChecked = checkedSet.has(key);
    const willCheck = !isCurrentlyChecked;

    const next = new Set(sourceChecked);

    const apply = (n: CubeTreeNodeData, value: boolean) => {
      if (!isNodeEligible(n)) return;
      if (value) next.add(n.key);
      else next.delete(n.key);
      const childKeys = index.childrenOf.get(n.key) ?? [];
      for (const ck of childKeys) {
        const child = index.byKey.get(ck);
        if (child) apply(child, value);
      }
    };

    apply(node, willCheck);

    /**
     * After the cascade, recompute ancestors so the public `checked` set
     * doesn't carry parent keys that should be half-checked instead.
     * Ancestors of `key` get visited bottom-up here.
     */
    let parentKey = index.parentOf.get(key);
    while (parentKey) {
      const parent = index.byKey.get(parentKey);
      if (!parent) break;
      const childKeys = index.childrenOf.get(parentKey) ?? [];
      let allEligibleChecked = true;
      let anyEligible = false;
      for (const ck of childKeys) {
        const child = index.byKey.get(ck);
        if (!child) continue;
        if (!isNodeEligible(child)) continue;
        anyEligible = true;
        if (!next.has(ck)) {
          allEligibleChecked = false;
          break;
        }
      }
      if (anyEligible && allEligibleChecked && isNodeEligible(parent)) {
        next.add(parentKey);
      } else {
        next.delete(parentKey);
      }
      parentKey = index.parentOf.get(parentKey);
    }

    if (!isControlled) {
      setUncontrolledChecked(next);
    }

    if (onCheck) {
      const finalChecked = new Set(next);
      const finalHalf = new Set<string>();

      const recompute = (
        n: CubeTreeNodeData,
      ): {
        allChecked: boolean;
        anyChecked: boolean;
        anyEligible: boolean;
      } => {
        const childKeys = index.childrenOf.get(n.key) ?? [];
        if (childKeys.length === 0) {
          const eligible = isNodeEligible(n);
          const isChecked = finalChecked.has(n.key);
          return {
            allChecked: !eligible || isChecked,
            anyChecked: isChecked,
            anyEligible: eligible,
          };
        }
        let allChecked = true;
        let anyChecked = false;
        let anyEligible = false;
        for (const ck of childKeys) {
          const child = index.byKey.get(ck);
          if (!child) continue;
          const r = recompute(child);
          if (r.anyEligible) anyEligible = true;
          if (!r.allChecked) allChecked = false;
          if (r.anyChecked) anyChecked = true;
        }
        const eligible = isNodeEligible(n);
        if (anyEligible && allChecked) {
          finalChecked.add(n.key);
          finalHalf.delete(n.key);
        } else if (anyChecked) {
          finalChecked.delete(n.key);
          finalHalf.add(n.key);
        } else {
          finalChecked.delete(n.key);
        }
        return {
          allChecked: !eligible
            ? allChecked
            : finalChecked.has(n.key) && allChecked,
          anyChecked: anyChecked || finalChecked.has(n.key),
          anyEligible: anyEligible || eligible,
        };
      };

      for (const root of treeData) recompute(root);

      const checkedArr = Array.from(finalChecked);
      const halfArr = Array.from(finalHalf);
      const checkedNodes: CubeTreeNodeData[] = checkedArr
        .map((k) => index.byKey.get(k))
        .filter((n): n is CubeTreeNodeData => !!n);

      const info: TreeOnCheckInfo = {
        checked: willCheck,
        node,
        checkedNodes,
        halfCheckedKeys: halfArr,
      };

      if (wantsObjectShape) {
        onCheck({ checked: checkedArr, halfChecked: halfArr }, info);
      } else {
        onCheck(checkedArr, info);
      }
    }
  });

  return { checkedSet, halfCheckedSet, toggle };
}
