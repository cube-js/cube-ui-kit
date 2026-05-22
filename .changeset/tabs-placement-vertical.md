---
'@cube-dev/ui-kit': minor
---

`Tabs`: add `placement` prop (`'top' | 'bottom' | 'left' | 'right'`, default `'top'`) for vertical and bottom tab strips. The selection indicator, scrolling, fade gradients, scroll arrows, drag-and-drop reorder visuals, `TabPicker` popover placement, and per-type visuals (radius, file-style shadow, dividers) all adapt automatically to the chosen axis.

The root `<TabsElement>` is now a flex wrapper holding the tab bar and the panels; the tab bar is available as the new `Bar` sub-element (use the `barStyles` prop or `styles={{ Bar: { ... } }}` to target it). DOM order stays "bar then panels" — visual order is controlled internally with `flex-direction` / `*-reverse`.

`FilterPicker`: add a `placement?: Placement` prop (default `'bottom start'`) forwarded to its `DialogTrigger`, so consumers can position the popover (used by `TabPicker` to render above / to the side of the strip based on the parent `Tabs` placement).

Breaking notes:

- `styles` prop on `Tabs` now targets the new outer flex wrapper. Use `barStyles` or the `Bar` sub-element selector to style the tab strip itself.
- Fade modifiers and CSS custom properties were renamed for axis neutrality: `fade-left` / `fade-right` → `fade-start` / `fade-end`; `--tabs-fade-left-color` / `--tabs-fade-right-color` → `--tabs-fade-start-color` / `--tabs-fade-end-color`. No back-compat aliases.
- The horizontal scrollbar sub-element `ScrollbarH` was renamed to the axis-neutral `Scrollbar` (it now drives the horizontal scrollbar for `top` / `bottom` placements and the vertical scrollbar for `left` / `right`).
- `type="narrow"` is coerced to `type="default"` when `placement` is `'left'` or `'right'` — its denser horizontal padding has no meaning in a vertical strip. For `default` / `narrow` types laid out vertically, the gap between tabs collapses to `1bw` so the strip reads as a single column.
- `tabListPadding` now controls all four sides of the tab list in vertical placements (`left` / `right`); horizontal placements still receive it only on the start/end edges as before. Default values: `1x` for horizontal `default` / `narrow`, `.5x` for vertical `default` / `narrow`.
