---
"@cube-dev/ui-kit": patch
---

The published `tasty.config.ts` lets containers (`Card`, `Panel`, `Layout`, `Alert`, `Result`, `Skeleton` and the rest) keep `display`, so `tasty/no-protected-restyle` accepts a `display: 'flex'` or `'grid'` that their other layout props need on a block container such as `Card`.
