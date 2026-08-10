---
'@cube-dev/ui-kit': minor
---

Rows now slide to their new positions when a sort reorders them, instead of
teleporting. 120ms, matching ag-grid's `animateRows` closely enough to feel
familiar. `isRowMoveAnimated={false}` opts out, and `prefers-reduced-motion`
turns it off by itself.

The value is in being able to follow one row to where it went; a table that
teleports gives the eye nothing to track.

It is FLIP — the previous commit's positions are the First, this commit's are
the Last, each row is Inverted back to where it was and Played to zero. The DOM
is correct the whole time and only the paint lags, so tests, screen readers and
`aria-rowindex` all see the new order immediately.

Two details that are load-bearing rather than incidental:

- Positions come from `offsetTop`, which is relative to the scroller's content,
  so scrolling is not mistaken for movement. Viewport coordinates would make
  every scroll tick look like a reorder of the whole page.
- Neither the invert nor the cleanup uses `requestAnimationFrame` or
  `transitionend`. Neither fires in a hidden tab, and a sort landing while the
  tab is in the background left rows frozen at their old positions, or holding
  an inline `transition` that would go on to animate a later drag. A forced
  reflow and a timer are unconditional.

Rows that were not on screen before are skipped rather than the whole batch
being abandoned — a virtualized window swaps some of its rows on every re-sort,
and requiring every row to be familiar meant a virtualized grid never animated
at all.
