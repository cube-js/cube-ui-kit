# Usage Guide

`tasty` is a powerful utility for creating styled React components with a declarative, design-system-integrated API. It combines the flexibility of CSS-in-JS with the consistency of a design system, enabling you to build maintainable, themeable components quickly.

For global configuration (tokens, recipes, custom units, handlers), see **[Configuration](configuration.md)**.

---

## Quick Start

### Creating Your First Component

```jsx
import { tasty } from '@tenphi/tasty';

// Basic styled component
const Card = tasty({
  as: 'div',
  styles: {
    padding: '4x',
    fill: '#white',
    border: true,
    radius: true,
  },
  styleProps: ['padding', 'fill'], // Expose styles as props
});

// Usage
<Card>Hello World</Card>
<Card padding="6x" fill="#gray.05">Custom Card</Card>
```

### Extending Existing Components

> **Best Practice:** Always prefer creating styled wrappers over using the `styles` prop directly.

```jsx
// Recommended
const PrimaryButton = tasty(Button, {
  styles: {
    fill: '#purple',
    color: '#white',
    padding: '2x 4x',
  },
});

// Avoid
<Button styles={{ fill: '#purple' }}>Click me</Button>
```

#### Extending vs. Replacing State Maps

When a style property uses a state map, the merge behavior depends on whether the child provides a `''` (default) key:

- **No `''` key** — extend mode: parent states are preserved, child adds/overrides
- **Has `''` key** — replace mode: child defines everything from scratch

```jsx
// Parent has: fill: { '': '#white', hovered: '#blue', disabled: '#gray' }

// Extend — no '' key, parent states preserved
const MyButton = tasty(Button, {
  styles: {
    fill: {
      'loading': '#yellow',      // append new state
      'disabled': '#gray.20',    // override existing state in place
    },
  },
});

// Replace — has '' key, parent states dropped
const MyButton = tasty(Button, {
  styles: {
    fill: {
      '': '#red',
      'hovered': '#blue',
    },
  },
});
```

Use `'@inherit'` to pull a parent state value. In extend mode it repositions the state; in replace mode it cherry-picks it:

```jsx
// Extend mode: reposition disabled to end (highest CSS priority)
fill: {
  'loading': '#yellow',
  disabled: '@inherit',
}

// Replace mode: cherry-pick disabled from parent
fill: {
  '': '#red',
  disabled: '@inherit',
}
```

Use `null` inside a state map to remove a state, or `false` to block it entirely (tombstone):

```jsx
fill: { pressed: null }   // removes pressed from the result
fill: { disabled: false } // tombstone — no CSS for disabled, blocks recipe too
```

#### Resetting Properties with `null` and `false`

```jsx
const SimpleButton = tasty(Button, {
  styles: {
    fill: null,    // discard parent's fill, let recipe fill in
    border: false, // no border at all (tombstone — blocks recipe too)
  },
});
```

| Value | Meaning | Recipe fills in? |
|-------|---------|-----------------|
| `undefined` | Not provided — parent preserved | N/A |
| `null` | Intentional unset — parent discarded | Yes |
| `false` | Tombstone — blocks everything | No |

### Essential Patterns

```jsx
// State-based styling
const InteractiveCard = tasty({
  styles: {
    fill: {
      '': '#white',
      'hovered': '#gray.05',
      'pressed': '#gray.10',
    },
  },
});

// Using design tokens
const TokenCard = tasty({
  styles: {
    fill: '#surface',      // Color token
    color: '#text',        // Color token
    padding: '2x',         // Custom unit (gap × 2)
    radius: '1r',          // Custom unit (border-radius)
    border: '1bw solid #border', // Border width token
  },
});
```

---

## Configuration

For tokens, recipes, custom units, style handlers, and other global settings, see **[Configuration](configuration.md)**.

---

## Dictionary

### Style Mapping

Object where keys represent states and values are the styles to apply:

```jsx
fill: { '': '#white', hovered: '#gray.05', 'theme=danger': '#red' }
```

#### State Key Types

