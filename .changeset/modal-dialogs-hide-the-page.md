---
"@cube-dev/ui-kit": minor
---

A modal, fullscreen or tray `Dialog` now hides the page behind it from screen readers while it is open, so their reading cursor stays in the dialog. Lists, menus, popovers, tooltips and dialogs opened from inside it stay readable, and so do toasts; popover and panel dialogs leave the page readable. Content you portal out of a dialog yourself, with `Portal` or `createPortal`, is hidden with the page, so render it inside the dialog. In tests, the page behind an open modal is now `aria-hidden`: role queries skip it, and with `{ hidden: true }` they find its elements but not by name, so query them by text or `qa` instead.
