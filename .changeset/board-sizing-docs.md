---
'@cube-dev/ui-kit': patch
---

`Board`: document that it measures itself, and pin the no-paint-before-measurement guarantee with a test.

Two behaviours were already true and nowhere written down, which is enough to make a consumer rebuild both: a board observes its own container and derives the column width from it, and it renders **no widgets at all** until it has a width. The second is what makes the first look unreliable — at width 0 a column works out negative, so a board that painted then would flash every widget at a nonsense size, and a consumer who saw that would reasonably conclude the board cannot size itself.

The result is a recognisable workaround: measure the box yourself, feed it back in as `width`, and gate your own render on `measured > 0` — a `ResizeObserver` and an extra DOM node reimplementing what the board already does, plus a guaranteed empty first frame from the redundant gate.

No behaviour change. A new **Sizing** section says what `width` is actually for (SSR, tests, forced-size exports — not everyday use), and a browser test now fails if the gate is removed. It has to be a browser test: jsdom reports every box as 0, so the situation under test cannot arise there.