| Syntax | Example | Generated CSS |
|--------|---------|---------------|
| Boolean modifier | `hovered` | `[data-hovered]` |
| Value modifier | `theme=danger` | `[data-theme="danger"]` |
| Pseudo-class | `:hover` | `:hover` |
| Class selector | `.active` | `.active` |
| Attribute selector | `[aria-expanded="true"]` | `[aria-expanded="true"]` |
| Combined | `hovered & .active` | `[data-hovered].active` |

### Sub-element

Element styled using a capitalized key. Identified by `data-element` attribute:

```jsx
styles: { Title: { preset: 'h3' } }
// Targets: <div data-element="Title">
```

### Color Token

Named color prefixed with `#` that maps to CSS custom properties. Supports opacity with `.N` suffix:

```jsx
fill: '#purple.5'  // → var(--purple-color) with 50% opacity
```

### Modifier

State value via `mods` prop that generates `data-*` attributes:

```jsx
mods={{ hovered: true, theme: 'danger' }}
// → data-hovered="" data-theme="danger"
```

---

## Core Concepts

### Component Creation

```jsx
// Create new element
const Box = tasty({
  as: 'div',
  styles: { /* styles */ },
});

// Extend existing component
const StyledButton = tasty(Button, {
  styles: { /* additional styles */ },
});
```

### Style Props

Use `styleProps` to expose style properties as direct component props:

```jsx
const FlexibleBox = tasty({
  as: 'div',
  styles: {
    display: 'flex',
    padding: '2x',
  },
  styleProps: ['gap', 'align', 'placeContent', 'fill'],
});

<FlexibleBox gap="2x" align="center" fill="#surface">
  Content
</FlexibleBox>
```

### Color Tokens & Opacity

```jsx
color: '#purple',           // Full opacity
color: '#purple.5',         // 50% opacity
color: '#purple.05',        // 5% opacity
fill: '#current',           // → currentcolor
fill: '#current.5',         // → color-mix(in oklab, currentcolor 50%, transparent)
color: '(#primary, #secondary)',  // Fallback syntax
```

### Built-in Units

| Unit | Description | Example | CSS Output |
|------|-------------|---------|------------|
| `x` | Gap multiplier | `2x` | `calc(var(--gap) * 2)` |
| `r` | Border radius | `1r` | `var(--radius)` |
| `cr` | Card border radius | `1cr` | `var(--card-radius)` |
| `bw` | Border width | `2bw` | `calc(var(--border-width) * 2)` |
| `ow` | Outline width | `1ow` | `var(--outline-width)` |
| `fs` | Font size | `1fs` | `var(--font-size)` |
| `lh` | Line height | `1lh` | `var(--line-height)` |
| `sf` | Stable fraction | `1sf` | `minmax(0, 1fr)` |

