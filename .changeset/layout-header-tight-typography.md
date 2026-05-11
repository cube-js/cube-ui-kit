---
'@cube-dev/ui-kit': patch
---

**Fix:** `Layout.Header` now sets `line-height: 1em` on both the breadcrumbs and the title. The headings' default leading no longer overlaps the adjacent grid rows, so long titles fit cleanly under breadcrumbs and the header collapses to its actual ink height.
