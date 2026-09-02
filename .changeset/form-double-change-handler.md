---
'@cube-dev/ui-kit': patch
---

Fix form-connected inputs running their field handlers twice: `useFieldProps` merged the field's own `onChange`/`onBlur` on top of the handlers the value mapper had already wired, and `mergeProps` chained the pairs. Every user change and every blur reached the form twice, so change- and blur-triggered validation started two runs and async validators (including ones that call an API) were invoked twice. Each now runs once; the input's own `onChange`/`onBlur` props still fire once, before the field's.
