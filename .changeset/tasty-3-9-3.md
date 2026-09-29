---
'@cube-dev/ui-kit': patch
---

Update Tasty to 3.9.3 (from 3.9.2). Tasty used to drop a later state-map key whose value matched the default, so an earlier key won in the states the later one was written for. Several of the kit's style maps had that shape, so they now render as written.

**`Link` and `Button type="link"` with element children lose the button padding.** `<Link><span>Docs</span></Link>` measured 48×28px with 4px/7px padding; it now matches `<Link>Docs</Link>` at 34×20px with none. Links with text children or an icon are unchanged.

**Disabled fields keep a neutral border when they are also invalid or valid.** A disabled `TextInput` with `validationState="invalid"` kept a half-opacity danger border; it now has the same border as any disabled field. This covers every field on the shared input wrapper, including `TextInput`, `TextArea`, `PasswordInput`, `NumberInput`, `SearchInput`, `ComboBox`, `SearchComboBox` and the date and time inputs and pickers.

**Disabled and unavailable `Calendar` days no longer highlight on hover or press.** When a selected range covers such a day, the day keeps white text on its muted fill instead of dimmed text.
