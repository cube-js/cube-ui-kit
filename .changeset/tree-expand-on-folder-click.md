---
'@cube-dev/ui-kit': minor
---

Add `expandOnFolderClick` prop to `Tree`. When enabled, activating a non-leaf row toggles its expansion instead of triggering selection — useful for file-tree UX where only leaves are meaningful selection targets. Leaves still select normally; the chevron toggle, keyboard navigation, and right-click context menu continue to work independently.

Activation rules:

- Mouse click on a folder row → expand / collapse.
- `Enter` on a folder row → expand / collapse (always, including in `isCheckable` trees, where it does NOT toggle the checkbox).
- `Space` on a folder row → expand / collapse in non-checkable trees; in `isCheckable` trees `Space` is reserved for toggling the row's checkbox.

Clicks that originate inside an interactive descendant of a folder row (chevron, checkbox, overflow `⋮` trigger, user-supplied buttons / links / inputs in the `prefix` and `actions` slots) no longer bubble up to the row's expand-on-click handler, so the chevron does not visibly double-toggle and inner controls do not have the side effect of expanding / collapsing the row.
