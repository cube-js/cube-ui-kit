---
'@cube-dev/ui-kit': minor
---

`Board`: resize grips now know which side of a nesting boundary they belong to.

**The bug.** A `resizeGripPlacement="corner"` hit-zone was a 24px square pinned to the corner by its outer edge, so ~19px of it lay over the widget's own content while only the 5px half-dot was painted there. Where that content was a nested `Board`, the child in the bottom-right cell lost its own resize handle and could not be resized at all. Pulling on the thread found three more collisions in the same place: a container's edge grips were painted _under_ its children (`z-index: auto` against a child host's `1`) while its edge hit-zones sat 16px _over_ them at `z-index: 20`; a child's corner grip was drawn as a clipped fragment; and any last-column child's corner grip landed on the container's east edge grip.

**The fix.** `resizeGripPlacement` is no longer defaulted to `'inside'` — left unset it resolves from the widget's content. A widget holding a nested `Board` gets the new `'outside'` placement, and every other widget gets `'inside'`. A nested board introduces itself to its host through `BoardHost`, so this needs no prop at any call site and follows the tree as boards are nested.

An `'outside'` grip is a padded control in the grid gutter beyond the widget's edge — a pill along each edge, a dot where two gutters cross — and the control _is_ the hit-zone, one element, so the two can no longer drift apart the way the dot and the square did. A container's affordance therefore points outward and its children's inward, leaving the two levels no pixel in common: nothing to arbitrate, nothing clipped to stay out of the way.

Grips also reveal one widget at a time now. The pointer is inside every ancestor at once, so a container stands down while the pointer is on one of its children.

**Behaviour change.** A widget holding a nested `Board` that relied on the board-level default now draws its grips outside instead of inside. Pass `resizeGripPlacement` explicitly to keep the old geometry. An `'outside'` grip needs at least 8px of `margin` per axis to sit in; below that it keeps its size, overhangs the neighbours, and warns in development.

Also in this release: `'corner'`'s hit-zone is held to the dot it stands for (half a grip inward, and outward only as far as half the gutter), edge axes under `'corner'` no longer inherit the corner offset, and where two hit-zones still overlap — an explicit placement on a container, or too thin a gutter — a press goes to the innermost handle under the pointer, with a development warning if that leaves the container unable to resize itself.
