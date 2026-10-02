---
"@cube-dev/ui-kit": minor
---

- `Tabs.List` accepts `qa` and `qaVal`, applied as `data-qa` / `data-qaval` on the `role="tablist"` element, so tests can select the tab list without relying on `[data-element="TabList"]`.

- `Tabs` no longer sets `aria-controls` on the selected tab when that tab has no panel (navigation-only tabs, or a tab without content next to tabs that have it). The attribute used to point at a tabpanel id that nothing on the page had.

- `Tabs` keeps the active tab in view when the strip is mounted with a tab near its end active. The tab was scrolled into view before its actions (such as a `menu` trigger) were measured, so once every tab grew to its final width the active tab could end up past the edge of the strip or under a suffix button.
