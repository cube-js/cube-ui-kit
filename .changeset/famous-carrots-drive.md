---
'@cube-dev/ui-kit': minor
---

Add `DataTable` — a grid for query results.

The same engine as `ItemTable` (one renderer, one column layout, one value
pipeline) with the defaults an analytical grid wants rather than a list's: `t4`
type, `small` density, banded rows, and resizable columns on by default.

What is genuinely different:

- **Multi-column sorting.** `sorts` is an array and its order is the
  precedence. A newly sorted column is appended, so it is the least significant
  and the ordering already established keeps leading. Cycling one column
  through `ascending → descending → unsorted` leaves the others alone, and every
  sorted column carries `aria-sort`, not just the first.
- **Pinned rows.** `pinnedTopRows` / `pinnedBottomRows` stick to the edges of
  the scroller for totals, and are excluded from sorting and paging — a total is
  not a row competing for a position.
- **Row numbers.** `showRowNumbers` numbers rows continuously across pages.
- **`dataType`**, which is presentational rather than a Cube type: `number`
  right-aligns and switches to tabular figures so digits line up down a column.
- **Cell selection.** A list is acted on by row; a result grid is read by cell.
  Click selects one, shift-click and drag grow a rectangle, `⌘/Ctrl+C` copies the
  block as TSV (and as an HTML table, so Excel and Sheets keep the cell
  boundaries) and reports the count in a toast, `Escape` clears it. The range is
  two opposite corners rather than a set of keys, so it survives a re-sort or a
  page change. A pinned total takes part by press or shift-click — but not by
  drag-through, since it sits over the scrolling rows and is last in the order.
  The structural columns never join, and `isCellSelectable` vetoes anything else
  — a total's label cell is the motivating case. A vetoed cell is inert rather
  than merely unpainted: it cannot anchor or receive a range, and a block
  spanning it copies an empty field in its place so the paste keeps its shape.
- **Vertical rules between columns**, always on — the same split ag-grid's
  `columnBorder` gives the Cloud grids. The trailing column is exempt: its rule
  would land flush against the frame and read as a doubled edge.

It knows nothing about Cube. Measures, dimensions, pivots and drill-downs reach
it as ordinary columns, `render` output and `column.header.menu` content, which
is what keeps Cloud's column-header menu in Cloud.

Shared fixes this surfaced, which also reach `ItemTable`:

- `TableView` defaults `sortMode` to `'off'`, and each adapter re-derived the
  resolved mode at its own call site. The sort hooks now return the resolved
  mode and both adapters pass it through — two independent derivations had
  already drifted.
- The trailing column's resize handle straddled a boundary that was not there,
  hanging half its width past the table. The scroller gained a few pixels of
  horizontal scroll onto blank space; it now tucks inside.
- The empty / no-results / error content was a `Cell`, so it took the row's
  banding and lit up under the cursor as though it were a row to click. It is
  its own `StateCell` now, and reads none of the row's paint tokens.
- A pinned bottom row had no edge against the rows scrolling under it, and — with
  `showRowNumbers` — was numbered as though it were row 1. A total is not part of
  the sequence.
