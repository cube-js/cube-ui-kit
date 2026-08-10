---
'@cube-dev/ui-kit': patch
---

Fix `useContextMenu` opening its popover far from the pointer.

The hook positions an invisible anchor at the click coordinates, but rendered it
wherever the consumer placed `rendered` — so those coordinates resolved against
whichever positioned ancestor happened to enclose it, and the menu opened one
ancestor-origin away from the click. `Tree` showed this too.

The anchor now sits in a zero-size `position: fixed` host portalled to `body`.
`fixed` makes the containing block's origin the viewport, and the portal keeps
it clear of transformed ancestors, which capture `fixed` — a virtualized row is
usually translated, so the fixed host alone would still be anchored to the row.
Coordinates are now computed in viewport space to match.
