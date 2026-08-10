---
'@cube-dev/ui-kit': minor
---

Add sorting to `ItemTable`.

Mark columns `isSortable` and clicking (or pressing Enter/Space on) a header
cycles `ascending → descending → unsorted`:

```jsx
<ItemTable
  data={rows}
  columns={[
    { key: 'name', title: 'Name', isSortable: true },
    { key: 'queries', title: 'Queries', isSortable: true,
      format: (v) => v.toLocaleString() },
  ]}
  defaultSort={{ columnKey: 'queries', direction: 'desc' }}
/>
```

- `sortMode`: `'client'` (default when any column is sortable) reorders `data`
  itself; `'server'` reflects the state and fires `onSortChange` without ever
  reordering; `'off'` removes the affordance.
- Controlled via `sort`, uncontrolled via `defaultSort`, both reporting through
  `onSortChange`.
- The cycle is tri-state so the source order is always reachable. Set
  `disallowSortRemoval` on a column for `asc ↔ desc` only.
- Client-side comparison is numeric for numbers, chronological for dates, and
  otherwise a locale-aware collator over the column's **display text** — so a
  column with `format` sorts the way it reads. `compare` overrides all of it.
  Nullish values sort first, then flip with the direction.
- The sort is stable, and `data` is never mutated.

Accessibility: `aria-sort` is set on the sorted header only, sortable headers
are keyboard-operable, and the sort arrow reserves its space so toggling a sort
never shifts the label.
