# Zero Runtime Mode (tastyStatic)

`tastyStatic` is a build-time utility for generating CSS with zero runtime overhead. It's designed for static sites, no-JS websites, and performance-critical applications where you want to eliminate all runtime styling code.

---

## When to Use

- **Static site generation (SSG)** — Pre-render all styles at build time
- **No-JavaScript websites** — CSS works without any JS runtime
- **Performance-critical pages** — Zero runtime overhead for styling
- **Landing pages** — Minimal bundle size with pre-generated CSS

## Quick Start

The zero-runtime mode is part of the main `@tenphi/tasty` package. No additional packages required.

### Basic Usage

```tsx
import { tastyStatic } from '@tenphi/tasty/static';

// Define styles - returns StaticStyle object
const button = tastyStatic({
  display: 'inline-flex',
  padding: '2x 4x',
  fill: '#purple',
  color: '#white',
  radius: '1r',
});

// Use in JSX - works via toString() coercion
<button className={button}>Click me</button>

// Or access className explicitly
<button className={button.className}>Click me</button>
```

---

## API Reference

### tastyStatic(styles)

Creates a `StaticStyle` object from a styles definition.

```tsx
const card = tastyStatic({
  padding: '4x',
  fill: '#white',
  border: true,
  radius: true,
});
```

### tastyStatic(base, styles)

Extends an existing `StaticStyle` with additional styles. Uses `mergeStyles` internally for proper nested selector handling.

```tsx
const button = tastyStatic({
  padding: '2x 4x',
  fill: '#blue',
  Icon: { color: '#white' },
});

const primaryButton = tastyStatic(button, {
  fill: '#purple',
  Icon: { opacity: 0.8 },
});
```

### tastyStatic(selector, styles)

Generates global styles for a CSS selector. The call is removed from the bundle after transformation.

```tsx
tastyStatic('body', {
  fill: '#surface',
  color: '#text',
  preset: 't3',
});
```

---

## StaticStyle Object

| Property | Type | Description |
|----------|------|-------------|
| `className` | `string` | Space-separated class names for use in JSX |
| `styles` | `Styles` | The original (or merged) styles object |
| `toString()` | `() => string` | Returns `className` for string coercion |

---

## Babel Plugin Configuration

### Basic Configuration

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['@tenphi/tasty/babel-plugin', {
      output: 'public/tasty.css',
    }]
  ]
};
```

### With Configuration

```javascript
module.exports = {
  plugins: [
    ['@tenphi/tasty/babel-plugin', {
      output: 'public/tasty.css',
      config: {
        states: {
          '@mobile': '@media(w < 768px)',
          '@tablet': '@media(w < 1024px)',
          '@dark': '@root(theme=dark)',
        },
        devMode: true,
      },
    }]
  ]
};
```

### Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `output` | `string` | `'tasty.css'` | Path for generated CSS file |
| `config.states` | `Record<string, string>` | `{}` | Predefined state aliases |
| `config.devMode` | `boolean` | `false` | Add source comments to CSS |
| `config.recipes` | `Record<string, RecipeStyles>` | `{}` | Predefined style recipes |

---

## Recipes

Recipes work with `tastyStatic` the same way as with runtime `tasty`:

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['@tenphi/tasty/babel-plugin', {
      output: 'public/tasty.css',
      config: {
        recipes: {
          card: { padding: '4x', fill: '#surface', radius: '1r', border: true },
          elevated: { shadow: '2x 2x 4x #shadow' },
        },
      },
    }]
  ]
};
```

```tsx
import { tastyStatic } from '@tenphi/tasty/static';

const card = tastyStatic({
  recipe: 'card elevated',
  color: '#text',
});

<div className={card}>Styled card</div>
```

---

## Next.js Integration

```javascript
// next.config.js
const { withTastyZero } = require('@tenphi/tasty/next');

module.exports = withTastyZero({
  output: 'public/tasty.css',
  config: {
    states: {
      '@mobile': '@media(w < 768px)',
    },
    devMode: process.env.NODE_ENV === 'development',
  },
})({
  reactStrictMode: true,
});
```

### Including the CSS

```tsx
// app/layout.tsx (App Router)
import '@/public/tasty.css';

// or pages/_app.tsx (Pages Router)
import '../public/tasty.css';
```

---

## Vite Integration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@tenphi/tasty/babel-plugin', {
            output: 'public/tasty.css',
            config: {
              states: { '@mobile': '@media(w < 768px)' },
            },
          }],
        ],
      },
    }),
  ],
});
```

---

## Build Transformation

### Before (Source Code)

```tsx
import { tastyStatic } from '@tenphi/tasty/static';

const button = tastyStatic({
  padding: '2x 4x',
  fill: '#purple',
  color: '#white',
});

tastyStatic('.heading', { preset: 'h1' });

export const Button = () => <button className={button}>Click</button>;
```

### After (Production Build)

```tsx
const button = {
  className: 'ts3f2a1b ts8c4d2e',
  styles: { padding: '2x 4x', fill: '#purple', color: '#white' },
  toString() { return this.className; }
};

export const Button = () => <button className={button}>Click</button>;
```

### Generated CSS (tasty.css)

```css
/* Generated by @tenphi/tasty/zero - DO NOT EDIT */

.ts3f2a1b.ts3f2a1b {
  padding: 16px 32px;
}

.ts8c4d2e.ts8c4d2e {
  background: #9370db;
  color: #fff;
}

.heading.heading {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
}
```

---

## Style Extension

```tsx
// Base button
const button = tastyStatic({
  display: 'inline-flex',
  padding: '2x 4x',
  radius: '1r',
  fill: '#gray.20',
  color: '#text',
  transition: 'fill 0.15s',
});

// Variants
const primaryButton = tastyStatic(button, {
  fill: '#purple',
  color: '#white',
});

const dangerButton = tastyStatic(button, {
  fill: '#danger',
  color: '#white',
});
```

---

## State-based Styling

```tsx
const card = tastyStatic({
  padding: {
    '': '4x',
    '@mobile': '2x',
  },
  display: {
    '': 'flex',
    '@mobile': 'block',
  },
});
```

---

## Extending Style Types (TypeScript)

If you add custom style properties, use module augmentation so `tastyStatic` recognizes them too. See [Extending Style Types](configuration.md#extending-style-types-typescript) in the configuration docs.

---

## Limitations

1. **Static values only** — All style values must be known at build time
2. **No runtime props** — Cannot use `styleProps` or dynamic `styles` prop
3. **No mods at runtime** — Modifiers must be defined statically
4. **Build-time transformation required** — Babel plugin must process files

### Workarounds

For dynamic styling needs, combine with regular CSS or CSS variables:

```tsx
const card = tastyStatic({
  padding: '4x',
  fill: 'var(--card-bg, #white)',
});

<div
  className={card}
  style={{ '--card-bg': isActive ? '#purple' : '#white' }}
/>
```

---

## Best Practices

1. **Define base styles** for common patterns, then extend for variants
2. **Use selector mode** for global/body styles
3. **Enable devMode** in development for easier debugging
4. **Configure states** for consistent responsive breakpoints
5. **Import generated CSS** early in your app entry point

---

## Related

- [Usage Guide](usage.md) — Runtime styling: component creation, state mappings, sub-elements, variants, and hooks
- [Configuration](configuration.md) — Global configuration: tokens, recipes, custom units, and style handlers
