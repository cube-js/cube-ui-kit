---
'@cube-dev/ui-kit': minor
---

`ItemAction` / `ItemBadge` now default to the inherited-color `current` flavour and stop mirroring the host row's `type` from context. (A later change in this release moves `current` from the `type` axis to the `theme` axis, so the default is spelled `theme="current"` with `type="clear"` — see "`current` moves from the `type` axis to the `theme` axis". The behaviour described here is unchanged by that move.) `current` derives every color from the inherited `currentcolor`, so one type covers every host type × theme combination that the context mapping used to enumerate — and, because `currentcolor` is inherited rather than resolved once, an action also follows its row through hover, selected and disabled instead of holding a fixed palette. The mapping in `ItemActionProvider` that folded `item` / `outline` / `outline-2` / `header` / `card` onto `clear` is gone.

`ItemActionContext` stays. It still carries `disableActionsFocus`, `isDisabled`, the `theme`, and `type` — the last only for its *presence*, which drives the `context` mod that collapses an action's side margins. The provider's signature is unchanged, so no call site moved.

Passing an explicit `theme` opts an action out of the inherited color and into that palette.

Supporting changes:

- **Selection reads as a filled chip.** Every other type marks `isSelected` with a brand *hue* — an accent-tinted fill under an accent label — and `current` has one inherited color to work with, so it cannot. Alpha is the only channel left, and the neutral types' `.09` step read as a slightly dirty background rather than an "on" state, so a selected `ItemAction` / `ItemBadge` looked unselected. Selection now jumps clear of the interaction steps (`.18` in light) instead of continuing them, while hover and press stay subtle so a row full of actions is not busy. On dark surfaces the same construction turns around — a light chip climbing toward an equally light label — and both the dark scheme and the special theme hit the AA floor for their label at exactly `.24`, so their steps are written under that measured ceiling and `selected` is a smaller jump there.
- **A scheme-aware alpha ramp.** Unlike the brand tokens, `#current` alphas do not adapt to the color scheme — a 4% tint of a dark label on a light surface reads far stronger than a 4% tint of a light label on a dark one. Each step now carries a per-surface value: the base entry for light, `@dark` for the dark scheme, and a single fixed ramp for the `special` theme's surface (special is static across light/dark/HC by design). Each step lives in its own custom property rather than inline in `fill`, because three ramps in one state-map would put ~18 alpha values where Tasty's `mergeEntriesByValue` pass coalesces equal value strings into one OR-entry at the group's max priority and breaks negation against lower-priority rules.
- **`ItemAction` regains a focus ring.** `CURRENT_ITEM_STYLES` follows the `*_ITEM_STYLES` convention of leaving focus to the collection that owns the row, which is wrong for a focusable action, so the ring came back on the action itself.
- **`ItemButton` paints its actions' color.** It renders actions as a sibling of the button rather than inside it — deliberately, so they are not nested in a `<button>` — so `currentcolor` reached them from the page instead of the row: a `danger` row handed its actions neutral text, and a `special` row handed them the page's *dark* text to tint on a dark purple surface. `ActionsWrapper` now carries the row's resting color, derived from the variant map rather than restating the palette.
- **One variants map.** `Item`'s inline `theme.type` → styles object is now the exported `ITEM_VARIANTS`, shared with the color projection above so the two cannot drift.

Every clear and trigger button across the field components now relies on that default instead of pinning a `type` or a validation `theme`: `Select`, `Picker`, `FilterPicker`, `ComboBox`, `SearchComboBox` and `SearchInput` clear buttons, `PasswordInput`'s masking toggle, `ColorInput`'s pipette, `DatePicker`'s calendar button and the ComboBox / SearchComboBox triggers. Each one now takes the color of the field it sits in, so it follows a custom theme rather than staying pinned to `default.clear`.

Where that changes rendering, it changes it toward matching the field's own text:

- `Picker` / `FilterPicker` clear buttons are unchanged — their trigger text already carries validation state, so the inherited color equals what the explicit theme produced.
- `ComboBox` / `SearchComboBox` / `SearchInput` clear buttons and the ComboBox trigger move from the fixed `danger.clear` label to the input's own `#danger-accent-text` when invalid. The trigger previously stayed neutral beside red input text.
- `PasswordInput`'s toggle now tints with the field instead of always rendering neutral.
- `Select`'s clear button no longer turns red when the field is invalid. Its trigger keeps **neutral** label text in that state, so the button now matches its own field, and the red border still signals invalidity. `Picker` and `FilterPicker` are also `Item`-based but do tint their trigger text — that inconsistency lives in `Select` and is worth fixing there rather than being masked by a themed clear button.

`ItemAction` / `ItemBadge` `type` therefore returns to a plain default in the lint registry. The `skip: 'context'` classification it was given existed because the prop resolved through `ItemActionProvider`; it no longer does. `isDisabled` is still context-resolved and still skipped.
