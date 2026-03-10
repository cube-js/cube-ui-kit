# Tasty Debug Utilities

Runtime CSS inspection and diagnostics for the Tasty styling system. Inspect injected styles, measure cache performance, analyze style chunks, and troubleshoot CSS issues — all from the browser console.

---

## Overview

`tastyDebug` is a diagnostic object that exposes every aspect of Tasty's runtime CSS state. It is designed for development use: inspecting which CSS is active, what's cached, how chunks are distributed, and whether cleanup is working as expected.

In development mode (`isDevEnv()` returns `true`), `tastyDebug` is automatically installed on `window.tastyDebug`. In production, you can install it manually when needed.

> **Note:** This is a development/debugging tool. It does not affect style generation or application behavior.

---

## Quick Start

```typescript
// Auto-installed in dev mode. Otherwise:
import { tastyDebug } from '@tenphi/tasty';
tastyDebug.install();

// Print a quick-start guide
tastyDebug.help();

// Get a comprehensive overview logged to the console
tastyDebug.summary({ log: true });

// See all active CSS (for components currently in the DOM)
tastyDebug.log('active');

// Inspect a specific element
tastyDebug.inspect('.my-button');

// Check cache hit rates
tastyDebug.metrics();
```

---

## Core Types

### `CSSTarget`

The `target` parameter accepted by `css()`, `log()`, and related methods:

```typescript
type CSSTarget =
  | 'all'       // All tasty CSS (component + global + raw)
  | 'global'    // Only global CSS (from injectGlobal)
  | 'active'    // CSS for classes currently present in the DOM
  | 'unused'    // CSS with refCount = 0 (cached but not actively used)
  | 'page'      // ALL CSS on the page, including non-tasty stylesheets
  | string      // A tasty class ('t123') or a CSS selector ('.my-class')
  | string[]    // Array of tasty classes (['t0', 't5', 't12'])
  | Element;    // A DOM element
```

### `CssOptions`

Common options for CSS retrieval methods:

```typescript
interface CssOptions {
  root?: Document | ShadowRoot;  // Target root (default: document)
  prettify?: boolean;            // Format CSS output (default: true)
  log?: boolean;                 // Auto-log to console (default: false)
}
```

---

## API Reference

### `css(target, opts?): string`

Retrieves CSS text for a given target. This is the primary method for extracting CSS from the runtime.

```typescript
// All tasty CSS
tastyDebug.css('all');

// Only CSS for classes currently in the DOM
tastyDebug.css('active');

// CSS for unused classes (refCount = 0, still in cache)
tastyDebug.css('unused');

// Only global CSS (injected via injectGlobal)
tastyDebug.css('global');

// ALL CSS on the page (including non-tasty stylesheets)
tastyDebug.css('page');

// CSS for a specific tasty class
tastyDebug.css('t42');

// CSS for multiple tasty classes
tastyDebug.css(['t0', 't5', 't12']);

// CSS affecting a DOM element (by selector)
tastyDebug.css('.my-button');

// CSS affecting a DOM element (by reference)
const el = document.querySelector('.my-button');
tastyDebug.css(el);

// With options
tastyDebug.css('active', { prettify: false, log: true });

// Shadow DOM
const shadowRoot = host.shadowRoot;
tastyDebug.css('all', { root: shadowRoot });
```

---

### `inspect(target, opts?): InspectResult`

Inspects a DOM element and returns detailed information about its tasty styles, including chunk assignments.

```typescript
interface InspectResult {
  element?: Element | null;
  classes: string[];    // Tasty classes found on the element (e.g., ['t0', 't5'])
  chunks: ChunkInfo[];  // Chunk assignment per class
  css: string;          // Prettified CSS affecting the element
  size: number;         // CSS size in characters
  rules: number;        // Number of CSS rule blocks
}

interface ChunkInfo {
  className: string;       // e.g., 't0'
  chunkName: string | null; // e.g., 'appearance', 'font', 'dimension'
}
```

