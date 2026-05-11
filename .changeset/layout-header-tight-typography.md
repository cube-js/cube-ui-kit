---
'@cube-dev/ui-kit': patch
---

**Fix:** `Layout.Header` now sets `line-height: 1em` on the breadcrumbs row, and on the title only when breadcrumbs are present. The headings' default leading no longer overlaps the breadcrumbs row, so long titles fit cleanly beneath breadcrumbs while keeping the natural line-height when breadcrumbs are absent.
