# Glaze (tasty theming)

## Goal

`glaze` is a color generation API for tasty themes.

It should:
- generate robust `light`, `dark`, and `high-contrast` colors from a seed,
- preserve contrast for UI pairs via explicit dependencies,
- export directly into tasty `tokens` (`#name` keys),
- remain simple to reason about — no hidden role math.

## Core Rule: One Theme = One Hue Family

A single `glaze` theme is strictly tied to one hue/saturation seed.

Status colors (`danger`, `success`, `warning`) are derived via `extend`, which inherits all color definitions and replaces the hue/saturation seed.

## Main API

Create a single-hue theme:

```ts
const primary = glaze({
  hue: 280,
  saturation: 80,
});
```

Shorthand:

```ts
const primary = glaze(280, 80);
```

## Color Definitions

Colors are defined explicitly with lightness and saturation factor. No implicit roles — every value is stated.

### Root colors (explicit position)

```ts
primary.colors({
  'surface': { l: 97, sat: 0.75 },
  'border':  { l: 90, sat: 0.20 },
});
```

- `l` — lightness in the light scheme (0–100).
- `sat` — saturation factor applied to the seed saturation (0–1, default: `1`).

### Dependent colors (relative to base)

```ts
primary.colors({
  'surface': { l: 97, sat: 0.75 },
  'text':    { base: 'surface', contrast: 52, minContrast: 'AAA' },
});
```

- `base` — name of another color in the same theme.
- `contrast` — lightness delta from the base color (like `height`). Accepts a single number or `[normal, high-contrast]` pair.
- `minContrast` — WCAG contrast floor against the base (like `min-height`). Accepts a single value or `[normal, high-contrast]` pair.

Both `contrast` and `minContrast` are considered. The effective lightness satisfies both constraints — the more demanding one wins.

### `contrast` sign convention

The sign is optional. Resolution rules:

1. **Negative sign** — always means "darker than base". `contrast: -52` → `L = L_base - 52`.
2. **Positive sign** — always means "lighter than base". `contrast: +48` → `L = L_base + 48`.
3. **No sign (positive number)** — auto-resolved:
   - Compute `L_candidate = L_base + contrast`.
   - If `L_candidate > 100`, flip to negative: `L = L_base - contrast`.
   - Otherwise keep positive: `L = L_base + contrast`.

This means unsigned values "just work" for the common case (text darker than a light surface), while explicit sign gives full control when needed.

Examples:

```ts
// Surface L=97
'text': { base: 'surface', contrast: 52 }
// → 97 + 52 = 149 > 100 → flips to 97 - 52 = 45 ✓

// Button fill L=52
'btn-text': { base: 'btn-fill', contrast: 48 }
// → 52 + 48 = 100 → keeps as 100 ✓

// Explicit negative for clarity
'dark-text': { base: 'surface', contrast: -52 }
// → 97 - 52 = 45 ✓
```

### `minContrast` (WCAG floor)

Accepts a numeric ratio or a preset string:

```ts
type MinContrast = number | 'AA' | 'AAA' | 'AA-large' | 'AAA-large';
```

Preset mapping:
- `'AA'` → `4.5`
- `'AAA'` → `7`
- `'AA-large'` → `3`
- `'AAA-large'` → `4.5`

Behavior:
- Constraint is applied independently for each scheme (light, dark, high-contrast).
- If the `contrast` delta already satisfies the floor, keep it.
- Otherwise, the solver adjusts lightness until the target is met.
- If the target cannot be reached, return the closest possible value and mark as unresolved in debug metadata.

Implementation details: `src/tasty/utils/CONTRAST_SOLVER.spec.md`.

### High-contrast via array values

`contrast`, `minContrast`, and `l` accept a `[normal, high-contrast]` pair for per-color control over high-contrast mode:

```ts
'border': { base: 'surface', contrast: [7, 20], minContrast: 'AA-large' }
//                                      ↑   ↑
//                                  normal  high-contrast
```

This gives precise control where it matters most — subtle elements like borders get a large HC boost, while already-contrasty elements like text can stay the same:

```ts
'text':   { base: 'surface', contrast: 52, minContrast: 'AAA' }       // same in both modes
'border': { base: 'surface', contrast: [7, 20], minContrast: 'AA-large' }  // big HC jump
'muted':  { base: 'surface', contrast: [35, 50], minContrast: ['AA-large', 'AA'] }
```

A single value applies to both modes. No global multiplier needed — all control is local and explicit.

### Color definition shape

