---
'@cube-dev/ui-kit': patch
---

Form: `<Form>` is now a facade that renders the legacy root, legacy instances carry a backend brand, and input components keep a stable hook order when `name` or the surrounding form changes instead of throwing.
