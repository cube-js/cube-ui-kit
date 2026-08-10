---
'@cube-dev/ui-kit': minor
---

Add `ItemTable` — a data-driven table for lists of records.

Columns are declared as data rather than JSX, so a table is a props object
rather than a tree:

```jsx
<ItemTable
  data={deployments}
  columns={[
    { key: 'name', title: 'Name', isRowHeader: true, flex: 2 },
    { key: 'status', title: 'Status', width: 140,
      render: (v) => <Tag theme={STATUS[v]}>{v}</Tag> },
    { key: 'owner.name', title: 'Owner' },
    { key: 'queries', title: 'Queries', align: 'end',
      format: (v) => v.toLocaleString() },
  ]}
  ariaLabel="Deployments"
  height="400px"
/>
```

This first release covers the rendering core:

- **Column model** with `key` as a dot-notation data path, `width`/`flex`/
  `minWidth`/`maxWidth` sizing resolved against a measured container, `pin:
  'start' | 'end'`, `align`, `isHidden` and `isRowHeader`.
- **A value pipeline** — `getValue`, `format`, `compare` — separate from
  `render`. A column whose displayed text differs from its raw value stays
  sortable, searchable and copyable, and an object-valued column with no
  `format` renders empty rather than `"[object Object]"`.
- **Rich column headers**: `header` maps 1:1 onto an `Item`, so a header can
  carry an icon, description, tooltip, suffix and actions.
- **Loading, empty, no-results and error states**, with `isFiltered` selecting
  "no matches" over "nothing exists".
- **Per-row visuals** through `getRowProps`.
- Sticky header, sticky pinned columns, striped rows, and five size steps.

Defaults are tuned to match the existing Cloud tables: 40px rows and a 32px
header (each plus its 1px separator), 16px horizontal cell padding, and a `c3`
uppercase caption header in `#dark-03`. `headerPreset` changes the header
typography in one place — the header `Item` inherits from the cell, so the whole
header restyles together.

Styling goes through tasty **sub-elements** on the single `styles` prop —
`Scroller`, `Table`, `Head`, `HeadRow`, `HeaderCell`, `Body`, `Row`, `Cell`,
`Foot`, `FootRow`, `FootCell`, `StateContent` — with `headerStyles`,
`headerCellStyles`, `bodyStyles`, `rowStyles` and `cellStyles` as aliases.

Accessibility: a real `<table role="grid">` with 1-based, document-absolute
`aria-rowcount` / `aria-colcount` / `aria-rowindex` / `aria-colindex`,
`<th scope="row">` for the row-header column, and `aria-busy` while loading.

Sorting, selection, toolbar/search, pagination, row menus, virtualization and
drag & drop follow in subsequent releases, as does the sibling `DataTable`.
