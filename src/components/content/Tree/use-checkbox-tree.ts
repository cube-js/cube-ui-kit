import { useState } from 'react';

import { useEvent } from '../../../_internal/hooks';

import { deriveCheckedSets, toggleCheckedKey } from './checked-keys';

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

/** Resolve the rendered sets from the source-of-truth `checked` set. */
function resolveCheckedSets({
  isCheckable,
  sourceChecked,
  ownHalfChecked,
  treeData,
  index,
}: {
  isCheckable: boolean;
  sourceChecked: Set<string>;
  /**
   * If the consumer passed the object shape (`{ checked, halfChecked }`),
   * they own the half-checked set and we use it as-is. With the array
   * shape we still need to derive `halfChecked` ourselves — the consumer
   * only provides `checked`, so parents should still light up
   * indeterminate when only some descendants are checked.
   */
  ownHalfChecked: Set<string> | null;
  treeData: CubeTreeNodeData[];
  index: TreeIndex;
}): Pick<CheckboxTree, 'checkedSet' | 'halfCheckedSet'> {
  if (!isCheckable) {
    return {
      checkedSet: new Set<string>(),
      halfCheckedSet: new Set<string>(),
    };
  }

  if (ownHalfChecked) {
    return {
      checkedSet: new Set(sourceChecked),
      halfCheckedSet: new Set(ownHalfChecked),
    };
  }

  const { checked, halfChecked } = deriveCheckedSets(
    treeData,
    index,
    sourceChecked,
  );

  return { checkedSet: checked, halfCheckedSet: halfChecked };
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

  /** Normalize the controlled `checkedKeys` prop into `Set` instances. */
  const controlled = normalizeControlledChecked(checkedKeys);
  const isControlled = controlled != null;
  const wantsObjectShape = checkedKeys != null && !Array.isArray(checkedKeys);

  const [uncontrolledChecked, setUncontrolledChecked] = useState<Set<string>>(
    () => new Set(defaultCheckedKeys ?? []),
  );

  const sourceChecked = isControlled
    ? controlled!.checked
    : uncontrolledChecked;

  const { checkedSet, halfCheckedSet } = resolveCheckedSets({
    isCheckable,
    sourceChecked,
    ownHalfChecked:
      isControlled && wantsObjectShape ? controlled!.halfChecked : null,
    treeData,
    index,
  });

  const toggle = useEvent((key: string) => {
    const node = index.byKey.get(key);
    const next = toggleCheckedKey(index, checkedSet, key);
    if (!node || !next) return;

    if (!isControlled) {
      setUncontrolledChecked(next);
    }

    if (onCheck) {
      const { checked: finalChecked, halfChecked: finalHalf } =
        deriveCheckedSets(treeData, index, next);

      const checkedArr = Array.from(finalChecked);
      const halfArr = Array.from(finalHalf);
      const checkedNodes: CubeTreeNodeData[] = checkedArr
        .map((k) => index.byKey.get(k))
        .filter((n): n is CubeTreeNodeData => !!n);

      const info: TreeOnCheckInfo = {
        checked: next.has(key),
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
