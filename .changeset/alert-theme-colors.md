---
"@cube-dev/ui-kit": patch
---

Make `Alert` themes recognisable at a glance: `note`, `success`, `danger` and `warning` now use their own, more tinted fill and border, through new `#<theme>-alert-surface` and `#<theme>-alert-border` tokens on those four themes. The shared `#<theme>-surface` / `#<theme>-border` tokens, the default and primary themes, Badge and the Item family are unchanged. Also fix `theme="special"` rendering dark text on its purple fill: the label is now white.
