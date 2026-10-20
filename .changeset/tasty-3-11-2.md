---
'@cube-dev/ui-kit': patch
---

Update Tasty to 3.11.2 (from 3.11.1). The kit needed no changes. A sub-element whose `$` ends in a pseudo-element, such as `$: '&::before'`, now applies `@own(...)` to the pseudo-element itself. States a pseudo-element cannot have are dropped with a `PSEUDO_ELEMENT_STATE_IGNORED` warning: modifiers, attributes, classes and tree positions. Before, they produced a selector that never matched, and their default branch never applied either. Put such a condition on the element in `$` instead, as in `$: 'a[rel="next"]::before'`. The same holds for a `useGlobalStyles()` selector ending in a pseudo-element, whose `@parent(...)` states now go before the pseudo-element, where they match.
