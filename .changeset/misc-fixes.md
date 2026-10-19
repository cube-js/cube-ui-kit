---
"@cube-dev/ui-kit": patch
---

`RangeSlider`: `ref.current.focus()` now focuses the first thumb. It used to do nothing, because the ref targeted an input no thumb rendered.

`Layout.Footer`: only the footer of a top-level `Layout` is a `contentinfo` landmark now. A footer inside a `Layout.Panel`, a nested `Layout` or any other Layout region gets `role="none"`, so panel footers no longer add unnamed "content info" landmarks. An explicit `role` still wins.

`Picker`: the trigger now describes itself with the value it shows (the selection, the `renderSummary` output or the placeholder), so screen readers announce "Status, button, Open" instead of the label alone, and it sets `aria-haspopup="dialog"` for the popover it opens. Its accessible name is still the label.
