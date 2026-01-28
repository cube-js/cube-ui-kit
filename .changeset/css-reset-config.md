---
"@cube-dev/ui-kit": minor
---

Add `cssReset` configuration option that injects a global CSS reset when styles are first generated. The reset includes sensible defaults for box-sizing, margins, typography, and form elements. It's wrapped in an unnamed `@layer` for lowest cascade priority. Disabled by default, can be enabled with `configure({ cssReset: true })`.