```ts
type Pair<T> = T | [T, T];  // [normal, high-contrast]

interface ColorDef {
  // Root color (explicit position)
  l?: Pair<number>;    // 0–100, light scheme lightness
  sat?: number;        // 0–1, saturation factor (default: 1)

  // Dependent color (relative to base)
  base?: string;              // name of another color
  contrast?: Pair<number>;    // lightness delta from base
  minContrast?: Pair<MinContrast>;  // WCAG contrast floor against base

  // Adaptation mode
  mode?: 'auto' | 'fixed' | 'static';  // default: 'auto'
}
```

Every color must have either `l` (root) or `base` + `contrast` (dependent). `minContrast` can appear on either but is most useful on dependent colors.

## Adaptation Modes

Modes control how colors adapt across schemes:

- **`auto`** (default) — full adaptation. Light ↔ dark inversion. High-contrast boost.
- **`fixed`** — color stays recognizable across schemes. Only safety corrections (slight lightness nudge for readability). Brand buttons, CTAs.
- **`static`** — no adaptation at all. Same value in every scheme.

### How `contrast` adapts by mode

**`auto` mode** — the contrast sign flips in dark scheme (visual relationship is preserved):

```ts
// Light: surface L=97, text contrast=52 → L=45 (dark text on light bg)
// Dark:  surface inverts to L≈14, sign flips → L=14+52=66
//        minContrast solver may push further to L≈88 (light text on dark bg)
```

**`fixed` mode** — lightness is mapped (not inverted) to the dark window, contrast sign is preserved:

```ts
// Light: btn-fill L=52, btn-text contrast=+48 → L=100 (white on brand)
// Dark:  btn-fill maps to L≈51.6 (barely changes), sign preserved → L≈99.6
//        desaturation also applies — brand stays recognizable but softer
```

**`static` mode** — no adaptation, same value in every scheme.

## Configuration

All global settings are configured via `glaze.configure()`:

```ts
interface GlazeConfig {
  darkLightness?: [number, number];  // default: [10, 90]
  darkDesaturation?: number;          // default: 0.1
  states?: {
    dark?: string;          // default: '@dark'
    highContrast?: string;  // default: '@high-contrast'
  };
  modes?: {
    dark?: boolean;          // default: true
    highContrast?: boolean;  // default: false
  };
}
```

Defaults:

```ts
glaze.configure({
  darkLightness: [10, 90],
  darkDesaturation: 0.1,
  states: {
    dark: '@dark',
    highContrast: '@high-contrast',
  },
  modes: {
    dark: true,
    highContrast: false,
  },
});
```

## Output Modes

The `modes` option controls which scheme variants are included in the exported tokens/JSON. Light is always the default and always included. The two toggles — `dark` and `highContrast` — control whether dark and high-contrast variants appear in the output.

When `highContrast` is enabled, it produces both light-HC and dark-HC variants (the latter only if `dark` is also enabled).

### Setting modes globally

```ts
glaze.configure({
  modes: { dark: true, highContrast: false },  // no high-contrast variants
});
```

### Per-export override

Both `tokens()` and `json()` accept a `modes` option that overrides the global setting for that call:

```ts
// Global config has both enabled, but this export only needs light
const lightOnly = palette.tokens({ prefix: true, modes: { dark: false, highContrast: false } });
// → { '#primary-surface': { '': 'okhsl(...)' } }

// Light + dark only
const lightDark = palette.tokens({ prefix: true, modes: { highContrast: false } });
// → { '#primary-surface': { '': '...', '@dark': '...' } }

// Full export (default)
const full = palette.tokens({ prefix: true });
// → { '#primary-surface': { '': '...', '@dark': '...', '@high-contrast': '...', '@dark & @high-contrast': '...' } }
```

The same works on individual themes:

```ts
const tokens = primary.tokens({ modes: { highContrast: false } });
const json = primary.json({ modes: { dark: false } });
```

### Resolution priority

Modes are resolved per-field in this order (highest first):

1. `tokens({ modes })` / `json({ modes })` — per-call override
2. `glaze.configure({ modes })` — global config
3. Built-in default: `{ dark: true, highContrast: false }`

### Light is always resolved

The engine always resolves all four internal variants (light values are needed as the basis for dark scheme mapping). The `modes` option only controls what appears in the **export**.

## Dark Scheme Mapping

Dark mapping uses `darkLightness` and `darkDesaturation` from the config:

### Lightness mapping

**`auto` mode** — lightness is inverted within the configured window:

```ts
const [lo, hi] = darkLightness;
const invertedL = ((100 - lightness) * (hi - lo)) / 100 + lo;
```

**`fixed` mode** — lightness is mapped to the same window but without inversion (brand colors stay recognizable):

```ts
const [lo, hi] = darkLightness;
const mappedL = (lightness * (hi - lo)) / 100 + lo;
```

