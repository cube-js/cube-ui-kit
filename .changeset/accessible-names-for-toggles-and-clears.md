---
"@cube-dev/ui-kit": minor
---

`Button` emits `aria-pressed` from `isSelected`, which its documentation has always promised and which every call site using `isSelected` for a real toggle had to hand-set alongside it. It is skipped where the attribute would be wrong: on a button rendered as a link (`to`), and on one the call site has given its own `role` — a selected tab or option wants `aria-selected` / `aria-current`, and only the call site knows which. An explicit `aria-pressed` still wins. Note that `isSelected={false}` now renders `aria-pressed="false"` rather than nothing, since that is what makes an unpressed toggle announce as a toggle.

`isClearable`'s built-in ✕ on `Select`, `Picker` and `FilterPicker` now has an accessible name. It was an icon-only `ItemAction` with neither `aria-label` nor `tooltip`, and `ItemAction` derives its name from exactly those two and warns for neither, so it reached a screen reader unnamed. The default is localized in all twelve locales; override it per call site with the new `clearLabel` prop.
