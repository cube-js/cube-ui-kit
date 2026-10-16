---
"@cube-dev/ui-kit": patch
---

A field without a `label` no longer gets an empty label column with `labelPosition="side"`, set on the field or by its form: its control and texts start at the field's left edge, as with a top label. Since 0.195.0 gave label-less fields the field wrapper, that empty column pushed such a field to the right, so an `isBare` added only to undo the shift can go. This also moves a label-less field forced into the wrapper with the deprecated `forceField`, and a `Form.Item` without a `label` around other content, which used to line up with the labelled controls. To keep them there, pad them: `fieldStyles={{ padding: '$full-label-width left' }}`, or `styles` on a `Form.Item`.
