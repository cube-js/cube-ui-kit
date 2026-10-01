---
"@cube-dev/ui-kit": minor
---

`Result` gains what a confirmation or result dialog needs: an `actions` slot for `Result.Action` buttons, which take their size from the Result, a `size="large"` scale with a bigger icon and text, and a `layout="stacked"` arrangement that fills the container and stacks the actions to the full width. Size and layout are independent, so a large result can keep its centered row of actions and a medium one can stack them. `isCompact` keeps its own scale and arrangement and ignores both. The status icon now has room around it that grows with its size, a quarter of the icon on each side, in every non-compact Result including the default medium one, so existing results get a little taller. The stacked layout keeps a `1.5x` padding of its own on top of the host's.
