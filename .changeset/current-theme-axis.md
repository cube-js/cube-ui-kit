---
'@cube-dev/ui-kit': minor
---

`current` moves from the `type` axis to the `theme` axis on `Button`, `Item` (and `ItemButton`), `Item.Action` and `ItemBadge`. It was never a shape: it names where the colors come from — the inherited `currentcolor` rather than a brand ramp — which is the question `theme` answers. As a type it occupied the slot that decides emphasis, so picking `current` meant giving up the choice between a filled button, an outlined one and a bare label.

On the `theme` axis it composes instead, and every type now has a `current` flavour:

- `item` — the old `Item` shape: no border, nothing painted at rest, the fill stepping in on hover, pressed and selected.
- `clear` — the same ramp plus the focus ring a standalone control needs. The default for `Item.Action` and `ItemBadge`.
- `outline` — the old `Button` shape: a resting `#current.03` chip inside a `#current.08` border.
- `outline-2` — `outline` for a container that is already painting something. The brand themes swap an opaque base (`#surface-3` for `#surface-2`); `current` has no opaque base to swap, so the same intent is carried by roughly doubling the tint at every step.
- `primary` — the high-emphasis control, and the one flavour that fills opaquely, like every other theme's `primary`: the fill is the inherited color at full opacity and the label is punched out of it with the new `#current-fill` token, which defaults to `#surface` — the page background, which is always the opposite of the text painted on it and so follows the scheme for free. Hover and pressed lay a translucent `#black` over the same base, since an arbitrary color has no lighter or darker sibling to step to the way the brand ramps walk `accent-surface` to `-2` and `-3`. The rim comes from the same token at `.25` — every other `primary` rims its fill with `accent-surface-border`, cr 1.48 against it, and this measures 1.82 in light and 1.55 in dark. Disabled swaps the rim to `#surface-text.2`, which holds against a `.4` chip that a `#surface` rim would wash into. The label is painted with `-webkit-text-fill-color` rather than `color`: `#current` compiles to the literal `currentcolor`, which in `fill` resolves against the element's own `color`, so setting `color` to the label token would make the fill resolve to the label color and paint a white pill with a white label.

  `#current-fill` is a real color token with a default, not a bare custom property, so it takes the alpha suffix (`#current-fill.5` is the disabled label) and a container overrides it with one declaration — `styles={{ '#current-fill': '#fixed-dark' }}` — moving the label, the icon slots and the rim together. It exists for the one container the `#surface` default is wrong for: a container whose own text color IS the page paints `#white`, which IS `#surface` in light mode, so an unaided label measures cr 1.00 against its own chip. Its own fill is the right value there, since it contrasts with its own text by construction. Ordinary containers set nothing.
- `link` — no chip at all. The brand themes intensify from `accent-text-soft` to `accent-text` on hover; here "soft" is the inherited color at `.8` and "strong" is it at full opacity.
- `card` — the static panel: a `#current.05` fill inside a `#current.2` border (`Item` only).

`current.outline` and `current.item` are byte-identical to the old `Button` and `Item` flavours, so nothing that used `type="current"` changes appearance.

The top step of each ramp stops at `#current.24` in light. The dark counterpart is not authored: each `@dark` step is solved so its OKHST tone delta from the surface matches the light step's, which lands the two schemes on the same chip-vs-page contrast (1.084 / 1.083 at hover, 1.959 / 1.961 at the top step). That works out *lower* than the light alpha throughout — `.031 / .046 / .13 / .175 / .221` against `.04 / .06 / .18 / .24 / .3` — because near the dark end of the scale a small sRGB move is a large perceptual one, so the same tint reads stronger on a dark surface than on a light page.

### Migration

**`type="current"` is removed with no runtime fallback.** It resolves to no variant and falls back to base styles, the same as any other unknown type — there is no mapping and no deprecation warning. The spelling shipped one release ago and has no consumers outside the kit, so this is a clean break rather than a deprecation:

| Old                            | New                                                     |
| ------------------------------ | ------------------------------------------------------- |
| `<Button type="current">`      | `<Button theme="current">` (type defaults to `outline`) |
| `<Item type="current">`        | `<Item theme="current">` (type defaults to `item`)      |
| `<Item.Action type="current">` | drop it — `current` is already the default theme        |
| `<ItemBadge type="current">`   | drop it — `current` is already the default theme        |

`Item` accepts `theme="current"` with every type except `header`, which stays theme-agnostic; the warning that fired for `type="current"` with any theme but `default` is gone, since there is no longer such a pair to reject.

### `Item.Action` / `ItemBadge` defaults

`type` now defaults to `clear` and `theme` to `current`, and neither is read from `ItemActionContext` any more — the two axes are independent, so a shape no longer implies a color source and vice versa. Both defaults are plain values the lint registry can prove, which the previous `theme` entry (`skip: 'context'`) was not.

This changes one case: an action that named a `type` but no `theme` used to inherit the host row's theme, and now takes the host's color through `currentcolor` instead. Inside a themed row the two are close by construction — a `danger` row paints `#danger-accent-text`, which is what the action then mixes from — but the chip is an alpha tint rather than the brand ramp. Pass `theme="default"` (or any other theme) to opt back into a fixed palette.

`Banner` is the one in-repo consumer that needed a matching edit. Its actions ask for `type="outline"` and then cleared the border, because back then `outline` meant `note.outline` and friends — whose border is the opaque `#note-border`, a pale line built for a `#surface-2` chip on a light page and plainly wrong on a saturated banner. The fill carried the chip on its own there. On the `current` theme the border is `#current.08` mixed from the banner's own white label, and the fill is a 3% tint that cannot carry a chip by itself, so clearing the border left the action invisible. The override is gone and the type renders as designed.

`ItemActionContext` no longer reaches the DOM at all beyond `isDisabled`. An interim version of this branch published the host theme as a `data-surface` attribute so the `current` ramp could pick per-surface alphas for the `special` theme's fixed dark-purple surface; that is gone, because only `ItemAction` and `ItemBadge` ever set the attribute, so `Button` and `Item` on the same surface silently fell back to the light ramp.

### Two nesting fixes

Both fall out of `current.primary` keeping `color` as the fill rather than the label:

- The `Actions` slot is recolored to the label, like the icon slots already were — a nested `Item.Action` defaults to `theme="current"` and mixes its own label from the `currentcolor` it inherits, so without this it took the chip color and vanished into it.
- `ItemButton`'s `ActionsWrapper` reproduces the label rather than the chip, for the same reason on the sibling path.

### Also

- `current` is registered in `TastyThemeNames`, so `theme="current"` autocompletes on every tasty component.
- New `CurrentStates` stories on `Button` and `Item` sweep every type and state on the theme, inside containers that paint their own text color; the context sweeps are renamed `CurrentTheme`.
