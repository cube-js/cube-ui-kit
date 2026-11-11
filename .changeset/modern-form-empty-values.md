---
'@cube-dev/ui-kit': minor
---

**Form (modern controller):** an empty field (`''`, `undefined` or `null`) is left to `required`. `pattern`, `type` and `whitespace` no longer reject it (`min`, `max`, `len` and `enum` already passed it), so an optional field that was typed into and cleared can be submitted, and an untouched optional `type: 'email'` field no longer fails. Custom `validator` functions still run on empty values. If a rule relied on `pattern`, `type` or `whitespace` to reject an empty value, add `required: true` to it. A `transform` can't turn an empty value into a checked one: a cleared field passed through `Number` is still empty.

The dismiss prompt ("Discard changes?") no longer asks after a field is typed into and cleared back to an empty default, so dialogs don't need to seed `''` defaults for it. `isDirty` and `dirtyFields` are unchanged and still report `''` over an `undefined` default. The legacy `Form.useForm()` engine is unchanged.
