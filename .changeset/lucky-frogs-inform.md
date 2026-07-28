---
'@cube-dev/ui-kit': minor
---

Added the `InfoBadge` component — an informational icon with a tooltip. It renders as a plain `ItemBadge` by default and upgrades to an `ItemAction` link/button as soon as `to` or `onPress` is provided, so the same icon can point at the docs. The badge contains its own press events (including `preventDefault` on click), which lets it sit inside a bigger click target — a field `<label>`, a switch row, a table header — without activating it. When interactive, the tooltip gets a localized `Click to learn more.` suffix, which `tooltipSuffix` overrides or removes.

`size` is `small` | `medium` | `large` (default `medium`). Every size contributes exactly one line to the text around it, so the badge stays vertically aligned with adjacent text — in a field label, a table header, or mid-paragraph — whichever size you pick.

The info icon that fields render for their `tooltip` prop is now an `InfoBadge`, so clicking it no longer activates the field it labels.

`tooltip={{ title }}` on `ItemAction` and `ItemBadge` now accepts any `ReactNode` as the title. Rich titles are no longer used as the `aria-label` (previously they were stringified into it) — pass `aria-label` for those.

`ItemAction` and `ItemBadge` now treat an explicit `aria-label` as higher priority than the accessible name inferred from a string `tooltip`. Previously `ItemAction` let the tooltip win, so an `aria-label` passed alongside a string tooltip was silently dropped.
