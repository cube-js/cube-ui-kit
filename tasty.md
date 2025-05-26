# Tasty Helper: Comprehensive Usage Guide

`tasty` is a utility for defining styled React components with a powerful, declarative API. It enables you to create, extend, and theme components with consistent, maintainable styles and variants. This guide provides clear, actionable rules and best practices for using `tasty` effectively, including advanced features and performance notes.

---

## Table of Contents

1. [Basic Usage](#1-basic-usage)
2. [Styled Components](#2-styled-components)
3. [Best Practices](#3-best-practices)
4. [Modifiers and Data Attributes](#4-modifiers-and-data-attributes)
5. [Complex State Bindings](#5-complex-state-bindings)
6. [Responsive & State-based Styles](#6-responsive--state-based-styles)
7. [Selector & Sub-element Syntax](#7-selector--sub-element-syntax)
8. [Variants (Themes)](#8-variants-themes)
9. [Custom Units](#9-custom-units)
10. [Color Syntax and Tokens](#10-color-syntax-and-tokens)
11. [Custom Properties](#11-custom-properties)
12. [Extending Components](#12-extending-components)
13. [Global Styles](#13-global-styles)
14. [Full Example: Custom Button](#14-full-example-custom-button)
15. [Native `style` Prop & Performance](#15-native-style-prop--performance)

---

## 1. Basic Usage

Create a styled element or extend an existing component:

```jsx
import { tasty } from '@cube-dev/ui-kit';

const Element = tasty({
  as: 'span',
  styles: {
    '@local-padding': ['2x', '1x'],
    '@text-color': 'rgb(255 0 0)',
    padding: '@local-padding',
    color: {
      '': '#text',
      blue: 'blue', // mod-based style
    },
  },
  role: 'article',
  styleProps: ['align'], // allows <Element align="center" />
});
```

---

## 2. Styled Components

> **Best Practice:** Always prefer creating styled wrappers with `tasty` over using the `styles` prop directly. This ensures consistency and maintainability.

**Recommended:**
```jsx
const StyledButton = tasty(Button, {
  styles: {
    padding: '3x 6x',
    preset: 't1',
  },
});

// Usage
<StyledButton>Click me</StyledButton>
```

**Avoid:**
```jsx
<Button styles={{ padding: '3x 6x' }}>Click me</Button> // Not recommended
```

---

## 3. Best Practices

- **Always prefer styled wrappers with `tasty` over the `styles` prop directly.**
- Use variants for theming and state-based styles for interactivity.
- Keep style logic declarative; avoid inline style overrides.
- Use tokens, custom units, and responsive arrays for consistency.
- Place more specific or overriding rules last in style objects for correct precedence.

---

## 4. Modifiers and Data Attributes

Modifiers let you declaratively control component states and style them accordingly. When you pass a modifier (such as `hovered`, `active`, `disabled`, etc.) to a component via the `mods` prop, it is automatically translated into a `data-is-<modifier>` attribute on the DOM element. This attribute is then used in style-to-state bindings.

**How it works:**
- The `mods` prop is an object where each key is a modifier name and the value is a boolean.
- If a modifier is `true`, the corresponding `data-is-<modifier>` attribute is added to the element.
- In your styles, you can bind styles to these modifiers using the modifier name as a key (e.g., `hovered`, `active`).
- **Built-in states** (such as `disabled`, `checked`, etc.) must be targeted using the full attribute selector (e.g., `[disabled]`), not the simplified modifier key.

**Example:**
```jsx
const MyButton = tasty({
  styles: {
    color: {
      '': '#dark',
      hovered: '#purple', // applies when data-is-hovered is present
      '[disabled]': '#gray', // applies when the element is disabled
    },
    border: {
      '': '#border',
      active: '#purple', // applies when data-is-active is present
    },
  },
});

<MyButton mods={{ hovered: true, active: false }} disabled />
// Renders: <div data-is-hovered disabled class="...">...</div>
```

- Modifiers can be combined in style-to-state bindings using logical operators (see Complex State Bindings).
- This system enables clean, declarative, and maintainable state-based styling without relying on CSS pseudo-classes or manual class management.
- **Summary:**
  - Use `[disabled]`, `[checked]`, etc. for built-in states.
  - Use simplified keys (e.g., `hovered`, `active`) only for custom modifiers set via `mods`.

---

## 5. Complex State Bindings

Combine multiple modifiers using logical operators to target specific states or combinations:

- `!` — NOT
- `&` — AND
- `|` — OR
- `^` — XOR

> **Note:** Rules are applied in reverse order—the last line in the object is checked first. Place more specific or overriding rules last for correct precedence.

**Example:**
```jsx
color: {
  '': 'yellow', // default
  blue: 'blue', // if `blue` mod is present
  '!blue & :hover': 'purple', // if not `blue` and hovered
  'success | green': 'green', // if `success` or `green` mod is present
  'success ^ green': 'green', // if either `success` or `green` (but not both)
}
```

You can also use built-in CSS pseudo-classes and custom data attributes as modifiers:

```jsx
color: {
  ':hover': '#purple', // when hovered
  '[data-theme="danger"]': '#danger', // when data-theme="danger" attribute is present
  '.custom-class': '#success', // when element has class "custom-class"
  '[disabled]': '#gray', // when the element is disabled (built-in state)
}
```

> **Important:** To style built-in states like `disabled`, always use the full attribute selector (e.g., `[disabled]`). The simplified modifier keys (e.g., `disabled`) are only for use with the `mods` prop and custom data attributes.

---

## 6. Responsive & State-based Styles

- Use arrays for responsive values: `padding: ['2x', '1x']`.
- Responsive styles are applied from largest to smallest screen zones. Each array value corresponds to a zone between breakpoints, starting from the largest. For two breakpoints, you have three zones.
- Customize breakpoints by wrapping your app (or subtree) with `BreakpointsProvider`:

```jsx
import { BreakpointsProvider } from '@cube-dev/ui-kit';

<BreakpointsProvider value={[1200, 640]}>
  <Block padding={["4x", "2x", "1x"]} />
</BreakpointsProvider>
```

- `padding` is `4x` for screens ≥ 1200px
- `padding` is `2x` for screens ≥ 640px and < 1200px
- `padding` is `1x` for screens < 640px

- Use objects for state/modifier-based styles:
  ```jsx
  color: {
    '': '#text', // default
    hovered: '#blue',
    pressed: '#red',
  }
  ```

---

## 7. Selector & Sub-element Syntax

To style inner elements, use the sub-element name as a key in the `styles` object. These styles apply to any inner element with the corresponding `data-element="ElementName"` attribute. The root element's modifiers (states) are used for sub-element state-based styling, ensuring consistency.

**Example:**
```jsx
styles: {
  Label: { color: '#purple' }, // styles for data-element="Label"
  Icon: {
    color: {
      '': '#dark',
      hovered: '#purple', // uses root element's hovered state
    },
  },
}
```

You can use custom selectors for advanced cases:

```jsx
styles: {
  '& > div': { margin: '1x' }, // direct child divs (not recommended)
  '&::after': { content: '""', display: 'block' }, // after pseudo-element
}
```

> **Warning:** Avoid custom selectors like `& > div` and state selectors like `&:hover`. Prefer sub-element syntax and named elements (`data-element="..."`) for maintainable, predictable styles. Use custom selectors only for edge cases.

---

## 8. Variants (Themes)

Variants let you define multiple style themes for a component:

```jsx
const StyledButton = tasty(Button, {
  styles: { /* default styles */ },
  variants: {
    default: { /* default variant styles */ },
    danger: { /* danger variant styles */ },
  },
});

// Usage
<StyledButton variant="danger">Danger</StyledButton>
```

- If `variant` is not provided, the `default` variant is used.
- Avoid changing the `variant` prop dynamically to prevent style replacement, but this is supported if needed.

---

## 9. Custom Units

`tasty` supports concise, semantic units for consistent styling. Units are expanded to CSS variables or expressions:

| Unit | Meaning | Example | Result |
|------|---------|---------|--------|
| `r`  | Border radius | `2r` | `calc(var(--radius) * 2)` |
| `cr` | Card radius   | `1cr`| `var(--card-radius)` |
| `bw` | Border width  | `2bw`| `calc(var(--border-width) * 2)` |
| `ow` | Outline width | `1ow`| `var(--outline-width)` |
| `x`  | Gap           | `4x` | `calc(var(--gap) * 4)` |
| `fs` | Font size     | `1fs`| `var(--font-size)` |
| `lh` | Line height   | `1lh`| `var(--line-height)` |
| `rp` | Rem pixel     | `1rp`| `var(--rem-pixel)` |
| `gp` | Column gap    | `1gp`| `var(--column-gap)` |
| `dvh`| Dynamic viewport height | `100dvh` | Uses `dvh` if supported, else fallback |
| `sp` | Grid span     | `2sp`| Grid span calculation |

**Example:**
```jsx
<Block padding="2x 1r" /> // padding: calc(var(--gap) * 2) calc(var(--radius) * 1)
```

---

## 10. Color Syntax and Tokens

- Use `#token` for predefined color tokens (e.g., `#purple`, `#danger-text`).
- Add `.opacity` for alpha (e.g., `#dark.04` for 4% opacity, `#dark.4` for 40%). Only 1 or 2 digits are supported.
- Use color functions: `rgb()`, `rgba()`, or CSS color names.
- Predefined tokens: `#purple`, `#danger`, `#success`, `#dark`, `#white`, `#border`, `#shadow`, etc.
- Combine with other values: `border: '2bw solid #purple'`.

**Example:**
```jsx
<Block styles={{ color: '#dark', fill: '#purple.10' }} />
```

---

## 11. Custom Properties

- Use the `@` prefix to reference custom properties or tokens defined in your theme or component.
- Example: `padding: '@local-padding'` uses the value of the `@local-padding` property.
- Use brackets to define the fallback value: `padding: '@(local-padding, 1x)'`.
- Define custom tokens in the `styles` object:

```jsx
const MyBlock = tasty({
  styles: {
    '@my-gap': '2x',
    gap: '@my-gap',
  },
});
```

- Define custom colors using the `@` prefix. Use `'@custom-color': 'rgb(255 128 0)'` (no commas in rgb values). Prefer opaque colors for best results.

**Example:**
```jsx
const MyBlock = tasty({
  styles: {
    '@custom-color': 'rgb(255 128 0)',
    color: '@custom-color',
  },
});
```

---

## 12. Extending Components

Extend an existing component’s styles and attributes:

```jsx
const CustomElement = tasty(Element, {
  as: 'input',
  styles: {
    color: '#purple',
  },
  role: 'article',
});
```

---

## 13. Global Styles

Define global styles for selectors:

```jsx
const GlobalStyledHeading = tasty('.myButton', {
  display: 'inline-block',
  padding: '1x 2x',
  preset: 't2',
  border: true,
  radius: true,
});
```

---

## 14. Full Example: Custom Button

```jsx
const MyButton = tasty(Button, {
  styles: {
    padding: ['2x', '1x'],
    color: {
      '': '#white',
      hovered: '#purple',
    },
    border: '2bw #purple',
  },
  variants: {
    danger: {
      color: '#danger',
    },
  },
});
```

---

## 15. Native `style` Prop & Performance

You can use the native React `style` property on `tasty` components. This only supports standard React style object syntax and is intended for backward compatibility and dynamic use cases.

> **Performance Note:** Changing the `styles` prop at runtime triggers a full style recalculation and may impact performance. For dynamic styles or custom properties that change frequently, prefer the native `style` prop.

**Example:**
```jsx
const MyBox = tasty({
  styles: {
    padding: '2x',
    color: '#custom',
    '@custom-color': '#purple', // fallback
  },
});

<MyBox style={{ '--custom-color': 'var(--danger-color)' }} />
```
In this example, the `color` style uses a CSS custom property (`--custom-color`). You can override it dynamically at runtime using the native `style` prop, which is efficient and avoids unnecessary re-renders or style recalculations.

---

## A. How Tasty Styles Differ from Native CSS

Most Tasty styles are concise, semantic shorthands for common CSS properties. They replace native CSS props in the `styles` object, providing a unified, design-system-driven API. Tasty styles support:
- All Tasty color tokens, opacity syntax, and CSS color values
- Custom units (e.g., `x`, `bw`, `ow`, `r`, etc.) for consistent spacing and sizing
- Modifiers for directional or state-based control (where applicable)
- The `true` value for applying a default or semantic value
- Arrays for responsive values and objects for state-based styles

> **Tip:** Prefer Tasty style props (e.g., `fill`, `color`, `border`, etc.) over native CSS properties for better integration with the design system, tokens, and responsive/state-based features.

Below are the key usage patterns and differences for each style:

### The `preset` Style
A semantic typography shortcut. Set to a preset name (e.g., `h1`, `t2`, `p3`) to instantly apply a coordinated set of font styles (font size, weight, line height, etc.) that match your design system's typography scale. Modifiers like `strong` or `italic` can be added for further customization.

#### Available Presets
- `h1`, `h2`, `h3`, `h4`, `h5`, `h6` — Headings
- `t1`, `t2`, `t2m`, `t3`, `t3m`, `t4`, `t4m` — Text styles
- `p1`, `p2`, `p3`, `p4` — Paragraphs
- `m1`, `m2`, `m3` — Main text
- `c1`, `c2` — Captions
- `tag`, `strong`, `em`, `default`

**Example:**
```jsx
<Block preset="h1">Heading 1</Block>
<Block preset="h2 strong">Bold Heading 2</Block>
```

### The `fill` Style
Shortcut for `background-color`. Supports all Tasty color tokens and syntaxes.

**Example:**
```jsx
<Block fill="#purple.10">Block with purple background</Block>
<Block fill="#danger">Danger background</Block>
```

> **Tip:** Prefer `fill` over `backgroundColor` for better integration with Tasty's color system.

### The `color` Style
Shortcut for text color. Works like `fill`, but applies to the `color` (text color) property.

**Examples:**
```jsx
<Block color="#purple" /> // text color: #purple
<Block color="#danger.6" /> // text color: #danger with 60% opacity
<Block color="red" /> // text color: red
<Block color={true} /> // text color: currentColor
```

> **Tip:** Prefer `color` over `style={{ color: ... }}` for better integration with Tasty's color system and tokens.

### The `padding` Style
Shorthand for element padding. Supports custom units, directional modifiers (e.g., `top`, `left`), and `true` for default spacing.

**Examples:**
```jsx
<Block padding="2x 1x" /> // padding: calc(var(--gap) * 2) calc(var(--radius) * 1)
<Block padding="2x top" /> // only top padding
<Block padding="1x left right" /> // left and right padding
<Block padding={true} /> // all sides: default spacing (var(--gap))
```

> **Tip:** Use modifiers like `top`, `bottom`, `left`, `right` for fine-grained control. Use `true` for default spacing on all sides.

### The `margin` Style
Shorthand for element margin. Supports custom units, directional modifiers, and `true` for default spacing.

**Examples:**
```jsx
<Block margin="2x 1x" /> // top/bottom: 2x, left/right: 1x
<Block margin="2x top" /> // only top margin
<Block margin="1x left right" /> // left and right margin
<Block margin={true} /> // all sides: default spacing (var(--gap))
```

> **Tip:** Use modifiers like `top`, `bottom`, `left`, `right` for fine-grained margin control. Use `true` for default spacing on all sides.

### The `inset` Style
Shorthand for `top`, `right`, `bottom`, and `left` offsets. Supports custom units, directional modifiers, and `true` for zero offset.

**Examples:**
```jsx
<Block inset="0" /> // all sides: 0
<Block inset="2x top" /> // only top offset
<Block inset="1x left right" /> // left and right offsets
<Block inset={true} /> // all sides: 0
```

> **Tip:** Use `inset` for quick positioning of elements with custom units and directional modifiers.

### The `border` Style
Shorthand for border width, style, and color. Supports directional modifiers and `true` for default border.

**Defaults:**
- Width: `var(--border-width)` (or `1bw`)
- Style: `solid`
- Color: `var(--border-color)`

**Examples:**
```jsx
<Block border /> // all sides: 1bw solid var(--border-color)
<Block border="2bw dashed #purple" /> // all sides: 2bw dashed #purple
<Block border="2bw top" /> // only top border: 2bw solid var(--border-color)
<Block border="dotted #danger left right" /> // left/right: 1bw dotted #danger, others: none
<Block border={true} /> // all sides: 1bw solid var(--border-color)
```

> **Tip:** Use modifiers like `top`, `bottom`, `left`, `right` for fine-grained border control. Use `true` for a default border on all sides.

### The `outline` Style
Shorthand for outline width, style, color, and offset. Does not support directional modifiers. Use `true` for default outline.

**Defaults:**
- Width: `var(--outline-width)` (or `1ow`)
- Style: `solid`
- Color: `var(--outline-color)`
- Offset: none (can be set as a second value)

**Examples:**
```jsx
<Block outline /> // 1ow solid var(--outline-color)
<Block outline="2ow dashed #purple" /> // 2ow dashed #purple
<Block outline="2ow #danger 1x" /> // 2ow solid #danger, offset: 1x
<Block outline={true} /> // 1ow solid var(--outline-color)
```

> **Tip:** Use a second value to set the outline offset (e.g., `outline="2ow #purple 2x"`).

### The `flow` Style
The `flow` style is a unified shorthand for controlling layout direction and wrapping in both flex and grid containers. It replaces the native `flexDirection` and `gridAutoFlow` CSS properties, automatically applying the correct property based on the element's `display` value.

- For flex containers (`display: flex` or `inline-flex`), `flow` sets the `flex-flow` property (e.g., `row`, `column`, `row wrap`, etc.).
- For grid containers (`display: grid` or `inline-grid`), `flow` sets the `grid-auto-flow` property (e.g., `row`, `column`, `dense`, etc.).
- For block layouts, `flow` determines the direction (`row` or `column`) for margin-based gap emulation on children, affecting whether `margin-right` or `margin-bottom` is used.

**Examples:**
```jsx
<Block display="flex" flow="row wrap" /> // flex-flow: row wrap
<Block display="grid" flow="column dense" /> // grid-auto-flow: column dense
```

> **Tip:** Use `flow` to declaratively control direction and wrapping for both flex and grid layouts with a single prop.

### The `gap` Style
The `gap` style is a powerful, cross-layout shorthand for spacing between child elements. It replaces both the native `gap` property (for flex and grid) and the need for manual margin spacing in block layouts.

- For flex and grid containers, `gap` sets the native `gap` property (e.g., `gap: 2x`).
- For block layouts, `gap` is emulated by applying margin to the children (e.g., `margin-bottom` or `margin-right`), ensuring consistent spacing even in browsers that do not support `flex-gap`.
- For multi-directional layouts (e.g., `row wrap`), negative margins are applied to the container to maintain correct spacing.

**Examples:**
```jsx
<Block display="flex" gap="2x" /> // gap: 2x
<Block display="grid" gap="1x 2x" /> // gap: 1x 2x
<Block gap="2x" /> // block layout: children get margin-bottom: 2x
<Block display="flex" flow="row wrap" gap="1x 2x" /> // handles wrapping with correct margins
<Block gap={true} /> // default gap (1x)
```

> **Tip:** Use `gap` for all layout types to ensure consistent, design-system-driven spacing between children, regardless of the layout.

### The `radius` Style
The `radius` style is a powerful shorthand for setting border-radius with support for custom units, advanced shapes, and directional or shape modifiers. It replaces the native `border-radius` property and provides design-system-driven defaults and advanced options.

- Use values like `1r`, `2r`, or pixel values for standard rounding.
- Modifiers:
  - `round` — fully rounded (circle/ellipse)
  - `ellipse` — elliptical corners (50%)
  - `leaf`, `backleaf` — asymmetric shapes for special UI elements
  - Directional modifiers (`top`, `right`, `bottom`, `left`) — round only specific corners
- Use `true` (boolean) for the default radius (`1r`).
- The value is also provided as a CSS variable for use in child elements (`--context-radius`).

**Examples:**
```jsx
<Block radius="2r" /> // border-radius: calc(var(--radius) * 2)
<Block radius={true} /> // border-radius: var(--radius)
<Block radius="round" /> // border-radius: 9999rem (fully rounded)
<Block radius="leaf" /> // asymmetric leaf shape
<Block radius="1r top" /> // round only top corners
```

> **Tip:** Use shape and directional modifiers for advanced UI shapes and to match your design system precisely.

### The `transition` Style
The `transition` style is a powerful shorthand for declaratively defining CSS transitions for Tasty styles and tokens. It replaces the native `transition` property and supports semantic transition names, design tokens, and grouped transitions for common UI effects.

- Use semantic names (e.g., `fade`, `fill`, `border`, `radius`, `shadow`, `preset`, `gap`, `theme`, etc.) to target logical groups of properties, not just raw CSS property names. The `theme` semantic name transitions all major theme-related properties (color, background, border, radius, outline, shadow).
- Multiple transitions can be specified, separated by commas.
- Each transition can include timing, easing, and delay (e.g., `fade 0.2s ease-in`).
- Custom properties and design tokens are supported for timing (e.g., `var(--transition)`).
- The mapping covers all major UI effects: color, background, border, radius, shadow, gap, typography, and more.

**Examples:**
```jsx
<Block transition="fill 0.2s, radius 0.3s" /> // transitions background-color and border-radius
<Block transition="fade 0.15s ease-in, shadow 0.2s" /> // transitions mask and box-shadow
<Block transition="preset 0.2s" /> // transitions all typography-related properties
<Block transition="gap 0.2s" /> // transitions gap and margin
<Block transition="theme 0.3s" /> // transitions color, background, border, radius, outline, shadow
```

> **Tip:** Use semantic transition names for maintainable, theme-driven animations. Combine multiple transitions for complex effects.

### The `width` and `height` Styles
The `width` and `height` styles are concise shorthands for setting element dimensions, replacing the native `width`, `height`, `min-width`, `max-width`, `min-height`, and `max-height` properties. They support custom units, responsive arrays, and advanced sizing keywords.

- Use a single value for the main dimension (e.g., `2x`, `100px`, `50%`).
- Use two values for `[min, max]` (e.g., `1x 10x` sets min/max).
- Use three values for `[min, value, max]` (e.g., `1x 5x 10x`).
- Modifiers: `min`, `max` to set only min or max size (e.g., `min 2x`).
- Supports advanced/intrinsic keywords: `stretch`, `max-content`, `min-content`, `fit-content`.
- Use `true` for design-system default (`auto` for width, `auto` for height).

**Examples:**
```jsx
<Block width="10x" /> // width: 10x
<Block width="1x 10x" /> // min-width: 1x; max-width: 10x
<Block width="min 2x" /> // min-width: 2x
<Block width="stretch" /> // width: stretch (or fill-available)
<Block height="100px" /> // height: 100px
<Block height="1x 5x 10x" /> // min-height: 1x; height: 5x; max-height: 10x
<Block height={true} /> // height: auto
```

---

## The `display` and `hide` Styles

The `display` style sets the CSS `display` property. The `hide` style is a boolean shortcut that sets `display: none` when true, hiding the element.

**Examples:**
```jsx
<Block display="flex" /> // display: flex
<Block display="grid" /> // display: grid
<Block hide /> // display: none
<Block display="inline-block" hide={false} /> // display: inline-block
```

> **Tip:** Use `hide` for conditional rendering without unmounting the element.

---

## The `scrollbar` Style

The `scrollbar` style provides a powerful and flexible way to control the appearance and behavior of scrollbars across browsers. It supports custom sizing, color, visibility, and advanced modifiers for modern UI needs.

> **Note:** The value `true` is a boolean shortcut for a `thin`, design-system-colored scrollbar.

**Syntax:**
```jsx
<Block scrollbar="[modifiers] [size] [color1] [color2] [color3]" />
<Block scrollbar={true} /> // boolean shortcut for thin, default color
```

#### Modifiers
- `thin` – Use a thin scrollbar.
- `none` – Hide the scrollbar (`scrollbar-width: none`).
- `auto` – Use the browser default scrollbar width.
- `stable` – Reserve space for the scrollbar gutter (`scrollbar-gutter: stable`).
- `both-edges` – Reserve space on both edges (`scrollbar-gutter: stable both-edges`).
- `always` – Always show scrollbars (sets `overflow: scroll` if not set).
- `styled` – Apply a modern, styled scrollbar with design-system colors and transitions.

#### Values
- Any value (e.g. `8px`, `1x`, `12px`) is treated as the scrollbar thickness (width/height).

#### Colors
- First color: thumb (the draggable part)
- Second color: track (the background)
- Third color: corner (optional, defaults to track)
- If no color is provided, the default design-system thumb color is used and the track is transparent.

#### Transitions
- In `styled` mode, all scrollbar elements have smooth transitions for background, border-radius, box-shadow, width, height, and border, using `var(--transition)` duration.

#### Examples
```jsx
<Block scrollbar={true} /> // thin scrollbar, default color
<Block scrollbar="thin 10px #purple.40 #dark.04" />
<Block scrollbar="styled 12px #purple.40 #dark.04 #white.10" />
<Block scrollbar="none" />
<Block scrollbar="always 8px #primary.50 #white.02" overflow="auto" />
<Block scrollbar="both-edges 8px #primary.50 #white.02" />
```

> **Tip:** Use the `always` modifier to ensure scrollbars are always visible, especially for overlays or fixed panels.

---

## The `align`, `justify`, and `place` Styles

These styles provide concise, unified control over alignment and distribution in flex, grid, and other layouts. They set both the `-items` and `-content` CSS properties for their respective axes, making alignment consistent and easy.

- `align` sets both `align-items` and `align-content` (vertical alignment in flex/grid layouts).
- `justify` sets both `justify-items` and `justify-content` (horizontal alignment in flex/grid layouts).
- `place` sets both `place-items` and `place-content` (shorthand for aligning both axes in grid/flex layouts).

**Examples:**
```jsx
<Block align="center" /> // align-items: center; align-content: center
<Block justify="space-between" /> // justify-items: space-between; justify-content: space-between
<Block place="center" /> // place-items: center; place-content: center
```

> **Best Practice:** Use `place`, `placeContent`, `placeItems`, `align`, and `justify` styles for positioning and aligning content. Avoid using styles like `align-items`, `align-content`, `justify-items`, or `justify-content` directly in Tasty styles—these shorthands are more consistent, easier to maintain, and integrate better with the design system.

---

## The `fade` Style
The `fade` style is a powerful shorthand for applying gradient-based fading masks to the edges of an element. It replaces complex CSS mask gradients with a simple, declarative API and supports custom directions and fade widths.

- By default, applies a fade to all four edges (top, right, bottom, left).
- Use directional modifiers (`top`, `right`, `bottom`, `left`) to fade only specific edges.
- Accepts custom fade widths (e.g., `fade="2x"` for a thicker fade).
- Supports multiple values for different edges (e.g., `fade="2x 1x"`).
- The fade is implemented using CSS `mask` and `mask-composite` for smooth, hardware-accelerated effects.

**Examples:**
```jsx
<Block fade /> // fade on all edges with default width
<Block fade="2x left right" /> // fade only left and right edges, width 2x
<Block fade="1x top" /> // fade only top edge, width 1x
<Block fade="3x 1x top bottom" /> // top: 3x, bottom: 1x
```
