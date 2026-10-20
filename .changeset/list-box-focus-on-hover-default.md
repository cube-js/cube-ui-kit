---
"@cube-dev/ui-kit": patch
---

The `no-redundant-default-prop` lint rule no longer reports `focusOnHover={true}` on `ListBox` as a restated default, and reports `focusOnHover={false}` instead. The docs had given its default as `true`, but it is `false`: removing `focusOnHover={true}` as the rule suggested stopped options from taking focus on hover.
