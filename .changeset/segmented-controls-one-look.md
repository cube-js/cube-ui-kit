---
"@cube-dev/ui-kit": patch
---

`Radio.Tabs` (`RadioGroup type="tabs"`) now looks like `Tabs type="radio"`, and both take that look from one shared style definition; only the layout differs, as before (its options size to their labels, while tabs share the track equally). Its text is the size `Tabs` uses (12px at the default size, 14px at `large`), its track has the same rounder corners, the selected label stays soft rather than dark, an idle option lightens on hover instead of darkening, and hover moves at the tab speed. The keyboard focus ring sits inside the focused option, as on a tab, instead of around the whole group. A disabled group keeps its white selected chip and shadow and fades only the labels. Nothing changes for `Tabs`, `type="button"` radio groups or classic radios.
