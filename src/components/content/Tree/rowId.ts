/**
 * The DOM id of the row with `key` in the tree whose id is `treeId`, for the
 * `aria-activedescendant` of an input that drives the tree with virtual
 * focus. React Aria's `useGridListItem` assigns it, and `react-aria` does not
 * re-export its `getRowId`, so this mirrors that format: the tree id, a dash,
 * then the key with whitespace removed (see `ListBox/optionId.ts`).
 */
export function getTreeRowId(treeId: string, key: string): string {
  return `${treeId}-${key.replace(/\s*/g, '')}`;
}
