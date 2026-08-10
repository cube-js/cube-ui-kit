---
'@cube-dev/ui-kit': patch
---

Stop `ItemTable` from rubber-banding at its scroll edges.

The scroller used `overscroll-behavior: contain`, which prevents scroll chaining
but still allows the bounce. Bouncing drags the rows away from the sticky header
and exposes blank surface behind them. It uses `none` now, which stops both.

Still applied per axis and only where the table can actually scroll: an axis
with nothing to scroll stays `auto`, so a short table does not swallow the wheel
and pin the page behind it.
