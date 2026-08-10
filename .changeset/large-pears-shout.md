---
'@cube-dev/ui-kit': minor
---

Add the toolbar and search to `ItemTable`.

```jsx
<ItemTable
  data={deployments}
  columns={columns}
  isSearchable
  searchPlaceholder="Search deployments..."
  filters={<StatusFilter />}
  actions={<Button type="primary" icon={<PlusIcon />}>Create</Button>}
  onRefresh={refetch}
/>
```

The toolbar renders only when something needs it: `isSearchable`, `filters`,
`actions`, `onRefresh` or a custom `toolbar`. `ItemTable.Search` and
`ItemTable.Toolbar` read the table's state from context, so a bespoke toolbar
still has exactly one owner of the search term.

**The matcher is the point.** It tests each column's *display text* —
`format?.(value) ?? String(getValue(row))` — rather than the raw value, which
means:

- a formatted column matches what the user can actually see (`1,204`, not
  `1204`);
- a dotted `key` such as `owner.name` is searchable;
- a column holding an object with no `format` is **skipped**, not stringified —
  so the query "object" no longer matches every row with a nested value.

Opt a column out with `isSearchable: false`, or replace the matcher with
`searchFilter`.

Other behaviour worth knowing:

- `searchDelay` (default 500ms) debounces the filter **and** the callback in
  both modes; the input itself stays immediate.
- Searching selects `noResultsLabel` over `emptyLabel` automatically, so a
  client-search table distinguishes "no matches" from "nothing exists" without
  the page owning the term.
- `searchMode="server"` reports the debounced term and never filters.
- A controlled `searchValue` works with `isSearchable={false}`, so a page can
  render its own input anywhere and still drive the table's matcher — a
  first-class path rather than a workaround.
- Search runs before sorting, so a sort applies to the matches.
