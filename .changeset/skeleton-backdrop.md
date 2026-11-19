---
"@cube-dev/ui-kit": patch
---

The published `tasty.config.ts` lets a `Skeleton` take `fill` and `border` style props without a `tasty/no-protected-restyle` report, as `Panel` and `Layout` do. A skeleton lays its placeholders out in a plain flow or grid that draws no surface of its own, so a fill behind them is the backdrop of the region it stands in for, the consumer's choice.
