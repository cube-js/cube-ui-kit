---
'@cube-dev/ui-kit': minor
---

**Tabs**: `Tab`'s `title` prop is now optional, enabling icon-only tabs via the `icon` / `rightIcon` slots. When `title` is omitted, supply an `aria-label` (and typically a `tooltip`) so the tab retains an accessible name. Added a `VerticalIconOnly` story demonstrating this with `placement="left"` and `tabListPadding="1x"`.
