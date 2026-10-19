---
"@cube-dev/ui-kit": minor
---

Fields render their chrome only when there is something to show again: a `label`, a form binding, or a `description`, `errorMessage`, `message`, `fieldStyles`, `fieldProps` or `validate` prop, whatever it holds. A field with none of them renders only the control, as before 0.196.0, so a standalone control without a label no longer needs `isBare` to stay out of a field wrapper. `TagInput` keeps its chrome for its refusal messages. `isBare` still overrides a label and keeps it visually hidden, and `isBare={false}` now renders the chrome anyway, replacing the deprecated `forceField`, which renders it again too.
