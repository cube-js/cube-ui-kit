# Status — knowledge

## Looping animations must be phase-locked, not mount-locked

A CSS animation is created with its start time at "now", so it begins at the first frame of the loop. For a loader that is fine exactly once. A loading page brings its levels up at different moments, and every wrapper that appears above a running loader remounts it — a new element, a new animation, back to frame one. The symptom is a loader that stutters back to the start while the page settles, several times, and it gets worse the deeper the tree is.

`LoadingAnimation` fixes this by moving each animation's start time to the origin of the document timeline in a layout effect:

```ts
for (const animation of element.getAnimations()) {
  if (animation.timeline === element.ownerDocument.timeline) {
    animation.startTime = 0;
  }
}
```

The position then depends only on the timeline's current reading, so a remount resumes where the removed element was and every instance in the document runs in lockstep. Do this in a **layout** effect, so the phase is set before the new element's first paint.

Two things not to reach for instead:

- **A negative `animation-delay` from `Date.now()`.** It has to be computed during render, off a clock the animation does not run on (so the phase is off by the render-to-paint gap), and it differs between server and client — a hydration mismatch on every render.
- **`getAnimations()` without the timeline check.** It also returns transitions and any animation attached to a non-document timeline, where a numeric start time is either meaningless or a `TypeError`.

`Spin` runs the same kind of infinite loop (`Spin/Cube.tsx`, 2.2s) and has **not** been converted — it also resets its animation on `size` change on purpose, as a Safari resize workaround (see the comment in `Spin/InternalSpinner.tsx`), so that needs untangling first.

jsdom has no `Element.getAnimations`, so this behaviour is only observable in the browser project: [`LoadingAnimation.browser.test.tsx`](LoadingAnimation/LoadingAnimation.browser.test.tsx).
