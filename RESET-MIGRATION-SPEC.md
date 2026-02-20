# Migration: Remove `resetStyle` from Tasty → Recipes in UI Kit

## Objective

Remove the `resetStyle` custom style handler from `tasty` and replace it with **recipes** defined at the UI-kit layer via `configure()`. This decouples browser-reset concerns from the style engine, makes reset behavior explicit in component code, and leverages the existing recipe system.

---

## Background & Current State

### `src/tasty/styles/reset.ts`

The `resetStyle` handler consumes a `reset` style prop (e.g., `reset: 'button'`, `reset: 'input'`) and injects raw CSS rule objects including pseudo-element/pseudo-class selectors.

**`reset: 'button'` generates:**
- `-webkit-tap-highlight-color: transparent`

**`reset: 'input'` generates:**
- Root: `-webkit-appearance: none`, `word-spacing: initial`, `-webkit-text-fill-color: currentColor`
- `::placeholder`: placeholder color via `--placeholder-color` CSS variable
- `::-webkit-search-cancel-button`: `display: none`, `-webkit-appearance: none`
- `:-webkit-autofill` (+ `:hover`, `:focus`): autofill style overrides (caret color, text fill color, box shadow, font inheritance)
- `[disabled]`: `-webkit-opacity: 1`

### Current Usage

Components also manually repeat companion styles alongside `reset`:

| Component | Reset | Companion styles |
|-----------|-------|-----------------|
| `Action.tsx` | `reset: 'button'` | `appearance: 'none'`, `touchAction: 'manipulation'`, `textDecoration: 'none'`, `border: 0`, `padding: 0`, `margin: 0`, `outline: 0` |
| `Button.tsx` | `reset: 'button'` | `appearance: 'none'`, `touchAction: 'manipulation'`, `textDecoration: 'none'`, `outline: 0` |
| `Item.tsx` | `reset: 'button'` | `appearance: 'none'`, `touchAction: 'manipulation'`, `textDecoration: 'none'` |
| `ItemAction.tsx` | `reset: 'button'` | `appearance: 'none'`, `touchAction: 'manipulation'`, `textDecoration: 'none'`, `outline: 0` |
| `ItemButton.tsx` | `reset: 'button'` | `appearance: 'none'`, `touchAction: 'manipulation'`, `textDecoration: 'none'` |
| `TextInputBase.tsx` | `reset: 'input'` | `border: 0`, `margin: {...}`, `outline: 0` |
| `CommandMenu/styled.tsx` | `reset: 'input'` | `margin: 0`, `outline: 'none'` |

### Documentation references

- `src/stories/CreateComponent.docs.mdx` references `reset: 'button'`

---

## Proposed Recipes

All recipes will be registered in the `configure()` call in `src/index.ts`.

### 1. `reset` — Generic Element Reset

Basic box-model reset applied to any element that needs browser defaults removed.

```js
reset: {
  margin: 0,
  padding: 0,
  border: 0,
  outline: 0,
  boxSizing: 'border-box',
}
```

### 2. `button` — Button Reset

Button-specific reset. Intended to be composed with `reset`: `recipe: 'reset button'`.

Absorbs the companion styles that every button-like component currently repeats.

```js
button: {
  appearance: 'none',
  touchAction: 'manipulation',
  textDecoration: 'none',
  '-webkit-tap-highlight-color': 'transparent',
  fill: '#clear',
  color: 'inherit',
  cursor: {
    '': 'pointer',
    disabled: 'not-allowed',
  },
}
```

**Result:** A component using `recipe: 'reset button'` gets the equivalent of the old `reset: 'button'` plus all the manually repeated companion styles (`appearance`, `touchAction`, `textDecoration`, `border: 0`, `padding: 0`, `margin: 0`, `outline: 0`, `fill: '#clear'`, `color: 'inherit'`, `cursor` with disabled state). Components can still override `cursor` with their own state maps.

### 3. `input` — Input Root Reset

Input-specific root styles. Composed with `reset`: `recipe: 'reset input'`.

Base `input` recipe provides appearance and color resets. The `input-autofill` recipe is applied as a **post recipe** (after `|`) so its state maps extend component values instead of being overridden: `recipe: 'reset input | input-autofill'`.

```js
input: {
  '@autofill': ':-webkit-autofill',
  appearance: 'none',
  wordSpacing: 'initial',
  color: 'inherit',
  fill: '#clear',
}
```

```js
'input-autofill': {
  '-webkit-text-fill-color': {
    '': 'currentColor',
    '@autofill | (@autofill & :hover) | (@autofill & :focus)': '#primary',
  },
  caretColor: {
    '@autofill | (@autofill & :hover) | (@autofill & :focus)': '#primary',
  },
  shadow: {
    '@autofill | (@autofill & :hover) | (@autofill & :focus)': '0 0 0 9999rem rgb(255 255 255) inset',
  },
  preset: {
    '@autofill | (@autofill & :hover) | (@autofill & :focus)': 'inherit',
  },
  '-webkit-opacity': {
    '': false,
    '[disabled]': '1',
  },
}
```

