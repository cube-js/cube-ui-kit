---
"@cube-dev/ui-kit": patch
---

`DataTable` / `ItemTable`: a column's `cellStyles` now go through tasty instead of the cell's inline `style`. Tokens such as `{ color: '#surface-text-soft-2' }`, units, presets and state maps now take effect where they used to be dropped silently, and the column's styles win over the table's default cell paint, column tints and the table-level `cellStyles`. On a `dataType: 'number'` column, a function-form `cellStyles` is now called per cell and merged over the tabular figures; before, the numeric default replaced it. Values are now read as tasty rather than CSS, so check CSS-shaped ones: a bare number takes a unit (`lineHeight: 1.2` becomes `1.2px`, pass `'1.2'` for a unitless value) and `textOverflow: 'ellipsis'` now also sets `overflow: hidden` and `white-space: nowrap`.
