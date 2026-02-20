# Style Extend Specification

## Problem

`mergeStyles` replaces style values wholesale. When a style property uses a state map (e.g., `fill: { '': '#white', hovered: '#blue', disabled: '#gray' }`), any extension via `tasty(Component, { styles: { fill: ... } })` **erases all parent states**. This forces consumers to duplicate the entire parent state map just to add one new state.

Similarly, there is no way to "reset" a property back to a recipe-provided value when extending a component that already defines that property.

## Design Constraints

- All syntax must be **JSON-serializable** — plain strings, booleans, objects. No Symbols, no functions, no class instances.
- Must be compatible with `tastyStatic` (build-time extraction).
- Must add **near-zero overhead** on the hot path (when the feature is not used).
- Must work within sub-element style blocks (e.g., `Icon: { color: { ... } }`).

## Primitives

| Marker | Where | Meaning |
|---|---|---|
| State map **without** `''` key | `mergeStyles` | Extend mode — merge with parent's state map |
| State map **with** `''` key | `mergeStyles` | Replace mode — child defines everything |
| `'@inherit'` as a state value | `mergeStyles` (inside any state map) | Use parent's value for this key |
| `null` as a state value | `mergeStyles` (inside a state map) | Remove this state from the result |
| `false` as a state value | `mergeStyles` (inside a state map) | Tombstone — blocks recipe, produces no CSS for this state |
| `null` as a property value | `mergeStyles` | Intentional unset — discard parent's value, let recipe fill in |
| `false` as a regular property value | Survives all layers | Tombstone — blocks parent value AND recipe, produces no CSS |

