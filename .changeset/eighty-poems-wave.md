---
'@cube-dev/ui-kit': patch
---

Align `ItemTable` header content optically rather than geometrically.

The header `Item` now fills its cell and supplies the indent itself, per side,
so a leading icon and a trailing icon can be placed independently. Text keeps
the full cell padding and lines up with the body text below it; a leading icon
takes 8px, because the icon is small and light enough that the text's 16px reads
as a gap beside it; and a trailing icon — the sort arrow — takes none, so it hangs at
the column edge instead of floating short of it.
