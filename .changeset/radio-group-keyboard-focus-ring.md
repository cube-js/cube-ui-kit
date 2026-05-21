---
'@cube-dev/ui-kit': patch
---

Fixed keyboard focus ring on `RadioGroup`:

- Classic `RadioGroup` (default `type="radio"`) — removed the redundant per-item wrapper outline; the inner radio circle already shows a `focused`-mod ring, and the duplicate wrapper ring driven by `:focus-within` also fired on mouse clicks.
- Button / Tabs `RadioGroup` (`type="button"` / `type="tabs"`) — added a keyboard-only focus ring on the group container itself (none was rendered before, since the per-item `Item` themes only swap the border color on focus). Implemented via React Aria's `useFocusRing({ within: true })` reading `isFocusVisible` (not `isFocused`), so mouse clicks don't trigger it.