Examples with `darkLightness: [10, 90]`:

| Color | Light L | Auto (inverted) | Fixed (mapped) |
|---|---|---|---|
| surface (L=97) | 97 | 12.4 | 87.6 |
| btn-fill (L=52) | 52 | 48.4 | 51.6 |
| btn-text (L=100) | 100 | 10 | 90 |

**`static` mode** — no mapping, same lightness in all schemes.

### Saturation in dark mode

`darkDesaturation` reduces saturation for all colors in the dark scheme:

```ts
S_dark = S_light * (1 - darkDesaturation)
```

This applies to both `auto` and `fixed` modes. Highly saturated colors can look harsh on dark backgrounds — this global reduction keeps them comfortable.

### Contrast re-evaluation

After lightness mapping and desaturation, `minContrast` is re-evaluated to ensure the floor is still met in the dark scheme. The solver adjusts lightness if needed.

## High-Contrast Mode

High-contrast values are specified per-color using the `[normal, high-contrast]` array syntax on `contrast`, `minContrast`, and `l`.

No global multiplier — all control is local and explicit:

```ts
primary.colors({
  'surface':  { l: [97, 100], sat: 0.75 },                                // whiter in HC
  'text':     { base: 'surface', contrast: 52, minContrast: 'AAA' },       // already high, same in both
  'border':   { base: 'surface', contrast: [7, 20], minContrast: 'AA-large' },  // subtle → visible
  'muted':    { base: 'surface', contrast: [35, 50], minContrast: ['AA-large', 'AA'] },
});
```

When a single value is provided, it applies to both normal and high-contrast modes.

## Inherited Themes (`extend`)

`extend` creates a new theme that inherits all color definitions from the parent, replacing only the hue and/or saturation seed:

```ts
const primary = glaze(280, 80);

primary.colors({
  'surface':  { l: 97, sat: 0.75 },
  'text':     { base: 'surface', contrast: 52, minContrast: 'AAA' },
  'border':   { base: 'surface', contrast: [7, 20], minContrast: 'AA-large' },
  'bg':       { l: 97, sat: 0.75 },
  'icon':     { l: 60, sat: 0.94 },
  'btn-fill': { l: 52, mode: 'fixed' },
  'btn-text': { base: 'btn-fill', contrast: 48, minContrast: 'AA', mode: 'fixed' },
  'disabled': { l: 81, sat: 0.40 },
});

// Inherit ALL color definitions, just rotate hue
const danger  = primary.extend({ hue: 23 });
const success = primary.extend({ hue: 157 });
const warning = primary.extend({ hue: 84 });
const note    = primary.extend({ hue: 302 });
```

Each extended theme produces the same set of named tokens with the new hue. All contrast relationships, saturation factors, and mode settings carry over.

`extend` can also override saturation:

```ts
const muted = primary.extend({ saturation: 40 });
```

### Overriding colors in `extend`

Pass `colors` to `extend` to add or override individual colors (additive merge with inherited set):

```ts
const danger = primary.extend({
  hue: 23,
  colors: {
    'btn-fill': { l: 48, mode: 'fixed' }, // override just this one
  },
});
```

### `.colors()` replaces

Calling `.colors()` directly on a theme **replaces** all color definitions (not additive):

```ts
const custom = glaze(280, 80);
custom.colors({ 'surface': { l: 95 } });  // only 'surface' exists now
custom.colors({ 'text': { l: 30 } });     // only 'text' exists now — 'surface' is gone
```

Summary:
- `extend({ colors })` — **additive** merge with inherited colors.
- `.colors()` — **replaces** all colors on the theme.

## Multi-Theme Composition (`palette`)

Combine multiple themes into a single palette:

```ts
const palette = glaze.palette({
  primary,
  danger,
  success,
  warning,
  note,
});
```

### Token export

Export as tasty tokens with automatic prefixing:

```ts
const tokens = palette.tokens({
  prefix: true, // uses "<themeName>-"
});
```

Output:

```ts
{
  '#primary-surface': {
    '': 'okhsl(...)',
    '@dark': 'okhsl(...)',
    '@high-contrast': 'okhsl(...)',
    '@dark & @high-contrast': 'okhsl(...)'
  },
  '#primary-text': { ... },
  '#danger-surface': { ... },
  '#danger-text': { ... },
}
```

Restrict to specific modes:

```ts
const tokens = palette.tokens({
  prefix: true,
  modes: { highContrast: false },  // omit high-contrast variants
});
// → { '#primary-surface': { '': 'okhsl(...)', '@dark': 'okhsl(...)' } }
```

Custom prefix mapping:

