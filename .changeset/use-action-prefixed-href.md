---
"@cube-dev/ui-kit": patch
---

`Link`, `Button`, `ItemButton` and every other `to`-driven action no longer resolve a `!` or `@` prefixed `to` through the router. The rendered `href` was already correct, but the raw value was resolved too, so `<Link to="!https://cube.dev">` — the documented way to open an external URL in a new tab — made a `HashRouter` warn on every render. Only the stripped path is resolved now.
