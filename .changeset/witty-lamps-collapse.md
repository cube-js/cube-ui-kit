---
'@cube-dev/ui-kit': patch
---

`DisplayTransition`: finish the collapse when the flow is interrupted one frame before it starts,
so `Disclosure` can no longer render an open panel under a collapsed header.

Hiding is a two-step flow: the main effect sets the internal `exit-pending` phase, and the
`[phase]` effect then schedules the double-rAF that advances it to `exit` and on to `unmounted`.
Anything that re-ran the main effect while `exit-pending` was still on screen cancelled that rAF
— and because `phase` had not changed, the `[phase]` effect never re-ran to replace it. The
component was stranded in `exit-pending`, which reports as `entered`: the content stayed at full
height indefinitely while `isShown` was already `false`, recovering only on the next toggle. The
pending exit is now re-armed by whoever cancels it, mirroring how the enter flow already behaved.

`Disclosure` is the one consumer that changes `transitionDuration` at runtime, so it is where this
surfaced: a caller that disables the animation on the same event that collapses the panel — for
example `transitionDuration={isBusy ? 0 : undefined}` — hit it whenever the two landed in separate
renders. The trigger read as collapsed while the panel below it stayed fully expanded.

Also adds a browser test tier for `DisplayTransition` and `Disclosure`. The
`duration === undefined` path, which times the exit off the element's own `transitionend` and is
what most consumers use, could not be tested under jsdom — with no layout, transition events never
fire and the fallback timer always won — and `Disclosure`'s `height: 0 → max-content` animation has
no measurable height there either.