You can register additional custom units via [`configure()`](configuration.md#options).

### Predefined Tokens

Tokens defined via [`configure({ tokens })`](configuration.md#predefined-tokens) are replaced at parse time and baked into the generated CSS:

```jsx
const Card = tasty({
  styles: {
    padding: '$card-padding',
    fill: '#surface',
    border: '1bw solid #accent',
  },
});
```

### Recipes

Apply predefined style bundles (defined via [`configure({ recipes })`](configuration.md#recipes)) using the `recipe` style property:

```jsx
const Card = tasty({
  styles: {
    recipe: 'card',
    color: '#text',
  },
});

// Compose multiple recipes
const ElevatedCard = tasty({
  styles: {
    recipe: 'card elevated',
    color: '#text',
  },
});
```

**Post-merge recipes (`/` separator):**

Recipes listed after `/` are applied *after* component styles using `mergeStyles`:

```jsx
const Input = tasty({
  styles: {
    recipe: 'reset input / input-autofill',
    preset: 't3',
  },
});
```

Use `none` to skip base recipes and apply only post recipes:

```jsx
const Custom = tasty({
  styles: {
    recipe: 'none / disabled',
    padding: '2x',
  },
});
```

### Advanced States (`@` prefix)

| Prefix | Purpose | Example |
|--------|---------|---------|
| `@media` | Media queries | `@media(w < 768px)` |
| `@(...)` | Container queries | `@(panel, w >= 300px)` |
| `@supports` | Feature/selector support | `@supports(display: grid)` |
| `@root` | Root element states | `@root(theme=dark)` |
| `@parent` | Parent/ancestor element states | `@parent(hovered)` |
| `@own` | Sub-element's own state | `@own(hovered)` |
| `@starting` | Entry animation | `@starting` |
| `:is()` | CSS `:is()` structural pseudo-class | `:is(fieldset > label)` |
| `:has()` | CSS `:has()` relational pseudo-class | `:has(> Icon)` |
| `:not()` | CSS `:not()` negation (prefer `!:is()`) | `:not(:first-child)` |
| `:where()` | CSS `:where()` (zero specificity) | `:where(Section)` |

#### `@parent(...)` — Parent Element States

Style based on ancestor element attributes. Uses `:is([selector] *)` / `:not([selector] *)` for symmetric, composable parent checks. Boolean logic (`&`, `|`, `!`) is supported inside `@parent()`.

```jsx
const Highlight = tasty({
  styles: {
    fill: {
      '': '#white',
      '@parent(hovered)': '#gray.05',         // Any ancestor has [data-hovered]
      '@parent(theme=dark, >)': '#dark-02',   // Direct parent has [data-theme="dark"]
    },
  },
});
```

| Syntax | CSS Output |
|--------|------------|
| `@parent(hovered)` | `:is([data-hovered] *)` |
| `!@parent(hovered)` | `:not([data-hovered] *)` |
| `@parent(hovered, >)` | `:is([data-hovered] > *)` (direct parent) |
| `@parent(.active)` | `:is(.active *)` |
| `@parent(hovered & focused)` | `:is([data-hovered][data-focused] *)` (same ancestor) |
| `@parent(hovered) & @parent(focused)` | `:is([data-hovered] *):is([data-focused] *)` (independent ancestors) |
| `@parent(hovered \| focused)` | `:is([data-hovered] *, [data-focused] *)` (OR inside single wrapper) |

For sub-elements, the parent check applies to the root element's ancestors:

```jsx
const Card = tasty({
  styles: {
    Label: {
      color: {
        '': '#text',
        '@parent(hovered)': '#primary',
      },
    },
  },
});
// → .t0.t0:is([data-hovered] *) [data-element="Label"]
```

#### `:is()`, `:has()` — CSS Structural Pseudo-classes

Use CSS structural pseudo-classes directly in state keys. Capitalized words become `[data-element="..."]` selectors; lowercase words are HTML tags. A trailing combinator (`>`, `+`, `~`) is auto-completed with `*`.

`:where()` and `:not()` are also supported but rarely needed — use `:is()` and `!` negation instead.

> **Performance warning:** CSS structural pseudo-classes — especially `:has()` — can be costly for the browser to evaluate because they require inspecting the DOM tree beyond the matched element. Tasty already provides a rich, purpose-built state system (`@parent()`, `@own()`, modifiers, boolean logic) that covers the vast majority of use cases without the performance trade-off. **Prefer Tasty's built-in mechanisms and treat `:has()` / `:is()` as a last resort** for conditions that cannot be expressed any other way.

```jsx
const Card = tasty({
  styles: {
    display: {
      '': 'block',
      ':has(> Icon)': 'grid',              // has Icon as direct child
      ':has(+ Icon)': 'grid',              // immediately followed by an Icon sibling
      ':has(~ Icon)': 'grid',              // has an Icon sibling somewhere after
      ':has(Icon +)': 'grid',              // immediately preceded by an Icon sibling (auto-completes to `Icon + *`)
      ':has(Icon ~)': 'grid',              // has an Icon sibling somewhere before (auto-completes to `Icon ~ *`)
      ':is(fieldset > label)': 'inline',   // is a label inside a fieldset (HTML tags)
      '!:has(> Icon)': 'flex',             // negation: no Icon child
    },
  },
});
```

| Syntax | CSS Output | Meaning |
|--------|------------|---------|
| `:has(> Icon)` | `:has(> [data-element="Icon"])` | Has Icon as direct child |
| `:has(+ Icon)` | `:has(+ [data-element="Icon"])` | Immediately followed by an Icon sibling |
| `:has(~ Icon)` | `:has(~ [data-element="Icon"])` | Has an Icon sibling somewhere after |
| `:has(Icon +)` | `:has([data-element="Icon"] + *)` | Immediately preceded by an Icon sibling |
| `:has(Icon ~)` | `:has([data-element="Icon"] ~ *)` | Has an Icon sibling somewhere before |
| `:has(>)` | `:has(> *)` | Has any direct child |
| `:is(> Field + input)` | `:is(> [data-element="Field"] + input)` | Structural match |
| `:has(button)` | `:has(button)` | HTML tag (lowercase, unchanged) |
| `!:has(> Icon)` | `:not(:has(> [data-element="Icon"]))` | Negation (use `!`) |
| `!:is(Panel)` | `:not([data-element="Panel"])` | Negation (use `!:is`) |

Combine with other states using boolean logic:

```jsx
':has(> Icon) & hovered'                // structural + data attribute
'@parent(hovered) & :has(> Icon)'       // parent check + structural
':has(> Icon) | :has(> Button)'         // OR: either sub-element present
```

> **Nesting limit:** The state key parser supports up to 2 levels of nested parentheses inside `:is()`, `:has()`, `:not()`, and `:where()` — e.g. `:has(Input:not(:disabled))` works, but 3+ levels like `:has(:is(:not(:hover)))` will not be tokenized correctly. This covers virtually all practical use cases.

---

## Style Properties

For a complete reference of all enhanced style properties — syntax, values, modifiers, and recommendations — see **[Style Properties Reference](styles.md)**.

---

## Advanced Features

### Keyframes

```jsx
const Pulse = tasty({
  styles: {
    animation: 'pulse 2s infinite',
    '@keyframes': {
      pulse: {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.05)' },
      },
    },
  },
});
```

### Properties (`@property`)

CSS cannot transition or animate custom properties unless the browser knows their type. Tasty solves this automatically — when you assign a concrete value to a custom property, the type is inferred and a CSS `@property` rule is registered behind the scenes:

```jsx
const AnimatedGradient = tasty({
  styles: {
    '$gradient-angle': '0deg',
    '#theme': 'okhsl(280 80% 50%)',
    background: 'linear-gradient($gradient-angle, #theme, transparent)',
    transition: '$$gradient-angle 0.3s, ##theme 0.3s',
  },
});
```

Here `$gradient-angle: '0deg'` is detected as `<angle>` and `#theme` as `<color>` (via the `#name` naming convention), so both transitions work without any manual `@property` declarations. Numeric types (`<number>`, `<length>`, `<percentage>`, `<angle>`, `<time>`) are inferred from values; `<color>` is inferred from `#name` tokens.

Use explicit `@properties` when you need non-default settings like `inherits: false`:

```jsx
'@properties': {
  '$gradient-angle': { syntax: '<angle>', inherits: false, initialValue: '0deg' },
},
```

### Variants & Theming

```jsx
const Button = tasty({
  styles: {
    padding: '2x 4x',
    border: true,
  },
  variants: {
    default: { fill: '#blue', color: '#white' },
    danger: { fill: '#red', color: '#white' },
    outline: { fill: 'transparent', color: '#blue', border: '1bw solid #blue' },
  },
});

<Button variant="danger">Delete</Button>
```

#### Extending Variants with Base State Maps

When base `styles` contain an extend-mode state map (an object **without** a `''` key), it is applied **after** the variant merge. This lets you add or override states across all variants without repeating yourself:

```jsx
const Badge = tasty({
  styles: {
    padding: '1x 2x',
    // No '' key → extend mode: appended to every variant's border
    border: {
      'type=primary': '#clear',
    },
  },
  variants: {
    primary: {
      border: { '': '#white.2', pressed: '#primary-text', disabled: '#clear' },
      fill: { '': '#white #primary', hovered: '#white #primary-text' },
    },
    secondary: {
      border: { '': '#primary.15', pressed: '#primary.3' },
      fill: '#primary.10',
    },
  },
});

// Both variants get 'type=primary': '#clear' appended to their border map
```

Properties that are **not** extend-mode (simple values, state maps with `''`, `null`, `false`, selectors, sub-elements) merge with variants as before — the variant can fully replace them.

### Sub-element Styling

Sub-elements are inner parts of a compound component, styled via capitalized keys in `styles` and identified by `data-element` attributes in the DOM.

> **Best Practice:** Use the `elements` prop to declare sub-element components. This gives you typed, reusable sub-components (`Card.Title`, `Card.Content`) instead of manually writing `data-element` attributes.

```jsx
const Card = tasty({
  styles: {
    padding: '4x',
    Title: { preset: 'h3', color: '#primary' },
    Content: { color: '#text' },
  },
  elements: {
    Title: 'h3',
    Content: 'div',
  },
});

// Sub-components automatically get data-element attributes
<Card>
  <Card.Title>Card Title</Card.Title>
  <Card.Content>Card content</Card.Content>
</Card>
```

Each entry in `elements` can be a tag name string or a config object:

```jsx
elements: {
  Title: 'h3',                          // shorthand: tag name only
  Icon: { as: 'span', qa: 'card-icon' }, // full form: tag + QA attribute
}
```

The sub-components produced by `elements` support `mods`, `tokens`, `isDisabled`, `isHidden`, and `isChecked` props — the same modifier interface as the root component.

If you don't need sub-components (e.g., the inner elements are already rendered by a third-party library), you can still style them by key alone — just omit `elements` and apply `data-element` manually:

```jsx
const Card = tasty({
  styles: {
    padding: '4x',
    Title: { preset: 'h3', color: '#primary' },
  },
});

<Card>
  <div data-element="Title">Card Title</div>
</Card>
```

#### Selector Affix (`$`)

Control how a sub-element selector attaches to the root selector using the `$` property inside the sub-element's styles:

| Pattern | Result | Description |
|---------|--------|-------------|
| *(none)* | ` [el]` | Descendant (default) |
| `>` | `> [el]` | Direct child |
| `>Body>Row>` | `> [Body] > [Row] > [el]` | Chained elements |
| `::before` | `::before` | Root pseudo (no key) |
| `@::before` | `[el]::before` | Pseudo on the sub-element |
| `>@:hover` | `> [el]:hover` | Pseudo-class on the sub-element |
| `>@.active` | `> [el].active` | Class on the sub-element |

The `@` placeholder marks exactly where the `[data-element="..."]` selector is injected, allowing you to attach pseudo-classes, pseudo-elements, or class selectors directly to the sub-element instead of the root:

```jsx
const List = tasty({
  styles: {
    Item: {
      $: '>@:last-child',
      border: 'none',
    },
  },
});
// → .t0 > [data-element="Item"]:last-child { border: none }
```

---

## Hooks

### useStyles

```tsx
import { useStyles } from '@tenphi/tasty';

function MyComponent() {
  const { className } = useStyles({
    padding: '2x',
    fill: '#surface',
    radius: '1r',
  });

  return <div className={className}>Styled content</div>;
}
```

### useGlobalStyles

```tsx
import { useGlobalStyles } from '@tenphi/tasty';

function ThemeStyles() {
  useGlobalStyles('.card', {
    padding: '4x',
    fill: '#surface',
    radius: '1r',
  });

  return null;
}
```

### useRawCSS

```tsx
import { useRawCSS } from '@tenphi/tasty';

function GlobalReset() {
  useRawCSS(`
    body { margin: 0; padding: 0; }
  `);

  return null;
}
```

### useMergeStyles

```tsx
import { useMergeStyles } from '@tenphi/tasty';

function MyTabs({ styles, tabListStyles, prefixStyles }) {
  const mergedStyles = useMergeStyles(styles, {
    TabList: tabListStyles,
    Prefix: prefixStyles,
  });

  return <TabsElement styles={mergedStyles} />;
}
```

---

## Best Practices

### Do's

- Use styled wrappers instead of `styles` prop directly
- Use design tokens and custom units (`#text`, `2x`, `1r`)
- Use semantic transition names (`theme 0.3s`)
- Use `elements` prop to declare typed sub-components for compound components
- Use `styleProps` for component APIs
- Use `tokens` prop for dynamic values

### Don'ts

- Don't use `styles` prop directly on components
- Don't use raw CSS values when tokens exist
- Don't use CSS property names when Tasty alternatives exist — see [recommended props](styles.md#recommended-props)
- Don't change `styles` prop at runtime (use modifiers or tokens instead)
- Don't use `style` prop for custom styling (only for third-party library integration)
