---
"@cube-dev/ui-kit": minor
---

Add new `mode` prop to `Layout.Panel` with support for `sticky` and `overlay` modes:

- `sticky` - Panel floats over content without pushing it aside
- `overlay` - Panel with dismissable backdrop (closes on backdrop click, Escape key, or focus change to main content)

New props: `mode`, `isDismissable`, `overlayStyles`
