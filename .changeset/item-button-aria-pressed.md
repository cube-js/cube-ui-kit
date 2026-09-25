---
"@cube-dev/ui-kit": patch
---

`ItemButton` announces `isSelected` as `aria-pressed`, as its documentation says, instead of `aria-selected`. `aria-selected` is not a state of role `button`, so screen readers ignored it and a toggle or multi-select built from `ItemButton isSelected` read as a plain button. `isSelected={false}` renders `aria-pressed="false"`, so an unpressed toggle announces as one. As on `Button`, it is skipped for a link (`to`) and for a call site's own `role` — a tab or option keeps `aria-selected` — and also for a trigger that reports `aria-expanded`, such as `Disclosure.Trigger`. An explicit `aria-pressed` still wins. A selector that found a selected toggle `ItemButton` by `[aria-selected="true"]` should use `[aria-pressed="true"]`.
