---
'@cube-dev/ui-kit': patch
---

Simplified the `input-autofill` recipe's `@autofill` alias to `:-webkit-autofill | :autofill`. Coverage is unchanged in practice (the dropped Chromium-internal pseudo-classes were redundant on top of `:-webkit-autofill`), and the resulting selector list avoids the `:is()` wrapper, fixing rendering in environments where `:is()` interacted poorly with the autofill rule.
