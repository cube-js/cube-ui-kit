---
'@cube-dev/ui-kit': minor
---

Add `menu`, `contextMenu`, `onAction`, `menuTriggerProps`, and `menuProps` to `Tree`. The new props mirror the `Tabs` API: `contextMenu={true}` renders a built-in `⋮` overflow trigger AND opens the same menu on right-click / Shift+F10; `'context-only'` keeps the right-click menu but hides the overflow trigger. Per-node overrides (`data.menu`, `data.contextMenu`, `data.onAction`) take precedence over tree-level defaults. An `onAction` supplied via `menuProps` is chained with the tree-level / per-node `onAction` callbacks so consumer-supplied handlers also fire.

While re-wiring the row's `onKeyDown` for the menu / `expandOnFolderClick` shortcuts, the chained behavior of `Space` in `isCheckable` trees was preserved: pressing `Space` on a focused row toggles the row's checkbox AND continues to fire the tree's selection logic (matching the previous `mergeProps`-based chaining), so existing consumers see no change.
