---
'@cube-dev/ui-kit': minor
---

`Button` can collapse to fit a narrow window or container. `collapseState` says when: `true` for `@mobile`, a viewport narrower than 920px, or any state or condition, such as `'@(page, w < 864px)'`; it works in CSS, so crossing it re-renders only the button. `isCollapsed` collapses it from JavaScript, and the button collapses when either says so. Collapsed, a button with an icon shows only the icon, its label kept as the accessible name and shown as the tooltip, and a button with a `shortLabel` shows that label instead. A button with neither warns that it has nothing to collapse to. UI Kit now registers the `@mobile` state (`@media(w < 920px)`) for every component's styles.
