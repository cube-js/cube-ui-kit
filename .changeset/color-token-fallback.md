---
'@cube-dev/ui-kit': minor
---

Added color token fallback syntax `(#color, #fallback)` for robust color hierarchies. Supports nested fallbacks like `(#primary, (#secondary, #default))`. Automatically generates RGB variants for the entire fallback chain, ensuring proper color variable resolution at runtime.

