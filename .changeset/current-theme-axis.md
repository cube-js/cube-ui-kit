---
'@cube-dev/ui-kit': minor
---

`current` moves from the `type` axis to the `theme` axis on `Button`, `Item` (and `ItemButton`), `Item.Action` and `ItemBadge`. It was never a shape: it names where the colors come from — the inherited `currentcolor` rather than a brand ramp — which is the question `theme` answers. As a type it occupied the slot that decides emphasis, so picking `current` meant giving up the choice between a filled button, an outlined one and a bare label.

On the `theme` axis it composes instead, and every type now has a `current` flavour:

- `item` — the old `Item` shape: no border, nothing painted at rest, the fill stepping in on hover, pressed and selected.
- `clear` — the same ramp plus the focus ring a standalone control needs. The default for `Item.Action` and `ItemBadge`.
- `outline` — the old `Button` shape: a resting `#current.03` chip inside a `#current.08` border.
- `outline-2` — `outline` for a container that is already painting something. The brand themes swap an opaque base (`#surface-3` for `#surface-2`); `current` has no opaque base to swap, so the same intent is carried by roughly doubling the tint at every step.
- `primary` — the high-emphasis control. Every other theme paints an opaque brand fill under a `#white` label; with one inherited color and an unknown surface behind it there is nothing to punch the label out with, so `primary` escalates the alpha ramp instead, resting at `#current.14`. It reads as filled, not as inverted.
- `link` — no chip at all. The brand themes intensify from `accent-text-soft` to `accent-text` on hover; here "soft" is the inherited color at `.8` and "strong" is it at full opacity.
- `card` — the static panel: a `#current.05` fill inside a `#current.2` border (`Item` only).

`current.outline` and `current.item` are byte-identical to the old `Button` and `Item` flavours, so nothing that used `type="current"` changes appearance.

The top step of each ramp stops at `#current.24`. That is the measured AA floor for a full-strength label on a dark surface — the one place this construction inverts, since the chip climbs toward an equally light label instead of away from a dark one.

### Migration

`type="current"` still renders, mapped to the flavour it used to be, and warns once in development:

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

The host theme still reaches the element, as `data-surface`: it names the surface an action is painted _on_, which is a different question from its own theme now that `current` occupies that axis. The `current` ramp reads it to pick the alphas that work over the `special` theme's fixed dark-purple surface — the job `data-theme` used to do before `theme="current"` claimed that attribute.

### Also

- `current` is registered in `TastyThemeNames`, so `theme="current"` autocompletes on every tasty component.
- New `CurrentStates` stories on `Button` and `Item` sweep every type and state on the theme, inside containers that paint their own text color; the context sweeps are renamed `CurrentTheme`.
