---
'@cube-dev/ui-kit': minor
---

Added unified support for `fieldProps`, `fieldStyles`, `labelProps`, and `labelStyles` across all field components. The `fieldStyles` and `labelStyles` props serve as shorthands for `fieldProps.styles` and `labelProps.styles` respectively, with shorthand props taking priority. All merging logic is centralized in the `wrapWithField` helper.

**Breaking changes:**
- Removed `wrapperStyles` prop from TextInputBase and Select components (use `styles` prop instead for the root element).
