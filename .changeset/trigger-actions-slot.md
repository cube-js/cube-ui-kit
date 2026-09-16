---
'@cube-dev/ui-kit': minor
---

`Select`, `Picker` and `FilterPicker` now render their trailing controls — your `actions`, the clear button, the loading spinner and the dropdown caret — through the same actions slot `ItemButton` uses, instead of the bespoke run added alongside the `actions` prop. Closes #1398.

The visible result is meant to be nothing: the trigger renders pixel-identically across sizes, types, themes, validation states and the loading, placeholder, icon-only and clearable variants, in light and dark. What changes is the DOM and the behaviour that depends on it.

- **The clear button is no longer a `<button>` nested inside a `<button>`.** The whole trailing run is now a sibling of the trigger, laid over its end.
- **The caret still opens the popover** even though it sits in that run: the run is transparent to the pointer and only its interactive children take presses, so a press on the caret — or anywhere in the run's padding — hit-tests through to the trigger underneath. This is covered by a browser spec; jsdom implements neither `pointer-events` nor hit testing and would pass against a build where the caret is dead.
- **The trigger's markup no longer changes shape** as a clear button appears, a spinner replaces the caret, or actions come and go.
- `rightIcon` keeps its own slot, so a render function resolved against the trigger's modifiers and any `RightIcon` styles keep working. It replaces the built-in control exactly as before; if you also pass `actions`, they render after it.

`ItemButton` and `Item` share the mechanism, so three things change for rows with actions:

- **Actions are centred on the row's height**, instead of on the size token. A row with an inline description, or one whose height the caller set, now keeps its actions on its centre line rather than pinned near the top. A row with a **block** description is unchanged: there the run stays on the first line beside the label. An action is still `$action-size` whatever the row's height, so a tall row does not get oversized buttons.
- **The actions run is transparent to the pointer**, so a press in its padding or in a gap between two actions activates the row instead of being swallowed. The actions themselves are unaffected.
- **A `suffix` next to actions no longer adds its inline padding**, matching what it already did next to a `rightIcon` — the actions column carries the spacing. The gap between a suffix and the first action narrows accordingly.

`ItemButton` also keeps its wrapper element once a row has had actions, so a row whose actions depend on a permission or a loading flag no longer remounts its button when they disappear, and it gains an `actionsProps` prop for attributes on the run's container.

Sibling actions now follow the row's **pressed** colour as well as its resting and disabled ones, so a caret or an action beside a label no longer stays at its resting tint while the label darkens under the finger.
