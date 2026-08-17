---
'@cube-dev/ui-kit': patch
---

`Item` themes: a disabled item now keeps showing whether it is selected. The `disabled` entry in every `outline`, `outline-2` and `clear` variant used to override `selected` outright, so a disabled segmented control — `RadioGroup type="button"` most visibly — rendered every option identically with no sign of which one was active. Each of those variants gains a `selected & disabled` state that paints the brand-tinted `accent-disabled-surface` chip and its paired label instead of the neutral one, across all six themes (`special` and `current` stay in their own white-alpha / `currentcolor` registers). `type="item"` rows are unchanged — they already keep brand identity in their disabled label and pair selection with a checkmark.
