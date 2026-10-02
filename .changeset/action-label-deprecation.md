---
"@cube-dev/ui-kit": minor
---

The `label` property of `Button`, `ItemButton`, `ItemAction`, `Action` and `InfoBadge` is deprecated, and passing it logs a one-time warning in development. Use `children` for a button's visible text and `aria-label` for the accessible name of an icon-only control. `label` keeps working where it worked before, but `ItemAction` never applied it, so an icon-only `ItemAction` named only through `label` had no accessible name. Give it an `aria-label` (or a string `tooltip`). For `AlertDialog` actions and `DialogForm`'s `submitProps` / `cancelProps`, set the text with `children`, as in `actions={{ confirm: { children: 'Delete' } }}`. A `label` passed there still wins over the default text.
