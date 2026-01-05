---
"@cube-dev/ui-kit": patch
---

Fix FieldWrapper tooltip prop to properly support ReactNode values, not just strings. Previously, ReactNode tooltips (like JSX fragments) were incorrectly cast to strings, causing them to fail.
