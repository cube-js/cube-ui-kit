---
"@cube-dev/ui-kit": patch
---

`PrismCode` highlights `WEEK` and `QUARTER` in SQL as keywords, like the other date units, so `DATEDIFF(week, …)` no longer renders plain next to a highlighted `DATEDIFF(day, …)`. This applies to SQL inside YAML and SQL diffs too.
