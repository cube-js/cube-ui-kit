---
"@cube-dev/ui-kit": minor
---

`Layout.Header` takes a `titlePreset` prop (`h1`–`h6`) that sets the title's typography preset apart from its `level`, so a page title can be an `h1` in the document outline and look like an `h3`: `<Layout.Header title="Billing" level={1} titlePreset="h3" />`. It replaces a `styles={{ Title: { preset } }}` override, which `tasty/no-protected-restyle` reports.
