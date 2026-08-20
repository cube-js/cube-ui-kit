---
'@cube-dev/ui-kit': patch
---

`TextArea` / `CommandTextArea`: `autoSize` no longer disturbs the page while typing, and a single line is one row again.

- **The height is now measured off-screen instead of on the live textarea.** Measuring used to set `height: auto` on the real element, force a layout, then restore it — twice per keystroke. Any ancestor sharing the column re-laid out mid-keystroke, so in a chat layout the transcript's scroll viewport grew by the collapsed rows and its scroll offset moved; the browser's scroll anchoring undid that imperfectly, which reads as the whole conversation bouncing a pixel in the rhythm of typing. A textarea already grown past its `rows` minimum — the everyday state of a chat prompt — lost 40px of scroll offset per keystroke with anchoring out of the way.
- **Row counting is fixed.** `height: auto` sizes a textarea from its `rows` attribute and the font's own metrics, and that height was being divided by CSS `line-height` to get a row count. Where the line height is tighter than the font's natural line box, one line of text counted as two rows, so an `autoSize` textarea with `rows={1}` rendered a row taller than its content. Row counting now rounds a measured content height that carries no such floor, which also stops a fractional line height (a zoomed page, a percentage preset) from adding a phantom row.
