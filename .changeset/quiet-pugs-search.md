---
'@cube-dev/ui-kit': patch
---

Fix two contracts the tables documented but did not keep.

**`searchDelay` now debounces `onSearchChange`, not only the filter.** The term
was routed straight into `useControlledState`, which calls `onChange` the moment
it is set — so `searchMode="server"` issued a request per keystroke, the exact
thing the delay exists to prevent, while the docs said the callback was
debounced too. The input keeps its own immediate draft and the committed term
trails it, so typing never lags.

**ARIA row indices are document-absolute again.** `aria-rowcount` counted pinned
rows, but pinned rows carried no `aria-rowindex` at all and body rows numbered
from the top of the *page*, ignoring both the pages before them and any pinned
rows above them. Screen readers heard colliding indices against a larger count.
The index space is now derived in one place — header, pinned top, body offset by
the preceding pages, pinned bottom — and `aria-rowcount` reports the whole
result rather than the current page.
