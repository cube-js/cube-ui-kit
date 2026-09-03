---
'@cube-dev/ui-kit': minor
---

Add a standalone Dashboard compound component with a shared 12-column layout, transparent depth-aware container chrome, registered contextual add menus, independent tab layouts, surface and cross-container movement for widgets and containers, selected-group transfers with valid/danger drop previews, hard parent capacity for nested content, bounded resizing, and an interactive authoring Playground with atomic tree transfers.

Dashboard owns collision resolution: a proposal arrives with every placement it resolved — the grabbed group in `info.items`, the siblings it moved aside in `info.displaced`, and `info.isBlocked` when no resolution exists — so a consumer writes placements instead of reimplementing reflow. A pointer move now tries every container under the pointer from the deepest outward and lands in the first that can take the geometry, hit-tests against geometry snapshotted once per gesture, tracks true client coordinates so a mid-drag scroll cannot desynchronise it, and cancels on `Escape`.

Each node's actions sit behind one menu in its top-right corner: Settings, opt-in Duplicate, consumer-supplied `actions` dispatched through `onMenuAction`, seven size commands (each disabled when it would change nothing), and Delete. The size commands report through `onPlacementChange` with the new `'command'` input and are the accessible equivalent of the resize gesture. Node chrome is ordered in a single stacking context at the Dashboard root, so it stays reachable above every node body at every depth, and top-level containers are separated by a fixed `1x` channel.

A Grid's add button can be pressed and dragged — or grown with `Shift` and the arrow keys — to claim an area before choosing what fills it; the button occupies the claim and the menu then offers only items that can be that size.
