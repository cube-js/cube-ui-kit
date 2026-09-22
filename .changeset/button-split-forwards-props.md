---
"@cube-dev/ui-kit": minor
---

`ButtonSplit` forwards the DOM and ARIA props it used to discard. It destructured its own props and passed only five things to the element, so `aria-label`, `aria-labelledby`, `aria-describedby`, `id`, `role`, raw `data-*` attributes and event handlers were dropped — which meant a split group could not be labelled at all, and that matters most in custom mode, where the children are typically icon-only buttons with no visible group label. Its sibling `ButtonGroup` has always forwarded everything, so the two were not interchangeable despite reading as alternatives. Custom mode also defaults to `role="group"` now, so a label has something to name; pass your own `role` (including `presentation`) to override it. The wrapper no longer emits a stray `tag="div"` attribute.
