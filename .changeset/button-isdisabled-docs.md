---
'@cube-dev/ui-kit': patch
---

`Button`'s docs now list `isDisabled` with its `false` default, so the `no-redundant-default-prop` lint rule flags a redundant `isDisabled={false}` on `Button`. They and the `Form` docs also say that `<Provider isDisabled>` and `<Form isDisabled>` disable fields and `Form.Submit`/`Form.Reset`, but not `Button`, `ItemButton` or `ItemAction`.
