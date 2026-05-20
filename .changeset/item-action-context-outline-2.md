---
'@cube-dev/ui-kit': patch
---

Fixed `ItemAction` and `ItemBadge` rendering without variant styles when nested inside an `Item` / `ItemButton` with `type="outline-2"`. `ItemActionContext` now collapses `'outline-2'` to `'clear'` for child actions, matching the existing behavior for `'outline'` / `'item'` / `'header'` / `'card'`.
