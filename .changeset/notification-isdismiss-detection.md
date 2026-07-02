---
"@cube-dev/ui-kit": patch
---

Fix Notification rendering a duplicate "Dismiss" button when a custom `NotificationAction` with `isDismiss` is provided. Replaced the render-phase ref-mutation detection with deterministic static inspection of the `actions` tree, so the auto-appended "Dismiss" is reliably suppressed regardless of render order or concurrent rendering timing.
