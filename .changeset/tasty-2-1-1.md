---
"@cube-dev/ui-kit": patch
---

Update `@tenphi/tasty` to `2.1.1`.

- Fix `$: '> SubElementName'` selector affix when the trailing element name matches the sub-element key (avoids duplicate key injection; placeholder behavior is correct).

Migrated: `TreeNode` uses `@ts-expect-error` for `Checkbox` `onChange` (react-types / `AriaCheckboxProps`).
