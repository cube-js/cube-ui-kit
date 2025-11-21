---
'@cube-dev/ui-kit': patch
---

Fixed `id` and ARIA attributes duplication where they were incorrectly applied to both the field wrapper and the input element. The `id` prop is now correctly applied only to the element with `qa` and `data-input-type` attributes. The fix was implemented in the `wrapWithField` helper to automatically filter out `id` from `fieldProps` passed to the Field wrapper.

