---
"@cube-dev/ui-kit": patch
---

A field without a `label` no longer keeps an empty label column with `labelPosition="side"`, set on the field or by its form. Since label-less fields bound to a form got the field wrapper in 0.195.0, such a field sat a label's width to the right; its control and texts now start at the field's left edge, as they do with a top label. The same goes for one forced into the wrapper with the deprecated `forceField`. An `isBare` added only to undo that shift can go. Labelled side fields are unchanged.
