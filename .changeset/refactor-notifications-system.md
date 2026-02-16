---
"@cube-dev/ui-kit": minor
---

Refactored notifications system: replaced `NotificationsProvider` and `ToastProvider` with unified `OverlayProvider`. Removed `NotificationsBar` and `NotificationsDialog` components. Introduced new `Notification` component API with `useNotifications` and `usePersistentNotifications` hooks. The Root component now uses `OverlayProvider` instead of separate providers.