The `@autofill` local predefined state is defined in the base `input` recipe. Since base recipes are spread-merged into the component's styles object before pipeline processing, `extractLocalPredefinedStates()` picks it up and makes it available for state map resolution in both base and post recipes.

The `input-autofill` recipe uses post-merge (`|`) so its `preset` state map extends the component's `preset: 't3'` to `{ '': 't3', ':-webkit-autofill': 'inherit' }` instead of being replaced by the primitive.

**Tasty alternatives applied (from lines 4–10 of old `reset.ts`):**

| Old (raw CSS) | New (tasty style) |
|---------------|-------------------|
| `'caret-color': 'var(--primary-color)'` | `caretColor: '#primary'` |
| `'-webkit-box-shadow'` + `'box-shadow': '0 0 0px 9999rem var(--white-color) inset'` | `shadow: '0 0 0 9999rem rgb(255 255 255) inset'` — tasty generates `box-shadow`; `-webkit-box-shadow` dropped (Baseline 2022); raw `rgb` used instead of `#white` token to avoid dependency on color config |
| `'font-family': 'inherit'`, `'font-size': 'inherit'`, `'line-height': 'inherit'` | `preset: 'inherit'` (single property handles all three via `presetStyle`) |
| `'-webkit-text-fill-color': 'var(--primary-color)'` | `'-webkit-text-fill-color': '#primary'` — kebab-case key, value uses token |

### 4. `input-placeholder` — Input Placeholder Styles

Applied to the `Placeholder` sub-element (mapped to `::placeholder` via `$` affix).

```js
'input-placeholder': {
  '-webkit-text-fill-color': 'var(--placeholder-color, initial)',
  color: 'var(--placeholder-color, initial)',
}
```

> `--placeholder-color` is a component-level CSS custom property, not a global token, so raw `var()` references are correct here.

### 5. `input-search-cancel-button` — Search Cancel Button

Applied via the `&::-webkit-search-cancel-button` raw selector key (capitalized sub-element with `$` affix cannot be used here — the affix validator rejects `-webkit-` after `::`).

Uses the `hide` style as requested (instead of raw `display: 'none'`):

```js
'input-search-cancel-button': {
  hide: true,
  appearance: 'none',
}
```

---

## Sub-element Approach for Pseudo-elements

Tasty already supports mapping sub-element keys to CSS pseudo-elements via the `$` affix property. When a capitalized key has `$: '::placeholder'`, the generated CSS targets the pseudo-element instead of `[data-element="..."]`.

This is verified by existing behavior:
```js
// $: '::before' generates CSS like `.component::before { ... }`
// Not `.component [data-element="Before"] { ... }`
```

### Input component pattern

```js
const InputElement = tasty({
  styles: {
    recipe: 'reset input | input-autofill',
    // ... component-specific styles ...

    Placeholder: {
      $: '::placeholder',
      recipe: 'input-placeholder',
    },
    '&::-webkit-search-cancel-button': {
      recipe: 'input-search-cancel-button',
    },
  },
});
```