The mode is determined implicitly: if the child state map contains a `''` (default) key, it is in **replace mode** (the child covers the base case and defines everything). If the `''` key is absent, it is in **extend mode** (the child expects to add to the parent's states).

`'@inherit'` works in both modes. In extend mode it repositions a parent state. In replace mode it cherry-picks a parent state into the child's result.

---

## `null` vs `undefined` vs `false` — Value Semantics

These three values have distinct meanings, applied consistently across both regular properties and sub-elements:

| Value | Meaning | Recipe fills in? | CSS output |
|---|---|---|---|
| `undefined` | "I didn't provide this" — ignored, parent value is preserved | N/A (parent stays) | Parent's CSS |
| `null` | "I intentionally unset this" — parent value is discarded | Yes | Recipe's CSS (or none) |
| `false` | "I want nothing here" — stays as `false` through all layers | No (blocked) | None |

`false` acts as a tombstone: it persists through `mergeStyles` and `resolveRecipes`, overriding the recipe value during resolution. The CSS generator treats `false` as a no-output value.

### Behavior change for sub-elements

The current `mergeStyles` uses loose equality (`== null`) for sub-element handling, treating both `null` and `undefined` identically. This spec changes sub-elements to use strict equality (`=== null`) to align with the property-level semantics above:

- `SubElement: undefined` — ignored, parent's sub-element styles are preserved.
- `SubElement: null` — parent's sub-element styles are discarded (deleted from result).
- `SubElement: false` — parent's sub-element styles are discarded (deleted from result).

Both `null` and `false` delete the sub-element from the merged result. Unlike regular properties, there is no tombstone distinction for sub-elements — `resolveRecipes` treats the absent key the same way regardless of which sentinel was used.

---

## Extend Mode — State Map Without Default Key

When the child state map does **not** contain a `''` key, `mergeStyles` enters extend mode. All parent states are preserved; the child adds, overrides, repositions, or removes individual states.

### Basic usage

```js
// Parent (e.g., Button variant styles)
fill: {
  '': '#white #primary',
  hovered: '#white #primary-text',
  pressed: '#white #primary',
  disabled: '#white #primary-disabled',
}

// Extension (no '' key → extend mode)
fill: {
  'custom-state': '#custom',
}

// Result: all parent states preserved, new state appended
fill: {
  '': '#white #primary',
  hovered: '#white #primary-text',
  pressed: '#white #primary',
  disabled: '#white #primary-disabled',
  'custom-state': '#custom',
}
```

### Merge rules

- **Shared keys** — parent's position in the map, child's value (override in place).
- **Parent-only keys** — kept in their original position and value.
- **Child-only keys** — appended at the end (highest CSS specificity / priority).

### Override a specific state

```js
fill: {
  disabled: '#gray.20',   // override parent's disabled value, keeps its position
}
```

### Remove a state

```js
fill: {
  pressed: null,   // remove parent's pressed state from the result
}
```

### Block a state with `false`

`false` inside a state map acts as a tombstone — it persists through all layers and blocks the recipe from filling in:

```js
fill: {
  disabled: false,   // no CSS output for disabled, recipe cannot override
}
```

### Extend when parent is a plain string

When the parent value is not a state map (e.g., `fill: '#purple'`), it is automatically normalized to `{ '': parentValue }` before merging:

```js
// Parent:  fill: '#purple'
// Child:   fill: { hovered: '#blue' }
// Result:  fill: { '': '#purple', hovered: '#blue' }
```

### Extend when parent has no value for this property

When the parent does not define the property at all, `@inherit` and `null` entries are stripped, and the remaining entries are used as-is:

```js
// Parent:  (no fill defined)
// Child:   fill: { hovered: '#blue' }
// Result:  fill: { hovered: '#blue' }
```

### Extend within sub-elements

Works identically inside sub-element blocks:

```js
styles: {
  Icon: {
    color: {
      loading: '#gray',   // no '' → extend parent's Icon.color
    },
  },
}
```

---

## Replace Mode — State Map With Default Key

When the child state map **contains** a `''` key, `mergeStyles` enters replace mode. The child defines the complete state map; parent states are dropped unless explicitly pulled via `@inherit`.

### Basic usage

```js
// Parent
fill: {
  '': '#white #primary',
  hovered: '#white #primary-text',
  pressed: '#white #primary',
  disabled: '#white #primary-disabled',
}

// Replacement (has '' key → replace mode)
fill: {
  '': '#red',
  hovered: '#blue',
}

// Result: only child states
fill: {
  '': '#red',
  hovered: '#blue',
}
```

### Cherry-pick parent states with `@inherit`

```js
fill: {
  '': '#red',
  hovered: '#blue',
  disabled: '@inherit',   // pull disabled value from parent
}

// Result
fill: {
  '': '#red',
  hovered: '#blue',
  disabled: '#white #primary-disabled',
}
```

---

## `@inherit` — Pull a Parent State

### Syntax

Use `'@inherit'` as the **value** for a state key. This tells `mergeStyles` to resolve the value from the parent's state map for this key.

**In extend mode**, `@inherit` repositions the parent state:

1. Remove it from its original position in the parent order.
2. Place it at **this position** in the child's entry order.

```js
// Parent
fill: {
  '': '#white #primary',
  hovered: '#white #primary-text',
  pressed: '#white #primary',
  disabled: '#white #primary-disabled',
}

// Extension: add custom-state, but keep disabled as highest priority
fill: {
  'custom-state': '#custom',
  disabled: '@inherit',
}

// Result
fill: {
  '': '#white #primary',
  hovered: '#white #primary-text',
  pressed: '#white #primary',
  'custom-state': '#custom',
  disabled: '#white #primary-disabled',   // repositioned to end
}
```

**In replace mode**, `@inherit` cherry-picks a parent state into the child's result at the declared position.

### Edge cases

- `'@inherit'` for a key that doesn't exist in the parent — dev-mode warning, entry is skipped.
- `'@inherit'` with no parent value at all — silently stripped.

---

## `null` — Reset to Recipe Layer

### Problem it solves

When extending a component, sometimes you want to discard the parent component's value for a property and fall back to whatever the recipe provides. Currently this is impossible — the parent's value always wins.

### Simple reset

Use `null` as the property value. `mergeStyles` treats `null` as an intentional unset — the parent's value is discarded. Later, `resolveRecipes` merges recipe values under component values, and since the property is absent, the recipe value fills in:

```js
const MyButton = tasty(Button, {
  styles: {
    fill: null,   // discard Button's fill, use recipe's fill instead
  },
});
```

### Hard remove with `false`

Use `false` to block the property entirely — the parent value is discarded AND the recipe cannot fill in:

```js
const MyButton = tasty(Button, {
  styles: {
    fill: false,   // no fill at all, recipe is blocked too
  },
});
```

`false` persists through all layers as a tombstone value. When `resolveRecipes` builds `{ ...recipeValues, ...componentValues }`, `false` overwrites the recipe's value. The CSS generator then treats `false` as no-output.

### Implementation in `mergeStyles`

For regular properties (non-selectors), add a strict null check:

```
if value === null:
  delete resultStyles[key]   // remove from merged result
else if value === false:
  resultStyles[key] = false  // keep as tombstone
else:
  existing spread behavior
```

For sub-elements (selectors), change from loose (`== null`) to strict equality:

```
if value === false OR value === null:
  delete resultStyles[key]   // remove sub-element
else if value === undefined:
  resultStyles[key] = parentStyles[key]   // keep parent's value
else:
  deep merge (with state map / @inherit / null support inside properties)
```

### Implementation in `resolveRecipes`

No changes needed. The existing `{ ...recipeValues, ...componentValues }` spread naturally handles both cases:

- `null` was deleted by `mergeStyles`, so the recipe value fills in.
- `false` was kept by `mergeStyles`, so it overwrites the recipe value.

---

## Combined Example

Wrapping `Button` to add a "loading" visual state while preserving all existing states:

```js
const LoadingButton = tasty(Button, {
  styles: {
    fill: {
      loading: '#white #primary.60',
      disabled: '@inherit',              // keep disabled as highest priority
    },
    border: {
      loading: '#clear',
    },
    cursor: {
      loading: 'wait',
    },
  },
});
```

Resetting a property to its recipe value:

```js
const SimpleButton = tasty(Button, {
  styles: {
    fill: null,    // use recipe's fill instead of Button's complex fill
    border: false, // no border at all, even if recipe defines one
  },
});
```

---

## Merge Algorithm

### `mergeStyles` changes

For each property in `newStyles`:

**Sub-element keys (selectors):**

Selector keys are collected from **both** parent and child styles to ensure new sub-elements are also processed.

```
if value === false OR value === null:
  delete resultStyles[key]       // remove sub-element
else if value === undefined:
  resultStyles[key] = styles[key]  // keep parent (unchanged from current behavior)
else:
  deep merge (with state map / @inherit / null support inside properties)
```

**Regular properties (non-selectors):**

```
1. if value === undefined:
   keep parent's value (or delete if parent has none)
2. else if value === null:
   delete resultStyles[key]       // unset, recipe fills in
3. else if value is a state map (object, not array):
   a. determine mode: isExtend = !( '' in childMap )
   b. normalize parent to state map (string → { '': value })
   c. if isExtend (no '' key):
      - collect all parent entries
      - for each child entry:
        - if value is '@inherit': mark parent key for repositioning
        - if value is null: mark parent key for removal
        - otherwise: mark as override (if key exists in parent) or append
      - build result:
        i.  parent entries in original order (skip removed, skip repositioned)
        ii. apply in-place overrides at their parent positions
        iii. append new + repositioned entries interleaved in child declaration order
   d. if replace (has '' key):
      - iterate child entries in order:
        - if value is '@inherit': resolve from parent
        - if value is null: skip
        - otherwise: pass through
   e. if no parent value: strip null and @inherit entries, use rest as-is
4. otherwise: existing behavior (spread override, including false as tombstone)
```

### `resolveRecipes` changes

The recipe string now supports a `|` separator that splits recipes into **base** and **post** groups:

```
recipe: 'base1 base2 | post1 post2'
```

**Base recipes** (left of `|`) are merged with component styles via `mergeStyles`. Primitives and state maps with a `''` key fully replace recipe values. This handles both cases naturally:

- Properties deleted (via `null`) are absent from `componentValues`, so recipe values fill in.
- Properties set to `false` remain in `componentValues` and overwrite recipe values.

**Post recipes** (right of `|`) are applied after component styles using `mergeStyles`. This enables state map extension: a post recipe with `preset: { ':-webkit-autofill': 'inherit' }` extends a component's `preset: 't3'` to `{ '': 't3', ':-webkit-autofill': 'inherit' }` instead of being overridden.

Resolution order: `base_recipe_1 base_recipe_2 → component styles → post_recipe_1 post_recipe_2`.

---

## Performance

| Path | Cost | When |
|---|---|---|
| No state map in any property | One `typeof` check per property (~3ns each) | Every `mergeStyles` call |
| State map detected | One `'' in childMap` check + one pass over entries | When state map is used |
| `@inherit` in child | One string comparison per child entry | Only when `@inherit` value is used |
| `null` check | One `=== null` per property | Every `mergeStyles` call |
| `false` tombstone | No extra cost (normal spread) | N/A |

Hot path overhead for a 15-property style object: ~45ns (fifteen `typeof` checks + `=== null` comparisons). This is well within noise for a function that already does object spreads and key iteration.

---

## Type Changes

### `StyleValueStateMap`

`'@inherit'` is scoped to `StyleValueStateMap` only — it is not part of `StyleValue`:

```ts
export type StyleValueStateMap<T = string> = {
  [key: string]: StyleValue<T> | '@inherit';
};
```

### `StyleValue`

No changes — `'@inherit'` is not added here. It is only valid inside state maps.

```ts
export type StyleValue<T = string> = T | boolean | number | null | undefined;
```

### `Styles` index signature

`null` is already allowed via `StyleValue`. `false` is already allowed via `boolean`. No changes needed to the top-level `Styles` type for the reset/tombstone behavior.

### Special keys excluded from CSS generation

`@inherit` values must be stripped before entering the style generation pipeline. They are consumed by `mergeStyles` during the merge phase and never reach the CSS generator.
