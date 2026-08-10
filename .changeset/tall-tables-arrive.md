---
'@cube-dev/ui-kit': minor
---

Add `ItemTable`, `DataTable` and `Pagination`.

Two tables over one shared engine, replacing the ag-grid wrappers Cube Cloud
carries today. They keep the same names, so migration is mechanical, and drop
the `Omit<AgGridReactProps, …>` intersection that made every ag-grid option
public API.

**`ItemTable`** — lists of records that get acted on. Sorting, row selection
with a bulk action bar, row links and a row menu, a toolbar with client or
server search, client/server pagination or infinite scroll, column resize and
pinning, row reordering and drop-onto-row, virtualization, and per-row visuals
through `getRowProps`.

**`DataTable`** — query results. The same engine with an analytical grid's
defaults rather than a list's: `t4` type, `small` density, banded rows,
resizable columns and column rules, all on by default. What is genuinely
different is multi-column sorting whose array order is the precedence, pinned
totals that sit outside sorting and paging, continuous row numbers, and
rectangular cell selection with `⌘/Ctrl+C` copying the block as TSV and as an
HTML table so spreadsheets keep the cell boundaries.

**`Pagination`** and `usePagination`, which the kit did not have. `type="numbers"`
is the default deliberately: Cloud's builds a `Select` of every page, which is a
thousand collection items per render at 100k rows.

Neither table knows anything about Cube. Measures, dimensions, pivots and
drill-downs arrive as ordinary columns, `render` output and
`column.header.menu` content, which is what keeps Cloud's column-header menu in
Cloud.

Built on a native `<table>`: sticky pinned columns need a cell's containing
block to be the scrollport, and a grid item's is its own grid area — which is
why a div-and-CSS-grid design cannot have them without ag-grid-style flex lanes.
Header and body then agree through `<colgroup>` with nothing to sync.

Some behaviour worth knowing without reading the source:

- A refresh fades the table, header included, and sweeps a band of lower
  opacity across it rather than covering the rows with a spinner — the previous
  result stays readable, which is the point of keeping it on screen.
- A sort slides rows to their new positions over 120ms, so a row can be followed
  to where it went. Only a reorder animates: if the rows keep their relative
  order the table never moves, however much the layout shifts underneath them —
  so mounting, resizing and filtering are all silent.
- Infinite scroll starts fetching a screen before the end and holds the scroll
  height with a batch-sized run of skeleton rows, so scrolling is not
  interrupted and nothing lurches when the rows land.
- Both animations respect `prefers-reduced-motion`.
- Selection survives sorting and paging: it is keyed, and a cell range is stored
  as two corners re-resolved against the current order.

`DraggableCollection` gains `onItemDrop`, `shouldAcceptItemDrop` and
`renderPreview`, so a drag preview can be a React node instead of markup written
into `innerHTML`.
