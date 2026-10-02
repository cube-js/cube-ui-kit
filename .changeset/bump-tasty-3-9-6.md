---
"@cube-dev/ui-kit": patch
---

Update `@tenphi/tasty` to 3.9.6. It fixes a crash when `flow` or `gap` meets an unset `display` branch (including a `null` default in a state map), accepts `chain` in the overscroll-behavior longhands, and lets a `transition` entry that names one property keep its own timing when a group such as `theme` that covers it comes later. That gives a board widget's outside resize grip its intended 120 ms ease-in-out fade instead of `theme`'s default timing. `Board` widget chrome and `Popover` transitions now also read the kit's duration tokens instead of hardcoded values, with the same timing.