```typescript
// By CSS selector
const result = tastyDebug.inspect('.my-card');
console.log(result.classes);  // ['t3', 't7', 't12']
console.log(result.chunks);   // [{className: 't3', chunkName: 'appearance'}, ...]
console.log(result.rules);    // 5
console.log(result.css);      // prettified CSS

// By element reference
const el = document.querySelector('[data-element="Title"]');
tastyDebug.inspect(el);

// Shadow DOM
tastyDebug.inspect('.shadow-component', { root: shadowRoot });
```

---

### `cache(opts?): CacheStatus`

Returns the current state of the style cache: which classes are active, which are unused, and performance metrics.

```typescript
interface CacheStatus {
  classes: {
    active: string[];  // Classes with refCount > 0 and present in DOM
    unused: string[];  // Classes with refCount = 0 but still in cache
    all: string[];     // Union of active and unused
  };
  metrics: CacheMetrics | null;
}
```

```typescript
const status = tastyDebug.cache();

console.log(status.classes.active.length);  // 42
console.log(status.classes.unused.length);  // 8
console.log(status.metrics?.hits);          // 156
```

---

### `cleanup(opts?): void`

Forces immediate cleanup of all unused styles (those with `refCount = 0`).

```typescript
tastyDebug.cleanup();

// Shadow DOM
tastyDebug.cleanup({ root: shadowRoot });
```

---

### `metrics(opts?): CacheMetrics | null`

Returns performance metrics for the style cache. Only available when `devMode` is enabled.

```typescript
interface CacheMetrics {
  hits: number;             // Successful cache hits
  misses: number;           // New styles injected (cache misses)
  bulkCleanups: number;     // Number of bulk cleanup operations
  totalInsertions: number;  // Lifetime style insertions
  totalUnused: number;      // Total styles marked as unused
  stylesCleanedUp: number;  // Total styles removed by cleanup
  startTime: number;        // Metrics collection start timestamp
  unusedHits?: number;      // Reactivations of cached unused styles
  cleanupHistory: {
    timestamp: number;
    classesDeleted: number;
    cssSize: number;
    rulesDeleted: number;
  }[];
}
```

```typescript
const m = tastyDebug.metrics();

if (m) {
  const hitRate = ((m.hits + (m.unusedHits || 0)) / (m.hits + m.misses)) * 100;
  console.log(`Cache hit rate: ${hitRate.toFixed(1)}%`);
  console.log(`Total insertions: ${m.totalInsertions}`);
  console.log(`Bulk cleanups: ${m.bulkCleanups}`);
}
```

### `resetMetrics(opts?): void`

Resets all performance metrics counters.

```typescript
tastyDebug.resetMetrics();
```

---

### `chunks(opts?): ChunkBreakdown`

Returns a breakdown of styles by chunk type. With style chunking enabled, styles are split into logical chunks (appearance, font, dimension, etc.) for better caching and CSS reuse.

```typescript
const breakdown = tastyDebug.chunks();

console.log(breakdown.totalChunkTypes);  // 6
console.log(breakdown.totalClasses);     // 87

for (const [chunkName, data] of Object.entries(breakdown.byChunk)) {
  console.log(`${chunkName}: ${data.classes.length} classes, ${data.cssSize}B`);
}

// Log a formatted breakdown to the console
tastyDebug.chunks({ log: true });
```

Chunk types: `combined` (non-chunked), `appearance`, `font`, `dimension`, `display`, `layout`, `position`, `misc`, `subcomponents`.

---

### `getGlobalTypeCSS(type, opts?): { css: string; ruleCount: number; size: number }`

Retrieves CSS for a specific global injection type.

