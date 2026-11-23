---
"@cube-dev/ui-kit": minor
---

**FilterPicker:** `treeData` now takes `selectionMode="single"` to pick one leaf from a tree, such as a file in its folders. The tree has no checkboxes; a press or Enter on a leaf picks it (`selectedKey`, `onSelectionChange(key)`) and closes the popover, and on a parent opens or closes it. The popover opens on the picked leaf, with its ancestors open, and the default summary is the leaf's text. Without `selectionMode="single"`, tree mode stays multiple selection with checkboxes.
