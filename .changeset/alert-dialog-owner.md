---
"@cube-dev/ui-kit": minor
---

A dialog opened with `useAlertDialogAPI()` now belongs to the component that called the hook and closes, as a cancel, when that component unmounts, so its callbacks no longer run against a component that is gone. `onCancel` runs and the promise rejects with `undefined`, as for an aborted `cancelToken`. A call to `open` after the unmount settles as a cancel without opening. Call the hook in a component that stays mounted while the dialog is open: a dialog opened by a menu item that unmounts when the menu closes now closes with it, so call the hook in the component that renders the menu. When the unmount or an aborted `cancelToken` comes while a confirm or secondary action is running, the action now finishes first: the dialog closes with its result, or as a cancel if it fails.
