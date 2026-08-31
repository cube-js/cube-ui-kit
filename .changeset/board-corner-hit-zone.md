---
'@cube-dev/ui-kit': patch
---

`Board`: a `resizeGripPlacement="corner"` grip no longer steals resize presses from a nested board's child.

The corner hit-zone was a 24px square pinned to the corner by its outer edge, so ~19px of it lay over the widget's own content while only 5px of the dot was drawn there. When the content was a nested `Board`, the child in the bottom-right cell lost its own resize handle to it and could not be resized at all — the gesture resized the container instead.

The hit-zone is now held to what is visible: half a grip inward, plus as much outward as half the grid gutter allows, so it never covers the widget's own content beyond the dot, nor a neighbour's. Edge handles under `corner` placement no longer pick up the corner offset either.

Geometry alone cannot settle the flush case — an `isAligned` inner board puts its last child's corner on exactly the same point as its host's, and `z-index` cannot arbitrate across the grip layer — so a press on a shared corner now goes to the **innermost** handle. A container that yields its only resize affordance this way warns in development: give it an edge axis to fall back on (`resizeHandles={['se', 'e', 's']}`), or give the inner board some `containerPadding`.
