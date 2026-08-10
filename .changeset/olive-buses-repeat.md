---
'@cube-dev/ui-kit': patch
---

Fix three things the cell and row contexts were reporting wrongly.

- `CubeTableCellContext.section` was hardcoded to `'body'`, so a `render`,
  `cellStyles` or `cellProps` callback could not tell a pinned total from a row
  of data through the documented context — the one thing that context exists
  for.
- `CubeTableCellContext.isSelected` was hardcoded to `false`, so a cell renderer
  could never react to its row being selected.
- `DataTable`'s row numbers restarted at 1 on every page in `paginationMode="server"`.
  The offset was only computed for client paging, though the page and its size
  are equally known in server mode, and the documentation promises the count
  stays continuous. Only `'off'` starts at 1 now, because then there is no page
  to be on.

`isRowFocused` / `isDropTarget` (and `isFocused` on the row context) were
hardcoded `false` for the same reason, and are now **optional and absent**
rather than required-and-lying. There is nowhere honest to compute them where
the context is built: focus lives in the DOM, and drop state comes from
`useDropIndicator`, a hook that can only run inside the row component. Wiring
them means moving the `render` / `cellStyles` call sites into `TableRow`, which
is a bigger change than this fix.
