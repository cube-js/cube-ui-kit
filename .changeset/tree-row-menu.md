---
'@cube-dev/ui-kit': minor
---

Add `menu`, `contextMenu`, `onAction`, `menuTriggerProps`, and `menuProps` to `Tree`. The new props mirror the `Tabs` API: `contextMenu={true}` renders a built-in `⋮` overflow trigger AND opens the same menu on right-click / Shift+F10; `'context-only'` keeps the right-click menu but hides the overflow trigger. Per-node overrides (`data.menu`, `data.contextMenu`, `data.onAction`) take precedence over tree-level defaults.
