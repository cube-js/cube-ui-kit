---
"@cube-dev/ui-kit": patch
---

The published `tasty.config.ts` lets a `Skeleton` take a `fill` style prop without a `tasty/no-protected-restyle` report, as `Layout`'s sections do. A skeleton lays its placeholders out in a plain flow or grid that draws no surface of its own, so a fill behind them is the backdrop of the region it stands in for, the consumer's choice. Its `border` stays protected: the line under the `topbar` layout is UI Kit's.
