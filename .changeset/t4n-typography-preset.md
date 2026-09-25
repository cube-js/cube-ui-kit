---
"@cube-dev/ui-kit": minor
---

Add the `t4n` typography preset: 12px text at normal (400) weight, with `t4`'s 18px line height. `t4` is 500 so small text keeps its presence next to 14px body text, and until now it had no lighter option — the only 12px/400 preset was the monospace `s4`, so secondary metadata such as timestamps and counts needed `preset: 't4'` plus a hand-set `fontWeight: 400`. Use `preset: 't4n'` instead.
