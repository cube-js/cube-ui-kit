---
'@cube-dev/ui-kit': patch
---

Fixed `special` theme `outline` and `clear` fills resolving to the wrong layer for `selected & hovered`, `selected & focused` and `selected & hovered & pressed` states. Two state entries within the same `fill` map shared the same `#white.X` value (`hovered` ↔ `disabled` for outline; `'hovered | focused'` ↔ `'selected & disabled'` for clear). Tasty's `mergeEntriesByValue` pass coalesced them into a single high-priority OR-condition entry that then negated against the lower-priority `'selected & (hovered | focused)'` rule, making it resolve to `FALSE` for selected-hover/focus. Each alpha step now uses a unique value string, restoring the intended monotonic-contrast progression. See `src/data/Claude.md` for the underlying pitfall.
