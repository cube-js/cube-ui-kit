---
"@cube-dev/ui-kit": minor
---

Require React and React DOM 19.3 or newer. Upgrade both together before adopting this release. UI Kit now uses React's native compiler runtime and no longer supports React 18. Applications do not need to enable React Compiler to use the compiled package. Table search and popover subscriptions use Effect Events to read current callback data while preserving their lifecycle behavior. Probe output normalizes React 19.3 generated IDs.