```typescript
// CSS injected via injectGlobal()
const global = tastyDebug.getGlobalTypeCSS('global');

// CSS injected via injectRawCSS() / useRawCSS()
const raw = tastyDebug.getGlobalTypeCSS('raw');

// @keyframes CSS
const keyframes = tastyDebug.getGlobalTypeCSS('keyframes');

// @property CSS
const properties = tastyDebug.getGlobalTypeCSS('property');

console.log(`Global: ${global.ruleCount} rules, ${global.size}B`);
console.log(`Raw: ${raw.ruleCount} rules, ${raw.size}B`);
console.log(`Keyframes: ${keyframes.ruleCount} rules, ${keyframes.size}B`);
console.log(`Properties: ${properties.ruleCount} rules, ${properties.size}B`);
```

---

### `defs(opts?): Definitions`

Returns all defined `@property` and `@keyframes` entries.

```typescript
interface Definitions {
  properties: string[];  // Defined via @property (e.g., ['--primary-color', '--gap'])
  keyframes: { name: string; refCount: number }[];
}
```

```typescript
const defs = tastyDebug.defs();

console.log('Properties:', defs.properties);
// ['--primary-color', '--surface-color', ...]

console.log('Keyframes:', defs.keyframes);
// [{ name: 'fadeIn', refCount: 2 }, { name: 'pulse', refCount: 1 }]
```

---

### `summary(opts?): Summary`

One-shot comprehensive overview of the entire Tasty CSS state. Returns detailed statistics and optionally logs a formatted report.

```typescript
interface SummaryOptions {
  root?: Document | ShadowRoot;
  log?: boolean;
  includePageCSS?:
    | false    // Do not include page-level CSS stats (default)
    | true     // Include sizes/counts only
    | 'all';   // Include stats and return full page CSS string
}
```

The returned `Summary` object contains:

- **Classes**: `activeClasses`, `unusedClasses`, `totalStyledClasses`
- **CSS sizes**: `activeCSSSize`, `unusedCSSSize`, `globalCSSSize`, `rawCSSSize`, `keyframesCSSSize`, `propertyCSSSize`, `totalCSSSize`
- **CSS payloads**: `activeCSS`, `unusedCSS`, `globalCSS`, `rawCSS`, `keyframesCSS`, `propertyCSS`, `allCSS`
- **Rule counts**: `globalRuleCount`, `rawRuleCount`, `keyframesRuleCount`, `propertyRuleCount`
- **Page CSS** (when `includePageCSS` is set): `page.cssSize`, `page.ruleCount`, `page.stylesheetCount`, `page.skippedStylesheets`
- **Metrics & definitions**: `metrics`, `definedProperties`, `definedKeyframes`, `propertyCount`, `keyframeCount`
- **Cleanup summary**: `cleanupSummary.totalCleanups`, `cleanupSummary.totalClassesDeleted`, `cleanupSummary.lastCleanup`, etc.
- **Chunk breakdown**: `chunkBreakdown.byChunk`, `chunkBreakdown.totalChunkTypes`

```typescript
// Log a formatted report
tastyDebug.summary({ log: true });

// Get the data programmatically
const s = tastyDebug.summary();
console.log(`Active: ${s.activeClasses.length} classes, ${s.activeCSSSize}B`);
console.log(`Unused: ${s.unusedClasses.length} classes, ${s.unusedCSSSize}B`);
console.log(`Total CSS: ${s.totalCSSSize}B`);

// Include page-level CSS stats
const withPage = tastyDebug.summary({ includePageCSS: true });
console.log(`Page CSS: ${withPage.page?.cssSize}B across ${withPage.page?.stylesheetCount} stylesheets`);
```

---

### `pageCSS(opts?): string`

Returns all CSS on the page across all stylesheets (not only tasty-generated CSS).

```typescript
// Get all page CSS
const css = tastyDebug.pageCSS();

// Log it
tastyDebug.pageCSS({ log: true });

// Raw (unformatted)
tastyDebug.pageCSS({ prettify: false });

// Exclude cross-origin stylesheet placeholders
tastyDebug.pageCSS({ includeCrossOrigin: false });
```

### `pageStats(opts?): PageStats`

Returns size and rule count statistics for all page CSS without extracting the full text.

