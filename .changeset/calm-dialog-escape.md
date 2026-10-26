---
"@cube-dev/ui-kit": patch
---

Keep dialogs, trays and popovers open when a control inside already handles Escape, such as a code editor closing autocomplete. The handled key also stays inside the overlay, so an enclosing dialog stays open.
