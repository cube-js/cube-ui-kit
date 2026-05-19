---
'@cube-dev/ui-kit': minor
---

**Breaking:** Renamed the special `icon` string from `'checkbox'` to `'checkmark'` on `Item`, `ItemAction`, and `ItemBadge` since the rendered glyph is a checkmark, not a checkbox. Replace `icon="checkbox"` with `icon="checkmark"`. The associated `checkbox` style modifier was renamed to `checkmark` accordingly.
