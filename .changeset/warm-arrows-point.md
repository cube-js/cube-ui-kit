---
'@cube-dev/ui-kit': minor
---

**DataTable, ItemTable**: the sort indicator is now Tabler's narrow arrow rather
than a chevron — `ArrowNarrowUpIcon` for ascending, `ArrowNarrowDownIcon` for
descending. Both are also exported for use elsewhere.

The descending state renders the real down arrow instead of flipping the up one
with a transform, so the glyph is always the one Tabler drew.
