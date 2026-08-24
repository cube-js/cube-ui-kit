---
'@cube-dev/ui-kit': patch
---

`no-redundant-default-prop` now knows three defaults it used to miss: `ItemTable`'s `size` and `summary`, and `Pagination`'s `summary`. The registry it checks against is parsed line by line out of `*.docs.mdx`, so a documented default whose `(default: …)` annotation had been hard-wrapped onto the next line was invisible to the parser. Unwrapping the documentation surfaced them, and the generator proved each value against the component it belongs to.