```ts
palette.tokens({
  prefix: {
    primary: 'brand-',
    danger: 'error-',
  },
});
```

### JSON export (framework-agnostic)

```ts
const data = palette.json({
  prefix: true,
});
```

Output:

```ts
{
  primary: {
    surface: {
      light: 'okhsl(...)',
      dark: 'okhsl(...)',
      lightContrast: 'okhsl(...)',
      darkContrast: 'okhsl(...)'
    },
    text: { ... }
  },
  danger: { ... }
}
```

Restrict to specific modes:

```ts
const data = palette.json({
  prefix: true,
  modes: { dark: false, highContrast: false },
});
// → { primary: { surface: { light: 'okhsl(...)' } } }
```

No tasty-specific state aliases — plain scheme variants for use in any runtime.

## Integration with tasty tokens

Export format uses `#token` keys that plug directly into tasty:
- `#name` → `--name-color` CSS custom property
- Automatic `--name-color-rgb` variant
- Token values are state maps with up to four states (controlled by `modes`):
  - `''` — light/default
  - `'@dark'` — dark mode
  - `'@high-contrast'` — high-contrast light
  - `'@dark & @high-contrast'` — high-contrast dark

### State aliases

State alias defaults (`'@dark'`, `'@high-contrast'`) are defined in the Configuration section.

Resolution priority (highest first):

1. `palette.tokens({ states })` — per-call override
2. `glaze.configure({ states })` — global config
3. Built-in defaults

### Binding to selectors

Users bind aliases to actual CSS selectors via tasty `configure`:

```ts
import { configure } from '@cube-dev/ui-kit';

configure({
  states: {
    '@dark':
      '@root(schema=dark) | (!@root(schema) & @media(prefers-color-scheme: dark))',
    '@high-contrast':
      '@media(prefers-contrast: more) | @root(contrast=high)',
  },
});
```

## Dependency Resolution

Colors are resolved in dependency order (topological sort), not declaration order. The engine builds a dependency graph from `base` references and resolves root colors first, then dependent colors.

- Circular `base` references → **validation error**.
- Reference to a non-existent color name → **validation error**.

## Validation Rules

| Condition | Behavior |
|---|---|
| Both `l` and `base` on same color | **Warning**, `l` takes precedence |
| `contrast` without `base` | **Validation error** |
| `l` resolves outside 0–100 | Clamp silently to [0, 100] |
| `sat` outside 0–1 | Clamp silently to [0, 1] |
| Circular `base` references | **Validation error** |
| `base` references non-existent name | **Validation error** |

## Using Glaze Tokens with Alpha

Glaze generates opaque colors. Interactive state variations (hover, pressed, disabled) are expressed using tasty's alpha modifier syntax on the exported tokens:

```ts
fill: {
  '': '#primary.10',         // 10% opacity of the primary token
  hovered: '#primary.16',    // 16% opacity
  pressed: '#primary-text.10',
  disabled: '#dark.04',
}
```

This keeps the number of generated tokens small — one opaque color per name — while allowing unlimited alpha variations at the usage site.

## Naming Conventions

- Color names use `kebab-case`: `btn-fill`, `app-surface`, `muted-text`.
- Fill/text pairs are expressed by naming convention only: `btn-fill` + `btn-text`, `app-surface` + `app-text`.
- The engine does not know "pair" — it only resolves dependencies between named colors.

## Full Example

Mapping current `colors.ts` and `item-themes.ts` to glaze:

```ts
const primary = glaze(280, 80);

primary.colors({
  // App-level colors (auto mode)
  'surface':  { l: 97, sat: 0.75 },
  'text':     { base: 'surface', contrast: 52, minContrast: 'AAA' },
  'border':   { base: 'surface', contrast: [7, 20], minContrast: 'AA-large' },
  'bg':       { l: 97, sat: 0.75 },
  'icon':     { l: 60, sat: 0.94 },

  // Primary button (fixed mode — brand fill, white text)
  'btn-fill': { l: 52, mode: 'fixed' },
  'btn-text': { base: 'btn-fill', contrast: 48, minContrast: 'AA', mode: 'fixed' },

  // Disabled state
  'disabled': { l: 81, sat: 0.40 },
});

// Status themes — same structure, different hue
const danger  = primary.extend({ hue: 23 });
const success = primary.extend({ hue: 157 });
const warning = primary.extend({ hue: 84 });
const note    = primary.extend({ hue: 302 });

// Compose and export
const palette = glaze.palette({ primary, danger, success, warning, note });
const tokens = palette.tokens({ prefix: true });
```

## Related Specifications

- Contrast solver: `src/tasty/utils/CONTRAST_SOLVER.spec.md`
