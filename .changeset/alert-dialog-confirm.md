---
"@cube-dev/ui-kit": minor
---

Add `confirm` to `useAlertDialogAPI()`. It opens the dialog like `open`, but resolves `'cancel'` when the user presses Cancel, presses Escape, clicks outside, or the `cancelToken` aborts, so a forgotten `.catch` no longer leaves an unhandled rejection. It still rejects with an `Error` when another alert dialog is already open. `'cancel'` is truthy, so compare the result (`status === 'confirm'`) rather than testing it. `open` keeps its contract, but a `cancelToken` that aborts, before or while the dialog is open, now rejects its promise with `undefined` instead of leaving it pending forever. The `AlertDialogApi`, `AlertDialogApiParams`, `AlertDialogResolveStatus` and `AlertDialogConfirmStatus` types are now exported, and the AlertDialog docs describe the imperative API.
