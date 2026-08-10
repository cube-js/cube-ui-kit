---
'@cube-dev/ui-kit': minor
---

Add row virtualization to `ItemTable`.

A bounded table virtualizes automatically above `virtualizeThreshold` rows
(50 by default):

```jsx
<ItemTable height="420px" data={tenThousandRows} columns={columns} />
```

- `isVirtualized`: `'auto'` (default), or `true` / `false` to force it.
- The DOM and the styles are identical on both paths, so sorting, search, pinned
  columns and the sticky header behave the same either way.
- **Rows are measured, not assumed.** A column with `autoHeight` can wrap to a
  different number of lines per row and the window still tracks correctly —
  verified against 2,000 wrapping rows as well as 10,000 uniform ones.
- A native table cannot absolutely position a `<tr>` without breaking the table
  box, so the offset comes from leading and trailing spacer rows. Those are
  `aria-hidden`, and `aria-rowcount` / `aria-rowindex` keep describing the whole
  dataset rather than the mounted window.
- Rows are keyed by identity, never by index, so a recycled node can never be
  handed to a different row.
- The empty, error and loading states are never virtualized.

Also adds `autoHeight` on a column: the cell wraps and grows its row, and skips
the truncating `TextItem` it would otherwise render into.