```typescript
const stats = tastyDebug.pageStats();
console.log(`${stats.cssSize}B across ${stats.stylesheetCount} stylesheets`);
console.log(`${stats.ruleCount} rules, ${stats.skippedStylesheets} skipped (CORS)`);
```

---

### `log(target, opts?): void`

Logs CSS for a target to the console with formatted output, collapsible groups, and sub-element detection.

```typescript
// Log active CSS with stats header
tastyDebug.log('active');

// Log CSS for a specific class
tastyDebug.log('t42');

// Log with custom title
tastyDebug.log('active', { title: 'Button styles' });

// Log CSS for an element
tastyDebug.log('.my-card');
```

The output includes:
- Rule count, line count, and byte size
- Sub-element breakdown (detects `[data-element="..."]` selectors)
- Full CSS in a collapsible group

---

### `help(): void`

Prints a quick-start guide to the console with available commands and common targets.

```typescript
tastyDebug.help();
```

---

### `install(): void`

Attaches `tastyDebug` to `window.tastyDebug` for console access. Called automatically in development mode.

```typescript
import { tastyDebug } from '@tenphi/tasty';

// Manual install (e.g., in staging/production for debugging)
tastyDebug.install();

// Then use from the browser console:
// > tastyDebug.summary({ log: true })
```

---

## Common Workflows

### Debugging a component's styles

```typescript
// 1. Find the element
tastyDebug.inspect('.my-button');
// → { classes: ['t3', 't7'], chunks: [...], css: '...', rules: 4 }

// 2. See CSS for a specific class
tastyDebug.log('t3');

// 3. Check which chunk it belongs to
tastyDebug.inspect('.my-button').chunks;
// → [{ className: 't3', chunkName: 'appearance' }, { className: 't7', chunkName: 'font' }]
```

### Checking cache efficiency

```typescript
const m = tastyDebug.metrics();
const hitRate = m ? ((m.hits + (m.unusedHits || 0)) / (m.hits + m.misses)) * 100 : 0;
console.log(`Hit rate: ${hitRate.toFixed(1)}%`);
console.log(`Unused style reactivations: ${m?.unusedHits}`);
```

### Monitoring CSS growth

```typescript
const s = tastyDebug.summary();
console.log(`Total tasty CSS: ${(s.totalCSSSize / 1024).toFixed(1)}KB`);
console.log(`Active: ${(s.activeCSSSize / 1024).toFixed(1)}KB`);
console.log(`Unused (pending cleanup): ${(s.unusedCSSSize / 1024).toFixed(1)}KB`);

// Compare with total page CSS
const page = tastyDebug.pageStats();
const ratio = ((s.totalCSSSize / page.cssSize) * 100).toFixed(1);
console.log(`Tasty is ${ratio}% of total page CSS`);
```

### Analyzing chunk distribution

```typescript
tastyDebug.chunks({ log: true });
// → Formatted breakdown:
//   • appearance: 24 classes, 3.2KB, 48 rules
//   • font: 18 classes, 1.1KB, 18 rules
//   • dimension: 31 classes, 2.4KB, 45 rules
//   • ...
```

---

## Shadow DOM Support

All methods accept a `root` option to target a Shadow DOM instead of the main document:

```typescript
const shadowRoot = host.shadowRoot;

tastyDebug.css('all', { root: shadowRoot });
tastyDebug.inspect('.shadow-component', { root: shadowRoot });
tastyDebug.summary({ root: shadowRoot, log: true });
tastyDebug.chunks({ root: shadowRoot, log: true });
```

---

## Integration with Tasty

`tastyDebug` reads directly from the [Style Injector](./injector.md)'s internal registries. It does not inject, modify, or intercept any styles. The `cleanup()` method is the only method with side effects — it triggers the injector's garbage collection for unused styles.

For most development, you'll use the [Tasty style system](./usage.md) to create components and the debug utilities to inspect the resulting CSS at runtime.
