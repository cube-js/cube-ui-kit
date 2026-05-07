---
'@cube-dev/ui-kit': patch
---

`TextInput` and other inputs that consume the `input-autofill` recipe now correctly suppress Chrome's autofill background and `appearance: menulist-button` when a suggestion is selected or previewed. The `@autofill` alias was extended to cover `:autofill`, `:-internal-autofill-selected`, and `:-internal-autofill-previewed` in addition to `:-webkit-autofill`, and the inset background now uses the `#surface` token instead of a hard-coded white.
