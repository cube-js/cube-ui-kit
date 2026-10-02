---
"@cube-dev/ui-kit": patch
---

`useAlertDialogAPI().open()` now settles when its `cancelToken` aborts. A signal aborted before or while the dialog is open rejects the promise with `undefined`, as Cancel does, instead of leaving it pending forever. A caller that aborts without handling that rejection now gets an unhandled rejection where its `await` used to hang. The `AlertDialogApi`, `AlertDialogApiParams` and `AlertDialogResolveStatus` types are now exported, and the AlertDialog docs describe the imperative API.
