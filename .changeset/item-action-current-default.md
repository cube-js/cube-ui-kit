---
'@cube-dev/ui-kit': minor
---

`ItemAction` / `ItemBadge` now default to `type="current"` and stop mirroring the host row's `type` from context. `current` derives every color from the inherited `currentcolor`, so one type covers every host type × theme combination that the context mapping used to enumerate — and, because `currentcolor` is inherited rather than resolved once, an action also follows its row through hover, selected and disabled instead of holding a fixed palette. The mapping in `ItemActionProvider` that folded `item` / `outline` / `outline-2` / `header` / `card` onto `clear` is gone.

`ItemActionContext` stays. It still carries `disableActionsFocus`, `isDisabled`, the `theme`, and `type` — the last only for its *presence*, which drives the `context` mod that collapses an action's side margins. The provider's signature is unchanged, so no call site moved.

Passing an explicit `theme` opts an action out of `current` and back to `clear`, since `current` is theme-agnostic by construction and the theme would otherwise have nothing to color. The `theme="default"` case is excluded from that fallback: passing a prop's own default value must not change what renders, which is the invariant `no-redundant-default-prop` lints for.

Supporting changes:

- **A scheme-aware alpha ramp.** Unlike the brand tokens, `#current` alphas do not adapt to the color scheme — a 4% tint of a dark label on a light surface reads far stronger than a 4% tint of a light label on a dark one. Each step now carries a per-surface value: the base entry for light, `@dark` for the dark scheme, and `theme=special` as a single fixed ramp (special is static across light/dark/HC by design). Each step lives in its own custom property rather than inline in `fill`, because three ramps in one state-map would put ~18 alpha values where Tasty's `mergeEntriesByValue` pass coalesces equal value strings into one OR-entry at the group's max priority and breaks negation against lower-priority rules.
- **`ItemAction` regains a focus ring.** `CURRENT_ITEM_STYLES` follows the `*_ITEM_STYLES` convention of leaving focus to the collection that owns the row, which is wrong for a focusable action. The ring moves to `ItemAction`'s base styles, where every variant's own `outline` still overrides it, so only `current` is affected.
- **`ItemButton` paints its actions' color.** It renders actions as a sibling of the button rather than inside it — deliberately, so they are not nested in a `<button>` — so `currentcolor` reached them from the page instead of the row: a `danger` row handed its actions neutral text, and a `special` row handed them the page's *dark* text to tint on a dark purple surface. `ActionsWrapper` now carries the row's resting color, derived from the variant map rather than restating the palette.
- **One variants map.** `Item`'s inline `theme.type` → styles object is now the exported `ITEM_VARIANTS`, shared with the color projection above so the two cannot drift.

Every clear and trigger button across the field components now relies on that default instead of pinning a `type` or a validation `theme`: `Select`, `Picker`, `FilterPicker`, `ComboBox`, `SearchComboBox` and `SearchInput` clear buttons, `PasswordInput`'s masking toggle, `ColorInput`'s pipette, `DatePicker`'s calendar button and the ComboBox / SearchComboBox triggers. Each one now takes the color of the field it sits in, so it follows a custom theme rather than staying pinned to `default.clear`.

Where that changes rendering, it changes it toward matching the field's own text:

- `Picker` / `FilterPicker` clear buttons are unchanged — their trigger text already carries validation state, so the inherited color equals what the explicit theme produced.
- `ComboBox` / `SearchComboBox` / `SearchInput` clear buttons and the ComboBox trigger move from the fixed `danger.clear` label to the input's own `#danger-accent-text` when invalid. The trigger previously stayed neutral beside red input text.
- `PasswordInput`'s toggle now tints with the field instead of always rendering neutral.
- `Select`'s clear button no longer turns red when the field is invalid. Its trigger keeps **neutral** label text in that state, so the button now matches its own field, and the red border still signals invalidity. `Picker` and `FilterPicker` are also `Item`-based but do tint their trigger text — that inconsistency lives in `Select` and is worth fixing there rather than being masked by a themed clear button.

`ItemAction` / `ItemBadge` `type` therefore returns to a plain `'current'` default in the lint registry. The `skip: 'context'` classification it was given existed because the prop resolved through `ItemActionProvider`; it no longer does. `isDisabled` is still context-resolved and still skipped.
