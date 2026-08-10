---
'@cube-dev/ui-kit': minor
---

Add a bulk action bar to `ItemTable`.

`bulkActions` offers actions while rows are selected, and implies
`selectionMode="multiple"` — a bulk action with no way to select rows is a
contradiction, not a configuration. Each action drives its own spinner through
`setLoading`, so one slow request does not freeze the others, and the selection
clears when the action resolves unless it opts out with `deselectAfter: false`.

`bulkBarPlacement="floating"` (the default) centres the bar over the body
without changing the table's height, so rows never shift under the cursor;
`"toolbar"` takes over the `actions` group instead. Escape clears the selection
from anywhere inside the table, and `ItemTable.BulkBar` is exposed as a compound
member for placing the bar outside the default chrome.

This replaces the pattern of injecting a selection bar into ag-grid's chrome,
which Community has no slot for.
