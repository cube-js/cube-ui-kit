---
'@cube-dev/ui-kit': patch
---

`FilterListBox` and `FilterPicker` leave keys typed during an IME composition (Chinese, Japanese, Korean) to the input method. Before, `Enter` that confirmed a composition picked the focused option, so with `allowsCustomValue` the half-composed text was added as a value; the arrow keys moved the list's focus instead of the candidate, and `Escape` cleared the search.
