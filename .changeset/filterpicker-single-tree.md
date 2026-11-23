---
"@cube-dev/ui-kit": minor
---

**FilterPicker:** `treeData` now takes `selectionMode="single"` to pick one leaf from a tree, such as a file in its folders. The tree has no checkboxes; a press, Enter or Space on a leaf picks it (`selectedKey`, `onSelectionChange(key)`) and closes the popover, and on a parent opens or closes it. The popover opens on the picked leaf, with its ancestors open, and the default summary is the leaf's text. Without `selectionMode="single"`, tree mode stays multiple selection with checkboxes. A new `treeItemProps` sets each tree row's `Item` props, such as a `prefix` icon or `suffix` marks, as `Tree`'s `itemProps` does. In either tree mode, a tap on a row after a touch open no longer focuses the search, so a phone's keyboard stays shut.
