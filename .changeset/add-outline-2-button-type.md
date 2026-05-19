---
'@cube-dev/ui-kit': minor
---

Added a new `outline-2` type. It mirrors `outline` but paints over `#surface-3` instead of `#surface-2`, so the component stays visually distinct when placed inside a `#surface-2` container. The matching theme constants (`DEFAULT_OUTLINE_2_STYLES`, `DANGER_OUTLINE_2_STYLES`, `SUCCESS_OUTLINE_2_STYLES`, `WARNING_OUTLINE_2_STYLES`, `NOTE_OUTLINE_2_STYLES`) are exported from `data/item-themes`. `outline-2` is wired into `Button`, `Item` (and every component that goes through `Item` — `ItemButton`, `ItemAction`, `ItemBadge`, `Select`, `FilterPicker`, `Picker`, `Menu`, etc.). The `special` theme intentionally has no `outline-2` variant (it paints over `#special-surface`); pairing `theme="special"` with `type="outline-2"` falls back to `outline`.
