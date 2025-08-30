# Tasty CSS Runtime Debug Utilities

The tasty system provides powerful debug utilities to inspect generated CSS at runtime. These are especially useful for debugging complex responsive layouts and state-based styling.

## Basic Usage

```typescript
import { tastyDebug } from '@cube-dev/ui-kit';

// 🎯 Inspect an element by selector
const css = tastyDebug.inspectElement('[data-qa="my-header"]');

// 🎯 Get CSS for a specific tasty class
const classCSS = tastyDebug.getCSSForClass('t24');

// 🎯 Inspect a DOM element directly
const element = document.querySelector('.my-component');
tastyDebug.inspectDOMElement(element);

// 🎯 Get all generated CSS
const allCSS = tastyDebug.getAllCSS();

// 🎯 Get a summary of all tasty usage
tastyDebug.getSummary();
```

## Browser Console Usage

In development mode, `tastyDebug` is automatically available on `window`:

```javascript
// Check what's available
tastyDebug.getSummary()

// Inspect your components
tastyDebug.inspectElement('[data-qa="header"]')
tastyDebug.inspectElement('.some-component')

// Check specific classes
tastyDebug.getCSSForClass('t24')

// Find all tasty classes in use
tastyDebug.findAllTastyClasses()
```

## Advanced Inspection

```typescript
// Detailed inspection with breakdown
const inspection = tastyDebug.inspect('[data-qa="complex-grid"]');
console.log('Element:', inspection.element);
console.log('Tasty classes:', inspection.tastyClasses);
console.log('Full CSS:', inspection.css);
console.log('Per-class breakdown:', inspection.breakdown);

// Pretty-print CSS
tastyDebug.logCSS(someCSS, 'My Component CSS');
```

## Example Output

When you run `tastyDebug.inspectElement('[data-qa="header"]')`, you'll see:

```css
.t24:not([data-is-sticky]) {
  position: static; 
  background-color: transparent; 
  z-index: auto; 
  box-shadow: none var(--shadow-color);
}

.t24[data-is-sticky] {
  position: sticky; 
  top: 0; 
  background-color: var(--white-color); 
  z-index: 10; 
  box-shadow: 0 calc(0.5 * var(--gap)) calc(0.5 * var(--gap)) var(--white-color);
}

.t24 {
  display: grid; 
  padding: var(--gap) calc(2 * var(--gap)); 
  height: auto; 
  min-height: calc(6 * var(--gap)); 
  place-items: center stretch; 
  place-content: stretch;
}

@media (min-width: 1200px) {
  .t24:not([data-is-back-button-top]) {
    grid-template-areas: 
      "breadcrumbs breadcrumbs breadcrumbs breadcrumbs breadcrumbs breadcrumbs"
      "back        title       .           subtitle    spacer      extra"
      "back        title       .           subtitle    spacer      extra"
      "content     content     content     content     content     content"
      "footer      footer      footer      footer      footer      footer";
  }
}

/* ...more responsive and state-based CSS... */
```

## Use Cases

- **🐛 Debugging**: Why isn't my grid layout working?
- **🔍 Understanding**: What CSS is actually being generated?
- **⚡ Performance**: How much CSS is being generated?
- **📱 Responsive**: Are my breakpoints working correctly?
- **🎛️ State Logic**: Are my modifiers applying the right styles?

## Environment Behavior

### Development Mode
The global `window.tastyDebug` is automatically available when `NODE_ENV` is 'development' or not 'production':

```javascript
// Available automatically in browser console
tastyDebug.getSummary()
```

### Production Mode
In production, the global `window.tastyDebug` is not installed automatically. You can either:

1. **Import directly** (recommended):
```typescript
import { tastyDebug } from '@cube-dev/ui-kit';
tastyDebug.inspectElement('[data-qa="my-component"]');
```

2. **Manually install globally**:
```typescript
import { installGlobalDebug } from '@cube-dev/ui-kit';
installGlobalDebug(); // Makes window.tastyDebug available
```

### Manual Installation

You can manually install the global debug utilities at any time:

```typescript
import { installGlobalDebug, tastyDebug } from '@cube-dev/ui-kit';

// Install globally for easy console access
installGlobalDebug();

// Or use directly
tastyDebug.inspectElement('[data-qa="header"]');
```
