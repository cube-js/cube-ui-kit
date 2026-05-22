---
'@cube-dev/ui-kit': minor
---

**Breaking:** Removed the `neutral` and `secondary` values from the `type` prop on `Button`, `ButtonSplit`, `Item`, `ItemAction`, `ItemBadge`, and `ItemButton`, and from `buttonType` on `RadioGroup`. Their visuals are now expressed through the existing `clear` and `outline` types combined with `isSelected`:

- `type="neutral"` → `type="clear"`
- `type="clear"` (selected look) → `type="clear" isSelected`
- `type="secondary"` → `type="outline" isSelected`

Default `type` for `ItemAction`, `ItemBadge`, and `ItemButton` changed from `neutral` to `clear`. `ItemBadge` now accepts the full `'primary' | 'outline' | 'clear' | 'link'` union and supports `isSelected`.
