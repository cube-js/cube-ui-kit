---
'@cube-dev/ui-kit': minor
---

Add `Pagination` and the `usePagination` hook.

`Pagination` is a standalone control for paging through a collection. It renders
a bounded run of page buttons, optional first/last jumps, an optional page-size
selector, and an optional locale-formatted item-range summary.

```jsx
const [page, setPage] = useState(1);

<Pagination page={page} pageSize={50} total={1204} summary onPageChange={setPage} />;
```

- `type="numbers"` (the default) keeps the rendered element count independent of
  the page count — a million rows at 50 per page renders ~7 buttons, not 20 000
  elements. `type="select"` and `type="compact"` are also available; `select`
  falls back to `compact` above a safety cap rather than materializing an entry
  per page.
- Follows the kit's controlled/uncontrolled convention on both axes: `page` /
  `defaultPage` / `onPageChange` and `pageSize` / `defaultPageSize` /
  `onPageSizeChange`. Changing the page size resets to page 1.
- Omit `total` and `totalPages` and pass `hasNextPage` for cursor pagination
  with an unknown total; the control degrades to prev/next.
- `usePagination(items, options)` does client-side slicing on its own and is
  usable without the component.

Accessibility: a `<nav>` landmark, `aria-current="page"` on the current page,
an explicit `aria-label` on every icon-only button, and `aria-hidden` on the
`…` gap.
