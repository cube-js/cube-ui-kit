# Tasty Style Injector

A high-performance CSS-in-JS solution designed to replace styled-components in the Tasty design system.

## Overview

The Style Injector provides:
- **Hash-based deduplication** - identical CSS gets the same className
- **Reference counting** - automatic cleanup when components unmount
- **CSS nesting flattening** - handles `&`, `.Class`, `SubElement` patterns
- **Efficient bulk cleanup** - unused styles are marked and cleaned up in batches
- **SSR support** - deterministic class names and CSS extraction
- **Multiple roots** - works with Document and ShadowRoot
- **Style elements** - reliable DOM insertion with fallbacks

## Quick Start

```typescript
import { inject, configure } from './tasty/injector';

// Configure once (optional)
configure({
  cacheSize: 1000,
  collectMetrics: true,
});

// Inject component styles
const { className, dispose } = inject([{
  selector: '.t-123',
  declarations: 'color: red; padding: 10px;'
}]);

// Inject global styles
const globalDispose = inject([
  { selector: 'body', declarations: 'margin: 0; font-family: Arial;' },
  { selector: '.header', declarations: 'background: blue; height: 60px;' }
]);

// Cleanup when component unmounts
useEffect(() => dispose, [dispose]);
```

## API Reference

### `inject(rules: StyleResult[], options?): InjectResult`

Injects CSS rules and returns a className with dispose function. Supports both component injection (with generated class names) and global injection (with custom selectors).

```typescript
// Component injection - for tasty components
const componentResult = inject([{
  selector: '.t-abc123',
  declarations: 'color: red; padding: 10px;',
}]);
// Returns: { className: 't-abc123', dispose: () => void }

// Global injection - for global styles  
const globalResult = inject([
  {
    selector: 'body',
    declarations: 'margin: 0; font-family: Arial;',
  },
  {
    selector: '.header',
    declarations: 'background: blue; color: white;',
    atRules: ['@media (min-width: 768px)'],
  }
]);
// Returns: { className: 't-def456', dispose: () => void }
```

### `configure(config: Partial<StyleInjectorConfig>): void`

Configures the global injector instance.

```typescript
configure({
  maxRulesPerSheet: 8000,           // Cap rules per sheet (infinite by default)
  unusedStylesThreshold: 500,       // Threshold for bulk cleanup of unused styles
  bulkCleanupDelay: 5000,           // Delay before bulk cleanup (ms, ignored if idleCleanup is true)
  idleCleanup: true,                // Use requestIdleCallback for cleanup when available
  collectMetrics: false,            // Collect performance metrics
  forceTextInjection: false,        // Force textContent insertion (auto-detected for tests)
  nonce: 'csp-nonce',               // CSP nonce for style elements
});
```

### `getCssText(options?): string`

Extracts CSS text for SSR.

```typescript
const cssForSSR = getCssText();
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   tastyElement  │────│  StyleInjector   │────│  SheetManager   │
│   tastyGlobal   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  renderStyles   │    │ KeyframesManager │    │  RootRegistry   │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                            │
         │                                            │
         ▼                                            ▼
┌─────────────────┐                             ┌─────────────────┐
│   StyleResult   │                             │ CSSStyleSheet   │
│     Array       │                             │ <style> element │
└─────────────────┘                             └─────────────────┘
```

## Implementation Status

### ✅ Complete
- Core types and interfaces
- Hash utility (collision-resistant, base52 encoding)
- Direct StyleResult injection (bypasses CSS parsing)
- SheetManager (DOM manipulation, cleanup)
- StyleInjector core (injection, deduplication, GC)
- Global configuration API
- Comprehensive test suite

### 🔧 In Progress
- Integration with tasty components

### 🚀 Ready For
- Integration with `tastyElement` and `tastyGlobal`
- Replacement of styled-components
- Production deployment

## Test Coverage

- **Comprehensive test coverage** covering all critical functionality
- All major code paths tested: hashing, direct injection, sheet management, reference counting, bulk cleanup

## Files

- `types.ts` - TypeScript interfaces and types
- `hash.ts` - Hash utility for class name generation
- `sheet-manager.ts` - DOM stylesheet management
- `injector.ts` - Core StyleInjector class
- `index.ts` - Global API and configuration
- `*.test.ts` - Comprehensive test suites

## Performance Features

- **Deduplication** - Identical CSS reuses the same className
- **Reference counting** - Automatic cleanup prevents memory leaks
- **Bulk cleanup** - Unused styles are marked and cleaned up efficiently in batches
- **Style elements** - Reliable DOM insertion with textContent fallbacks
- **Unused style reuse** - Previously used styles can be instantly reactivated
- **Minimal CSSOM manipulation** - Bulk operations reduce DOM write overhead

## Browser Support

- **All browsers** - Uses reliable `<style>` element insertion
- **CSS injection** - Uses CSSStyleSheet.insertRule with textContent fallback
- **Shadow DOM** - Full support for multiple roots
- **SSR** - Deterministic class names and CSS extraction

The injector is ready for production use and provides a complete replacement for styled-components with better performance and deterministic behavior.
