import type { TreeIndex } from './tree-index';
import type { CubeTreeNodeData } from './types';

/**
 * Pure checkbox cascade for a tree: which keys are fully checked and which
 * are half-checked, and what one toggle does to them.
 *
 * Shared by `Tree` (through `useCheckboxTree`) and `FilterPicker`'s tree
 * mode. The picker renders a filtered copy of `treeData` but must conduct
 * over the whole tree, so a search never reads a hidden node as unchecked.
 */

/**
 * Returns whether a node should be checkable (i.e. clicking the
 * checkbox should affect it).
 *
 * Skips:
 * - explicitly disabled nodes (`isDisabled === true`)
 * - explicitly disabled checkboxes (`isCheckboxDisabled === true`)
 * - nodes that opted out via `isCheckable === false`
 */
export function isNodeEligible(node: CubeTreeNodeData | undefined): boolean {
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

  if (!anyEligible) {
    // No eligible descendants — this node behaves like a leaf for
    // checking purposes: its own checked state stands as-is.
    half.delete(node.key);
  } else if (allChecked) {
    checked.add(node.key);
    half.delete(node.key);
  } else if (anyChecked) {
    checked.delete(node.key);
    half.add(node.key);
  } else {
    checked.delete(node.key);
    half.delete(node.key);
  }

  return {
    allChecked: !eligible ? allChecked : checked.has(node.key) && allChecked,
    anyChecked: anyChecked || checked.has(node.key),
    anyEligible: anyEligible || eligible,
  };
}

/**
 * Derive `{ checked, halfChecked }` from a source-of-truth `checked` set,
 * as AntD does:
 *
 * - First down: a checked key checks its eligible descendants, so a parent
 *   key stands for its subtree even when its children aren't listed, and
 *   even when the parent's own checkbox is disabled.
 * - Then bottom-up: a parent is fully checked iff every eligible
 *   descendant leaf is checked, and half-checked iff at least one eligible
 *   descendant is checked or half-checked, but not all.
 *
 * Ineligible nodes (disabled / opt-out) are ignored when computing the
 * parent's state — they neither force a parent into the unchecked nor
 * half state.
 */
export function deriveCheckedSets(
  treeData: CubeTreeNodeData[],
  index: TreeIndex,
  source: Iterable<string>,
): { checked: Set<string>; halfChecked: Set<string> } {
  const checked = new Set<string>();
  const halfChecked = new Set<string>();

  const checkSubtree = (node: CubeTreeNodeData) => {
    if (!isNodeEligible(node)) return;
    checked.add(node.key);
    for (const ck of index.childrenOf.get(node.key) ?? []) {
      const child = index.byKey.get(ck);
      if (child) checkSubtree(child);
    }
  };

  // A key stands for its subtree even when its own checkbox is off limits,
  // so a locked parent in the value keeps its checked children, and with
  // them its own key, through the bottom-up pass.
  for (const key of source) {
    checked.add(key);
    for (const childKey of index.childrenOf.get(key) ?? []) {
      const child = index.byKey.get(childKey);
      if (child) checkSubtree(child);
    }
  }

  for (const root of treeData) {
    deriveCheckedState(root, index, checked, halfChecked);
  }

  return { checked, halfChecked };
}

/**
 * Toggle `key` against the derived `checked` set: propagate *down*
 * (skipping ineligible descendants) and recompute ancestors *up*.
 * Returns the next source-of-truth set, or `null` when the node can't
 * be toggled.
 *
 * Seed it with the derived set, not the source one. The source set may
 * only contain leaf keys (e.g. when `defaultCheckedKeys` is leaf-only, or
 * a consumer in controlled-array mode passes only leaves). The ancestor
 * walk decides whether each ancestor is fully checked by inspecting its
 * direct children, which may themselves be inner nodes whose "fully
 * checked" status only exists in the derived set.
 */
export function toggleCheckedKey(
  index: TreeIndex,
  checked: Set<string>,
  key: string,
): Set<string> | null {
  const node = index.byKey.get(key);
  if (!node || !isNodeEligible(node)) return null;

  const willCheck = !checked.has(key);
  const next = new Set(checked);

  const apply = (n: CubeTreeNodeData) => {
    if (!isNodeEligible(n)) return;
    if (willCheck) next.add(n.key);
    else next.delete(n.key);
    for (const ck of index.childrenOf.get(n.key) ?? []) {
      const child = index.byKey.get(ck);
      if (child) apply(child);
    }
  };

  apply(node);

  // After the cascade, recompute ancestors so the set doesn't carry
  // parent keys that should be half-checked instead. Ancestors of `key`
  // get visited bottom-up here.
  let parentKey = index.parentOf.get(key);
  while (parentKey) {
    const parent = index.byKey.get(parentKey);
    if (!parent) break;
    let allEligibleChecked = true;
    let anyEligible = false;
    for (const ck of index.childrenOf.get(parentKey) ?? []) {
      const child = index.byKey.get(ck);
      if (!child || !isNodeEligible(child)) continue;
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

  return next;
}

/** A checked set as an array in tree order; keys the tree lacks go last. */
export function toOrderedKeys(
  index: TreeIndex,
  checked: Iterable<string>,
): string[] {
  const set = new Set(checked);
  const ordered = [...index.byKey.keys()].filter((key) => set.has(key));

  for (const key of set) {
    if (!index.byKey.has(key)) ordered.push(key);
  }

  return ordered;
}
