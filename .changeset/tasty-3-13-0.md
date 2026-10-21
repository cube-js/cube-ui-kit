---
'@cube-dev/ui-kit': patch
---

Update Tasty to 3.13.0 (from 3.12.0). The kit's declarations now name a component's props type instead of listing each prop, so they shrink from about 2.5 MB to 0.7 MB (`Text.d.ts` from 1.6 MB to 3 KB) and no longer bundle a copy of csstype under `dist/node_modules`. Tasty also exports `TastyExtensionProps` and `ComponentStatics`, and an extension of a component whose props are a union now accepts each member's props, not only the keys they share.
