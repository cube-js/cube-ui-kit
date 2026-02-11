---
"@cube-dev/ui-kit": minor
---

Add support for arbitrary CSS function syntax in container queries. Functions like `scroll-state()` and `style()` can now be used directly in `@(...)` container queries and are passed through to CSS verbatim. The existing `$` shorthand for custom property style queries remains unchanged and is still the recommended approach for querying CSS custom properties.
