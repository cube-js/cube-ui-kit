---
'@cube-dev/ui-kit': minor
---

Add `@keyframes` support in tasty styles. Define CSS animations directly within component styles using the `@keyframes` property, or configure global keyframes via `configure({ keyframes })`. Only animations referenced in styles are injected, with automatic deduplication and cleanup. Local keyframes override global ones with the same name.
