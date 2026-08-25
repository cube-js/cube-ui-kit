# Item / Button theme styles — knowledge

## Tasty value-collision pitfall in fill state-maps

`@tenphi/tasty` runs a `mergeEntriesByValue` pass before exclusive-condition building. Entries in the same state-map that share an **identical serialized value** are merged into a single entry whose priority is the _max_ of the merged group, and whose condition is the OR of the original conditions.

Source order = priority (later keys = higher priority). The merged entry then **negates against all lower-priority entries**. This breaks intent when two states with different "scopes" share the same alpha:

```ts
// BUG — `'hovered | focused'` (p1) and `'selected & disabled'` (p7)
// share `#white.12`. They merge at priority 7 with condition
// `(hovered | focused) | (selected & disabled)`. The
// `'selected & (hovered | focused)'` rule (p4) then gets exclusive
// `... & !(merged)` which simplifies to FALSE for `selected & hovered`
// — so selected-hover renders as `#white.12` instead of `#white.94`.
fill: {
  '': '#white.0',
  'hovered | focused': '#white.12',
  pressed: '#white.18',
  selected: '#white',
  'selected & (hovered | focused)': '#white.94',
  'selected & pressed': '#white.88',
  disabled: '#white.0',
  'selected & disabled': '#white.12', // ⚠ collides with `'hovered | focused'`
},
```

**Rule:** every alpha step within a single `fill` (or any) value-map must be a unique string, or the merge must produce a semantically meaningful disjunction (e.g. `pressed: '#tint.09'` + `selected: '#tint.09'` → merged `pressed | selected` is fine because it correctly captures both plain-pressed and plain-selected at the same .09 level, while higher- priority compound rules handle the combined cases).

The default key (`''`, `TrueCondition`) is exempt from merging — Tasty keeps it separate from non-default entries — so `'': '#x.0'` and `disabled: '#x.0'` is safe.

When you need two states to look visually identical, prefer either:

1. Pick a slightly different alpha (`.12` vs `.16` reads as the same step to the eye but is a distinct value string), or
2. Restructure so the merged OR-condition is intentional (e.g. let `pressed` and `selected` collapse to one entry on purpose).

See `SPECIAL_OUTLINE_STYLES` and `SPECIAL_CLEAR_STYLES` in `item-themes.ts` for the concrete fix and inline notes.
