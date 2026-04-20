import { useMemo, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';

import type { Key } from '@react-types/shared';
import type { TreeIndex } from './tree-index';
import type { CubeTreeNodeData, TreeOnCheckInfo } from './types';

export interface UseCheckboxTreeOptions {
  treeData: CubeTreeNodeData[];
  /**
   * Pre-built tree index, shared with `Tree.tsx` so that `treeData`
   * is walked exactly once per change rather than once per consumer.
   */
  index: TreeIndex;
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

/**
 * Recursively walk a subtree bottom-up, deriving which nodes are fully
 * checked vs half-checked.  Mutates `checked` and `half` in place.
 */
function deriveCheckedState(
  node: CubeTreeNodeData,
  index: TreeIndex,
  checked: Set<string>,
  half: Set<string>,
): { allChecked: boolean; anyChecked: boolean; anyEligible: boolean } {
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
    const r = deriveCheckedState(child, index, checked, half);
    if (r.anyEligible) anyEligible = true;
    if (!r.allChecked) allChecked = false;
    if (r.anyChecked) anyChecked = true;
  }

  const eligible = isNodeEligible(node);

  if (anyEligible && allChecked) {
    checked.add(node.key);
    half.delete(node.key);
  } else if (anyChecked) {
    checked.delete(node.key);
    half.add(node.key);
  } else {
    checked.delete(node.key);
  }

  return {
    allChecked: !eligible ? allChecked : checked.has(node.key) && allChecked,
    anyChecked: anyChecked || checked.has(node.key),
    anyEligible: anyEligible || eligible,
  };
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
  const {
    treeData,
    index,
    isCheckable,
    defaultCheckedKeys,
    checkedKeys,
    onCheck,
  } = opts;

  /**
   * Normalize the controlled `checkedKeys` prop into stable `Set` instances.
   * Memoized on the `checkedKeys` reference so unrelated re-renders don't
   * invalidate the derivation memo below — `normalizeControlledChecked`
   * allocates fresh `Set`s each call, which would otherwise force
   * `deriveCheckedState` to re-walk the entire tree on every render in
   * controlled mode.
   */
  const controlled = useMemo(
    () => normalizeControlledChecked(checkedKeys),
    [checkedKeys],
  );
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

    /**
     * If the consumer passed the object shape (`{ checked, halfChecked }`),
     * they own the half-checked set and we use it as-is. With the array
     * shape we still need to derive `halfChecked` ourselves — the consumer
     * only provides `checked`, so parents should still light up
     * indeterminate when only some descendants are checked.
     */
    if (isControlled && wantsObjectShape) {
      return {
        checkedSet: new Set(sourceChecked),
        halfCheckedSet: new Set(controlled!.halfChecked),
      };
    }

    const checked = new Set(sourceChecked);
    const half = new Set<string>();

    for (const root of treeData) {
      deriveCheckedState(root, index, checked, half);
    }

    return { checkedSet: checked, halfCheckedSet: half };
  }, [
    isCheckable,
    isControlled,
    wantsObjectShape,
    sourceChecked,
    controlled,
    treeData,
    index,
  ]);

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

      for (const root of treeData) {
        deriveCheckedState(root, index, finalChecked, finalHalf);
      }

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
