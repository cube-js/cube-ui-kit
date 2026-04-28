---
'@cube-dev/ui-kit': minor
---

Add `expandOnFolderClick` prop to `Tree`. When enabled, activating a non-leaf row (mouse click or `Enter` / `Space`) toggles its expansion instead of triggering selection — useful for file-tree UX where only leaves are meaningful selection targets. Leaves still select normally; the chevron toggle, keyboard navigation, and right-click context menu continue to work independently.
