---
"@cube-dev/ui-kit": minor
---

`useAlertDialogAPI().open()` takes `onConfirm`, `onSecondary` and `onCancel` callbacks, so a dialog that runs its action in `onConfirm` needs no promise handling. When a handler returns a promise, the dialog waits for it: the pressed button shows a loading state, the other buttons are disabled and dismissal is blocked. It closes when the promise resolves, and stays open when it rejects or the handler throws, so the user can retry or cancel; the error is passed to `reportError`. `actions.confirm.onPress` and `actions.secondary.onPress` now get the same lifecycle instead of closing the dialog right away, and are deprecated in favour of `onConfirm` and `onSecondary`. A cancel still rejects `open()` with `undefined`, but it is no longer reported as an unhandled rejection when the returned promise is ignored.
