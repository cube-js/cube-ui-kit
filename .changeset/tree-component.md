---
"@cube-dev/ui-kit": minor
---

Add `Tree` component — a hierarchical tree view built on React Aria/Stately with an Ant Design–compatible API for easy migration.

- `treeData` accepts nested `{ key, title, children, isLeaf, isCheckable, isCheckboxDisabled }` nodes
- Optional checkbox column via `isCheckable` with cascading parent/child state and `halfChecked` keys in `onCheck` payload
- Controlled / uncontrolled `checkedKeys`, `expandedKeys`, and `selectedKeys` (single or multiple `selectionMode`)
- Async `loadData` with per-row loading indicator; auto-expands lazy nodes after load
- Per-node and per-tree `isDisabled`, `autoExpandParent`, custom `title` ReactNode
- `rowStyles` prop forwarded to each row's underlying `Item` for visual customization
