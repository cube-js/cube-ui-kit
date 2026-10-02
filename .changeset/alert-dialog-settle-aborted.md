---
"@cube-dev/ui-kit": patch
---

Fix three bugs in `useAlertDialogAPI().open()`. A `cancelToken` aborted before or while the dialog is open now rejects the promise with `undefined`, as Cancel does, instead of leaving it pending forever; a caller that aborts without handling that rejection now gets an unhandled rejection where its `await` used to hang. The default Ok button, shown when `actions.confirm` is omitted, now resolves `'confirm'` instead of rejecting like a dismissal. And a dialog opened while the previous one is still animating out now replaces it instead of being rejected as "Another dialog is already opened", so follow-up dialogs and dialogs opened from a mount effect under StrictMode show. The `AlertDialogApi`, `AlertDialogApiParams` and `AlertDialogResolveStatus` types are now exported, and the AlertDialog docs describe the imperative API.
