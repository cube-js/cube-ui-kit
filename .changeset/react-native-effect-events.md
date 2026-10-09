---
"@cube-dev/ui-kit": minor
---

Require React and React DOM 19.3 or newer. Upgrade both together before adopting this release. UI Kit now uses React's native compiler runtime and no longer supports React 18. Applications do not need to enable React Compiler to use the compiled package. Table search, popover subscriptions, portal mount notifications, drag cancellation and panel resize notifications use Effect Events to read current callback data while preserving their lifecycle behavior. ResizablePanel now accepts controlled size updates to zero. Probe output normalizes React 19.3 generated IDs.
