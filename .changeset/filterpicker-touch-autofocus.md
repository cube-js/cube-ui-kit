---
"@cube-dev/ui-kit": patch
---

`FilterPicker` no longer focuses its search input when a touch or pen opens the popover, so a phone no longer raises the on-screen keyboard until the user taps the search. A mouse or keyboard open still focuses it. The `autoFocus` prop now works: `true` always focuses the search on open, `false` never does.