**Notes:**
- `Placeholder` uses a capitalized sub-element key with `$: '::placeholder'` — readable and extensible by name.
- `::-webkit-search-cancel-button` must use the `&` raw selector prefix instead of a capitalized key with `$` affix, because the affix validator rejects `-webkit-` (the `-` after `::` doesn't match `[a-z]`). The `&` prefix bypasses the affix system entirely and directly appends the selector.

---

## Component Migration Guide

### Button-like components

**Affected:** `Action.tsx`, `Button.tsx`, `Item.tsx`, `ItemAction.tsx`, `ItemButton.tsx`

**Before:**
```js
styles: {
  reset: 'button',
  appearance: 'none',
  touchAction: 'manipulation',
  textDecoration: 'none',
  // ... component-specific styles
}
```

**After:**
```js
styles: {
  recipe: 'reset button',
  // ... component-specific styles (no more repeated companion styles)
}
```

Remove from each component: `reset`, `appearance`, `touchAction`, `textDecoration`, `fill: '#clear'` (absorbed by recipes). Simple `cursor` values are also absorbed — only keep component-specific `cursor` overrides that differ from `{ '': 'pointer', disabled: 'not-allowed' }`. Keep component-specific styles like `preset`, `padding`, `outline`, `outlineOffset`, etc.

### Input-like components

**Affected:** `TextInputBase.tsx`, `CommandMenu/styled.tsx`

**Before:**
```js
styles: {
  reset: 'input',
  border: 0,
  margin: 0,
  outline: 0,
  // ... component-specific styles
}
```

**After:**
```js
styles: {
  recipe: 'reset input | input-autofill',
  // ... component-specific styles

  Placeholder: {
    $: '::placeholder',
    recipe: 'input-placeholder',
  },
  '&::-webkit-search-cancel-button': {
    recipe: 'input-search-cancel-button',
  },
}
```

Remove: `reset`, `border: 0`, `margin: 0`, `outline: 0` (absorbed by `reset` recipe). Keep component-specific styles like `padding`, `preset`, `textAlign`, `resize`, etc. The `| input-autofill` post recipe ensures autofill state maps extend the component's `preset` value instead of being replaced.

### Documentation

Update `src/stories/CreateComponent.docs.mdx` to replace `reset: 'button'` example with `recipe: 'reset button'`.

---

## Tasty Cleanup

After all components are migrated:

1. **Delete** `src/tasty/styles/reset.ts`
2. **Remove** `resetStyle` import and registration from `src/tasty/styles/predefined.ts`
3. **Remove** `reset` from `StylesInterface` in `src/tasty/styles/types.ts` (if declared)
4. **Remove** any tests specific to `resetStyle`

---

## Migration Steps (Ordered)

1. **Define recipes** in `src/index.ts` `configure()` call: `reset`, `button`, `input`, `input-autofill`, `input-placeholder`, `input-search-cancel-button`
2. **Migrate button-like components** (one at a time):
   - `Action.tsx` → `recipe: 'reset button'`
   - `Button.tsx` → `recipe: 'reset button'`
   - `ItemButton.tsx` → `recipe: 'reset button'`
   - `ItemAction.tsx` → `recipe: 'reset button'`
   - `Item.tsx` → `recipe: 'reset button'`
3. **Migrate input-like components** (one at a time):
   - `TextInputBase.tsx` → `recipe: 'reset input | input-autofill'` + pseudo-element sub-elements
   - `CommandMenu/styled.tsx` → `recipe: 'reset input | input-autofill'` + pseudo-element sub-elements
4. **Update documentation**: `CreateComponent.docs.mdx`
5. **Remove `resetStyle`**: delete handler, clean up imports/registrations in tasty
6. **Run tests**: `pnpm test` — verify no regressions
7. **Visual QA**: check Storybook for button and input components

---

## Resolved Decisions

### 1. Autofill state verbosity — local predefined state in recipe

Defined `@autofill` as a local predefined state directly inside the `input` recipe (`'@autofill': ':-webkit-autofill'`). Recipes are spread-merged into the component's styles object before pipeline processing, so `extractLocalPredefinedStates()` picks up the `@autofill` key and makes it available for state map resolution. This keeps the state definition co-located with its usage and avoids polluting the global state namespace.

### 2. `shadow` style for autofill override — raw `rgb` value

Using `shadow: '0 0 0 9999rem rgb(255 255 255) inset'` with a raw RGB value instead of `#white` to avoid coupling the reset recipe to the color token configuration. The autofill background override is a browser hack, not a themed value.

### 3. Recipe state maps — base vs post merge

All recipe merging uses `mergeStyles` semantics: primitives and state maps with a `''` key fully replace, while state maps without `''` extend existing values. The `|` separator controls ordering — base recipes are applied before component styles, post recipes after. For recipes that need to add state entries on top of component values (e.g., autofill overrides), place them in the post group: `recipe: 'reset input | input-autofill'`.

### 4. `-webkit-` prefix necessity — 2024 Baseline

- `-webkit-box-shadow`: **Dropped.** `box-shadow` is Baseline since 2022.
- `-webkit-appearance`: **Dropped.** `appearance` is Baseline since March 2022.
- `-webkit-text-fill-color`: **Kept.** Still requires `-webkit-` prefix, Baseline since 2016 but no unprefixed alternative exists.
- `-webkit-tap-highlight-color`: **Kept.** Non-standard but useful for Chromium/WebKit mobile browsers.
- `-webkit-opacity`: **Kept.** Used for disabled input override on iOS Safari.

### 5. Component-specific overrides — manual verification needed

Some styles differ between components (e.g., `outline: 0` vs `outline: 'none'`, `outlineOffset: 1` in some but not all). The `reset` recipe provides `outline: 0` as the base. Components override as needed. Visual QA in Storybook required after migration.

### 6. `fill: '#clear'` in button recipe — included

Included in the `button` recipe. All button-like components currently set this manually. Components can override with their own `fill` value which takes precedence over recipe values.

### 7. `cursor` in button recipe — included with disabled state

Included `cursor: { '': 'pointer', disabled: 'not-allowed' }` in the button recipe. Components with more complex cursor state maps (e.g., `Item.tsx` with `:is(a)`, `:is(button)` variants) override the recipe value.

### 8. Duplicate `::-webkit-search-cancel-button` — merged

The two entries from `reset.ts` (lines 20–23 and 46–49) are merged into a single `input-search-cancel-button` recipe with `hide: true` and `appearance: 'none'`.

### 9. Vendor-prefixed property naming — kebab-case

Using kebab-case strings for vendor-prefixed properties (e.g., `'-webkit-text-fill-color'`). CamelCase like `WebkitTextFillColor` would be misinterpreted as a sub-element selector by the pipeline (keys starting with uppercase are treated as `[data-element="..."]` selectors). Kebab-case keys pass through `createStyle` as-is since they are already valid CSS property names.
