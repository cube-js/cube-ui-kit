---
'@cube-dev/ui-kit': minor
---

Add pagination, footer slots and loading behaviour to `ItemTable`.

Pagination is on by default (`paginationMode="client"`, 50 rows a page) and
renders in the footer. Client mode slices the **searched and sorted** rows, so a
page always reflects what the user is looking at and the summary counts filtered
rows rather than the raw array; changing the page size returns to page 1.
`paginationMode="server"` never slices — it reflects `page` and reports changes,
with `total` (or `totalPages` / `hasNextPage`) coming from the query.

The footer has three named slots — `footerStart`, `footerCenter`, `footerEnd` —
which render whether or not pagination is on. `footerStart` is the replacement
for injecting a "Load all results" button into ag-grid's paging panel with a
`MutationObserver`, which is what Cloud does today because ag-grid Community has
no status bar.

New `loadingIndicator` prop chooses what `isLoading` looks like over rows the
table already has: `'overlay'` (default) keeps them visible and dimmed behind a
spinner, `'skeleton'` replaces them with placeholders, `'none'` paints nothing
beyond `aria-busy`. With no rows yet, `overlay` and `skeleton` both fall back to
skeleton rows, and `none` renders an empty body rather than flashing the
`emptyLabel` before the first response.

`storageKey` persists the table's own state under
`cube-ui-kit:table:${storageKey}`, covering `pageSize` by default and `sort` on
request via `persist`. Controlled state is never stored.

Note that pagination and virtualization are alternatives: a 50-row page is under
`virtualizeThreshold`, so a paginated table normally renders every row. Use
`paginationMode="off"` for the long-scroll case.
