---
'@cube-dev/ui-kit': minor
---

`Layout.Panel` and `Layout.Pane` share a new resize handle. At rest the resizable edge is a 1px line (a panel's own border, or a line the pane now draws), with no gray track and no dots; on hover, while dragging and on keyboard focus it turns into a 2px accent line, and keyboard focus adds a focus ring. At the minimum or maximum size the cursor shows the one direction left. On touch screens a grip shows on the edge and a coarse pointer gets a 20px target. The handle now exposes `aria-valuenow` (plus `aria-valuemin` / `aria-valuemax` when the limit is known in pixels) and `aria-controls`, and `Home` / `End` resize to the minimum / maximum. Nothing moves: panel, pane and content sizes stay as they were. Breaking for custom styles: `Layout.Pane` no longer renders the `Drag` and `DragPart` sub-elements; its `ResizeHandler` now holds `Line`, `Grip` and `TouchArea`. A pane that drew its own border on the resizable edge to show it can drop that border.
