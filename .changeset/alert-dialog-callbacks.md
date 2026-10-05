---
"@cube-dev/ui-kit": minor
---

`useAlertDialogAPI().open()` takes `onConfirm`, `onSecondary` and `onCancel` callbacks. When `onConfirm` or `onSecondary` returns a promise, the dialog waits for it: the pressed button shows a loading state, the other buttons are disabled and dismissal is blocked. It closes when the promise resolves, and stays open when it rejects or the handler throws, so the user can retry or cancel; the error is passed to `reportError`. `useAlertDialogAPI({ resolveOnCancel: true })` opts that hook's `open` into resolving `'cancel'` instead of rejecting with `undefined` when the dialog closes without an action, so callers no longer have to catch a cancel. Without the option, `open` behaves as before. The option is planned to become the default in a later release, and the AlertDialog docs describe how to migrate. The `AlertDialogApiOptions` and `AlertDialogStatus` types are exported.
