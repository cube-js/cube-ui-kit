---
'@cube-dev/ui-kit': minor
---

`Pagination` accepts `size="xsmall"`, and `ItemTable`'s footer uses it — the
footer is chrome around the data, so its controls sit a step below the toolbar's.

The footer also presets its text to `t4`, which slot content inherits — a
consumer's own label now matches the pagination summary beside it without
setting anything. `Pagination`'s summary follows its own size, so it is `t4` at
`xsmall` and `t3` otherwise.

Page-number buttons are also grouped and spaced `1bw` apart rather than sharing
the `.5x` gap of the navigation buttons around them. They read as one run of
pages rather than as separate controls, and a hairline is enough to keep the
current page's outline off its neighbours.
