---
"@cube-dev/ui-kit": patch
---

A `Radio`'s `tooltip` now opens when the option takes keyboard focus, not only on hover, and the focused input is described by it, so screen readers announce it. It follows arrow-key navigation between options, and any `aria-describedby` the radio already had is kept alongside it.
