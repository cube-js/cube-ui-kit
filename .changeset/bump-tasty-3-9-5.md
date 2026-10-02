---
"@cube-dev/ui-kit": patch
---

Update `@tenphi/tasty` to 3.9.5, which fixes a crash when `flow` or `gap` meets an unset `display` branch (including a `null` default in a state map) and accepts `chain` in the overscroll-behavior longhands. `Board` widget chrome and `Popover` transitions now read the kit's duration tokens instead of hardcoded values, with the same timing. A board widget's outside resize grip now fades in with its intended 120 ms ease-in-out: listed after `opacity`, the `theme` group had overridden it with the default duration and easing.
