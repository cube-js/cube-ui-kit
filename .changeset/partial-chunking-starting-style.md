---
"@cube-dev/ui-kit": patch
---

Allow partial chunking for styles with `@starting-style`: top-level styles are still combined into a single chunk (required by CSS cascade), but sub-element styles are now kept in a separate chunk for better caching.
