# @cube-dev/ui-kit

## 0.104.0

### Minor Changes

- [#972](https://github.com/cube-js/cube-ui-kit/pull/972) [`c703a035`](https://github.com/cube-js/cube-ui-kit/commit/c703a03573a509e79fa995d28e2efde09289f32b) Thanks [@tenphi](https://github.com/tenphi)! - Add `warning` and `note` themes to Button, Item, and ItemAction components. These themes are now available for all standard types (primary, secondary, outline, neutral, clear, link, item) in addition to the existing card type support.

- [#972](https://github.com/cube-js/cube-ui-kit/pull/972) [`c703a035`](https://github.com/cube-js/cube-ui-kit/commit/c703a03573a509e79fa995d28e2efde09289f32b) Thanks [@tenphi](https://github.com/tenphi)! - Add `Tabs.Action` component for prefix/suffix slot actions with automatic dividers and size inheritance from Tabs context

- [#972](https://github.com/cube-js/cube-ui-kit/pull/972) [`c703a035`](https://github.com/cube-js/cube-ui-kit/commit/c703a03573a509e79fa995d28e2efde09289f32b) Thanks [@tenphi](https://github.com/tenphi)! - Add `tabPickerPosition` and `scrollArrowsPosition` props to Tabs component for controlling where the tab picker and scroll arrows are rendered. Both accept `'prefix' | 'suffix'` with `'suffix'` as default.

- [#972](https://github.com/cube-js/cube-ui-kit/pull/972) [`c703a035`](https://github.com/cube-js/cube-ui-kit/commit/c703a03573a509e79fa995d28e2efde09289f32b) Thanks [@tenphi](https://github.com/tenphi)! - Add `showScrollArrows` prop to Tabs component for left/right navigation arrows that scroll overflowed tabs. Supports `true`, `false`, and `'auto'` (show only when overflow exists).

- [#972](https://github.com/cube-js/cube-ui-kit/pull/972) [`c703a035`](https://github.com/cube-js/cube-ui-kit/commit/c703a03573a509e79fa995d28e2efde09289f32b) Thanks [@tenphi](https://github.com/tenphi)! - Remove `panel` tab type and unify its visual style into the `file` type. The `file` type now uses border bottom highlight on selection instead of fill highlight.

## 0.103.0

### Minor Changes

- [#968](https://github.com/cube-js/cube-ui-kit/pull/968) [`b1322fdc`](https://github.com/cube-js/cube-ui-kit/commit/b1322fdcc7ea52ab7552100ef738ff7e2a4e3d04) Thanks [@tenphi](https://github.com/tenphi)! - Added drag-and-drop reordering and inline editing capabilities to Tabs component. Tabs can now be reordered by dragging, and tab titles can be edited inline by double-clicking. Added `showTabPicker` prop to display a dropdown menu for quick tab navigation when tabs overflow. Added `TabType` and `TabSize` type exports. Improved tab indicator positioning and state management. Added disabled state support to Item and ItemButton components.

### Patch Changes

- [#971](https://github.com/cube-js/cube-ui-kit/pull/971) [`08fa1670`](https://github.com/cube-js/cube-ui-kit/commit/08fa167064f5063fd6d379cc2b9d5c643d1696d1) Thanks [@tenphi](https://github.com/tenphi)! - Fixed inset, padding, and margin style handlers to correctly assign values to directions in the order they appear. Previously, `inset: 'right 1x top 0'` would incorrectly map values based on direction position rather than input order. Now values are correctly assigned: first value to first direction, second value to second direction, etc.

## 0.102.0

### Minor Changes

- [#966](https://github.com/cube-js/cube-ui-kit/pull/966) [`3244c5d9`](https://github.com/cube-js/cube-ui-kit/commit/3244c5d958e4f1cbcb5637a205ca5cf64d3a9fa9) Thanks [@tenphi](https://github.com/tenphi)! - Refactor color system to use OKHSL format with unified constants

  ### What's changed:

  - Converted all color tokens from RGB to OKHSL format for perceptually uniform color manipulation
  - Added color constants (`PURPLE_HUE`, `DANGER_HUE`, `MAIN_SATURATION`, etc.) for consistent color values across themes
  - Moved color conversion utilities (`hslToRgb`, `okhslToRgb`) to separate files (`hsl-to-rgb.ts`, `okhsl-to-rgb.ts`)
  - Renamed utility files to kebab-case for consistency (`filter-base-props.ts`, `get-display-name.ts`, etc.)
  - Removed unused color tokens (`#draft`, `#dark-75`, `#pink-02`, `#pink-8`, `#pink-9`)
  - Fixed hardcoded RGB value in `FileTabs` component to use `#border` token

  ### Why:

  OKHSL provides perceptually uniform color space, making it easier to create consistent color variations. Using constants ensures all theme colors maintain consistent saturation and lightness values.

  ### Technical details:

  - All color tokens now use `okhsl()` format
  - Color conversion utilities properly handle OKHSL → RGB conversion for CSS variable generation
  - Internal file organization improved with consistent naming conventions

- [#966](https://github.com/cube-js/cube-ui-kit/pull/966) [`3244c5d9`](https://github.com/cube-js/cube-ui-kit/commit/3244c5d958e4f1cbcb5637a205ca5cf64d3a9fa9) Thanks [@tenphi](https://github.com/tenphi)! - Add warning theme and rename note theme across components

  ### What's changed:

  - Added `warning` theme support to `Badge`, `Tag`, and `Item` components
  - Renamed previous `note` theme to `warning` (yellow/amber) across the codebase
  - Added new `note` theme (violet) for informational content, available for `card` type items
  - Updated component documentation and stories to reflect new themes
  - Updated notification icons to use `warning` theme instead of `note`

  ### Components affected:

  - `Badge`: Added `warning` theme option
  - `Tag`: Added `warning` theme option
  - `Item`: Added `warning.card` and `note.card` theme variants
  - `NotificationIcon`: Changed default/attention from `note` to `warning` colors

  ### Migration:

  - If you were using `theme="note"` on `Badge` or `Tag` components, change to `theme="warning"` for the same yellow/amber appearance
  - For violet informational cards, use `type="card" theme="note"` on `Item` component
  - Notification icons now use warning colors by default (previously note colors)

## 0.101.0

### Minor Changes

- [#964](https://github.com/cube-js/cube-ui-kit/pull/964) [`1a2388be`](https://github.com/cube-js/cube-ui-kit/commit/1a2388be161ab19f55a7290792bc6f6113c2a327) Thanks [@tenphi](https://github.com/tenphi)! - **Breaking:** `ItemAction` now inherits `isDisabled` state from parent `Item` or `ItemButton` via context. When the parent component is disabled, all nested `ItemAction` components are automatically disabled.

  To keep an action enabled when the parent is disabled, explicitly set `isDisabled={false}` on the `ItemAction`:

  ```jsx
  <Item
    isDisabled
    actions={
      <>
        <ItemAction icon={<IconEdit />} tooltip="Disabled with parent" />
        <ItemAction
          icon={<IconTrash />}
          tooltip="Still enabled"
          isDisabled={false}
        />
      </>
    }
  >
    Disabled item with one enabled action
  </Item>
  ```

## 0.100.0

### Minor Changes

- [#960](https://github.com/cube-js/cube-ui-kit/pull/960) [`d89a036e`](https://github.com/cube-js/cube-ui-kit/commit/d89a036e578591fe20f22a21a0c37c41f9c9daf5) Thanks [@tenphi](https://github.com/tenphi)! - Add `@properties` support for defining CSS `@property` at-rules in tasty styles.

  **New features:**

  - Define CSS custom properties with `@properties` in styles using token syntax (`$name`, `#name`)
  - Color tokens (`#name`) auto-set `syntax: '<color>'` and default `initialValue: 'transparent'`
  - Double-prefix syntax (`$name`, `##name`) for referencing property names in transitions and animations
  - `useProperty()` hook and `injector.property()` now accept token syntax
  - Global properties can be configured via `configure({ properties: {...} })`

  **Example:**

  ```jsx
  // Global properties (optional)
  configure({
    properties: {
      $rotation: { syntax: "<angle>", initialValue: "0deg" },
    },
  });

  // Local properties in styles
  const Component = tasty({
    styles: {
      "@properties": {
        $scale: { syntax: "<number>", initialValue: 1 },
        "#accent": { initialValue: "purple" }, // syntax: '<color>' auto-set
      },
      transform: "rotate($rotation) scale($scale)",
      transition: "$rotation 0.3s, $scale 0.2s", // outputs: --rotation 0.3s, --scale 0.2s
    },
  });
  ```

- [#960](https://github.com/cube-js/cube-ui-kit/pull/960) [`d89a036e`](https://github.com/cube-js/cube-ui-kit/commit/d89a036e578591fe20f22a21a0c37c41f9c9daf5) Thanks [@tenphi](https://github.com/tenphi)! - Add color token support to `fade` style property. You can now specify custom transparent and opaque colors for the gradient mask, and use multiple comma-separated groups to apply different colors per direction.

  Add multi-group support to `border` style property. Multiple comma-separated groups allow cascading border definitions where later groups override earlier ones for conflicting directions (e.g., `border="1bw #red, 2bw #blue top"`).

- [#962](https://github.com/cube-js/cube-ui-kit/pull/962) [`09db7bee`](https://github.com/cube-js/cube-ui-kit/commit/09db7bee295e5df4ebe141a3ed9dc68294708ed5) Thanks [@tenphi](https://github.com/tenphi)! - Improve background style handling in Tasty. Add `image` style for background images. The `fill` handler now supports all background CSS properties (`backgroundPosition`, `backgroundSize`, `backgroundRepeat`, `backgroundAttachment`, `backgroundOrigin`, `backgroundClip`). Add `background` and `image` transition semantic names. Deprecate `backgroundColor`, `backgroundImage`, and `background` styles in favor of `fill`, `image`, and separate background properties.

- [#960](https://github.com/cube-js/cube-ui-kit/pull/960) [`d89a036e`](https://github.com/cube-js/cube-ui-kit/commit/d89a036e578591fe20f22a21a0c37c41f9c9daf5) Thanks [@tenphi](https://github.com/tenphi)! - Added `useKeyframes` and `useProperty` React hooks for declarative CSS @keyframes and @property definitions. These hooks follow the same patterns as existing hooks like `useStyles` and `useRawCSS`, using `useInsertionEffect` for proper style injection and cleanup.

- [#963](https://github.com/cube-js/cube-ui-kit/pull/963) [`290cfa6c`](https://github.com/cube-js/cube-ui-kit/commit/290cfa6c9b76544bb658723dc6b7ff0f4d003f75) Thanks [@tenphi](https://github.com/tenphi)! - **Breaking:** Changed `outline` style syntax to use slash separator for offset: `outline: '2px solid #red / 4px'` instead of the previous space-separated format. Also added `outlineOffset` as a direct style prop.

- [#963](https://github.com/cube-js/cube-ui-kit/pull/963) [`290cfa6c`](https://github.com/cube-js/cube-ui-kit/commit/290cfa6c9b76544bb658723dc6b7ff0f4d003f75) Thanks [@tenphi](https://github.com/tenphi)! - Added slash separator support in style parser. Style values can now use `/` surrounded by whitespace to define parts (e.g., `'ellipsis / 3'`, `'2px solid #red / 4px'`). Each part is available via `groups[n].parts` array for style handlers.

- [#960](https://github.com/cube-js/cube-ui-kit/pull/960) [`d89a036e`](https://github.com/cube-js/cube-ui-kit/commit/d89a036e578591fe20f22a21a0c37c41f9c9daf5) Thanks [@tenphi](https://github.com/tenphi)! - Added `Tabs` component for organizing content into multiple panels with full accessibility support via React Aria. The component supports multiple visual styles (default, panel, radio), tab deletion, inline title editing, lazy rendering with content caching, and proper integration with Layout components for stretching panels to fill remaining space.

- [#963](https://github.com/cube-js/cube-ui-kit/pull/963) [`290cfa6c`](https://github.com/cube-js/cube-ui-kit/commit/290cfa6c9b76544bb658723dc6b7ff0f4d003f75) Thanks [@tenphi](https://github.com/tenphi)! - **Breaking:** Enhanced `textOverflow` style handler with automatic setup for text truncation. Previously, `textOverflow: 'ellipsis'` only set `text-overflow: ellipsis` (which doesn't work without `overflow: hidden`). Now it automatically adds `overflow: hidden` and `white-space: nowrap` for single-line ellipsis, making it actually functional.

  New features:

  - `textOverflow: 'ellipsis'` - single-line truncation with ellipsis (now works correctly)
  - `textOverflow: 'ellipsis / 3'` - multi-line truncation (3 lines) with `-webkit-line-clamp`
  - `textOverflow: 'clip'` - single-line clip with `overflow: hidden`

  The `displayStyle` handler now manages `display`, `hide`, `textOverflow`, `overflow`, and `whiteSpace` together. User-provided `overflow` and `whiteSpace` values take precedence over auto-generated ones from `textOverflow`.

- [#958](https://github.com/cube-js/cube-ui-kit/pull/958) [`22e0adc7`](https://github.com/cube-js/cube-ui-kit/commit/22e0adc7e3dadc1a22cb30541934431c52ffe761) Thanks [@tenphi](https://github.com/tenphi)! - ### Added

  - Predefined tokens in `configure()`: Define reusable tokens (`$name` for values, `#name` for colors) that are replaced during style parsing. Unlike component-level `tokens` prop, predefined tokens are baked into the generated CSS for better performance and consistency.

  ```ts
  configure({
    tokens: {
      $spacing: "2x",
      "$card-padding": "4x",
      "#accent": "#purple",
    },
  });

  // Use in styles - tokens are replaced at parse time
  const Card = tasty({
    styles: {
      padding: "$card-padding", // → calc(4 * var(--gap))
      fill: "#accent", // → var(--purple-color)
    },
  });
  ```

  - Plugins can now provide predefined tokens via the `tokens` property in `TastyPlugin`.

### Patch Changes

- [#963](https://github.com/cube-js/cube-ui-kit/pull/963) [`290cfa6c`](https://github.com/cube-js/cube-ui-kit/commit/290cfa6c9b76544bb658723dc6b7ff0f4d003f75) Thanks [@tenphi](https://github.com/tenphi)! - Aligned babel plugin configuration interface with runtime `TastyConfig`. The `TastyZeroConfig` now supports `plugins` and `parserCacheSize` options, and uses the shared `configure()` function internally.

- [#963](https://github.com/cube-js/cube-ui-kit/pull/963) [`290cfa6c`](https://github.com/cube-js/cube-ui-kit/commit/290cfa6c9b76544bb658723dc6b7ff0f4d003f75) Thanks [@tenphi](https://github.com/tenphi)! - Reorganized internal style chunk definitions. Display-related styles (`display`, `hide`, `textOverflow`, `overflow`, `whiteSpace`, `scrollbar`) are now in a DISPLAY chunk. Layout styles (`flow`, `gap`, grid/flex properties) are in a separate LAYOUT chunk.

- [#963](https://github.com/cube-js/cube-ui-kit/pull/963) [`290cfa6c`](https://github.com/cube-js/cube-ui-kit/commit/290cfa6c9b76544bb658723dc6b7ff0f4d003f75) Thanks [@tenphi](https://github.com/tenphi)! - Consolidated style handlers to reduce redundant handler registrations:

  - `widthStyle` now handles `minWidth`, `maxWidth` directly
  - `heightStyle` now handles `minHeight`, `maxHeight` directly
  - `presetStyle` now handles all typography props (`fontSize`, `lineHeight`, `fontWeight`, `letterSpacing`, `textTransform`, `fontStyle`, `fontFamily`, `font`) with or without `preset` defined

  Font props support number values: `fontSize={14}` → `font-size: 14px`, `fontWeight={700}` → `font-weight: 700`.

  The `font` prop has special handling: `font="monospace"` → `var(--monospace-font)`, `font={true}` → `var(--font)`, `font="CustomFont"` → `CustomFont, var(--font)`. The `fontFamily` prop is a direct value without fallback.

- [#959](https://github.com/cube-js/cube-ui-kit/pull/959) [`ed477654`](https://github.com/cube-js/cube-ui-kit/commit/ed4776543ce0cf2f02fd629f149100d7d0a8f9ec) Thanks [@tenphi](https://github.com/tenphi)! - Add custom style handlers API via `configure()` and plugins. Handlers transform style properties into CSS declarations and replace built-in handlers for the same style name. Export `styleHandlers` object for delegating to built-in behavior when extending.

- [#961](https://github.com/cube-js/cube-ui-kit/pull/961) [`46e84833`](https://github.com/cube-js/cube-ui-kit/commit/46e8483379a8260888e00f682831093daaac3813) Thanks [@tenphi](https://github.com/tenphi)! - Fix FilterListBox custom value styles not appearing until hover and leaking to other items after filter is cleared. The issue was caused by ListBox virtualization using index-based keys instead of actual item keys, causing React to incorrectly reuse DOM elements. Added `getItemKey` to the virtualizer to use actual item keys for proper DOM reconciliation.

  Additionally, when `allowsCustomValue` is enabled and there are filtered items visible, the custom value option is now visually separated from the filtered results using a section divider. The visibility check for filtered items now also considers previously-added custom values, ensuring the separator is shown when a search term matches an existing custom item.

- [#963](https://github.com/cube-js/cube-ui-kit/pull/963) [`290cfa6c`](https://github.com/cube-js/cube-ui-kit/commit/290cfa6c9b76544bb658723dc6b7ff0f4d003f75) Thanks [@tenphi](https://github.com/tenphi)! - Refactored `inset` style handler with smart output strategy:

  - When using the `inset` prop or `insetBlock`/`insetInline` props: outputs `inset` CSS shorthand for efficiency
  - When using individual `top`, `right`, `bottom`, `left` props: outputs individual CSS properties to allow proper CSS cascade with modifiers

  This fix resolves an issue where conditional modifiers on individual direction props (e.g., `top: { '': 0, 'side=bottom': 'initial' }`) would incorrectly override all four directions instead of just the specified one.

- [#959](https://github.com/cube-js/cube-ui-kit/pull/959) [`ed477654`](https://github.com/cube-js/cube-ui-kit/commit/ed4776543ce0cf2f02fd629f149100d7d0a8f9ec) Thanks [@tenphi](https://github.com/tenphi)! - Fix ListBox item styles not being applied when passed via `<ListBox.Item styles={...}>`. Item-level styles are now properly merged with parent styles using `mergeStyles`.

- [#949](https://github.com/cube-js/cube-ui-kit/pull/949) [`69c96a34`](https://github.com/cube-js/cube-ui-kit/commit/69c96a34e834b83fbebda6addf4d4e1a71268c5e) Thanks [@tenphi](https://github.com/tenphi)! - ### Added

  - Raw unit calculation: Custom units with raw CSS values (e.g., `8px`) are now calculated directly instead of using `calc()`, producing cleaner CSS output.
  - Recursive unit resolution: Units can reference other custom units with automatic resolution (e.g., `{ x: '8px', y: '2x' }` → `1y` = `16px`).

  ### Removed

  - Units `rp`, `gp`, and `sp` have been removed from default units.

- [#960](https://github.com/cube-js/cube-ui-kit/pull/960) [`d89a036e`](https://github.com/cube-js/cube-ui-kit/commit/d89a036e578591fe20f22a21a0c37c41f9c9daf5) Thanks [@tenphi](https://github.com/tenphi)! - Fixed variant switching causing DOM element recreation. Components with `variants` now preserve their DOM element and state when the `variant` prop changes.

- [#960](https://github.com/cube-js/cube-ui-kit/pull/960) [`d89a036e`](https://github.com/cube-js/cube-ui-kit/commit/d89a036e578591fe20f22a21a0c37c41f9c9daf5) Thanks [@tenphi](https://github.com/tenphi)! - Added `preserveActionsSpace` prop to Item component. When used with `showActionsOnHover={true}`, this prop prevents content shift by keeping the actions area at full width and only changing opacity on hover.

## 0.99.3

### Patch Changes

- [#955](https://github.com/cube-js/cube-ui-kit/pull/955) [`edd8bfc6`](https://github.com/cube-js/cube-ui-kit/commit/edd8bfc6e04cffc77c5e5812224e032187659381) Thanks [@tenphi](https://github.com/tenphi)! - Fix Dialog component to merge incoming style props instead of overwriting them. Update FilterPicker and Picker to correctly access trigger width using `UNSAFE_getDOMNode()` and pass it to Dialog overlay via `--overlay-min-width` CSS custom property. Update Picker overlay width calculation to use `max()` function for better min-width handling.

## 0.99.2

### Patch Changes

- [#952](https://github.com/cube-js/cube-ui-kit/pull/952) [`ff9ad4cc`](https://github.com/cube-js/cube-ui-kit/commit/ff9ad4cc7414a97d04aba0f5997c095460b58798) Thanks [@tenphi](https://github.com/tenphi)! - Fix placeholder color styling by removing filter and updating webkit text fill color

## 0.99.1

### Patch Changes

- [#950](https://github.com/cube-js/cube-ui-kit/pull/950) [`e9f9cd31`](https://github.com/cube-js/cube-ui-kit/commit/e9f9cd31912af88b09a59407a23bc56a2637eef0) Thanks [@tenphi](https://github.com/tenphi)! - Fixed CJS/ESM interop issue with `react-keyed-flatten-children` that caused crashes in Vite development mode when showing toast notifications.

## 0.99.0

### Minor Changes

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Add `svgFill` style to tasty for setting the native CSS `fill` property on SVG elements. Supports the same color token syntax as `fill` (e.g., `#purple.10`, `#danger`). The existing `fill` style continues to output `background-color` for HTML elements.

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Add advanced states support with `@` prefix in tasty styles. State keys starting with `@` compile into CSS at-rules and contextual conditions, enabling media queries (`@media`), container queries (`@(...)`), root states (`@root`), sub-element own states (`@own`), and entry animations (`@starting`). Advanced states can be combined with logical operators (`&`, `|`, `!`, `^`) and used anywhere regular state keys are supported, including sub-elements. Define reusable state aliases globally via `configure({ states })` or locally per component.

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Add tastyStatic for zero runtime integration as well as babel plugin for it.

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Remove `createGlobalStyle` and replace it with a hook `useRawCSS`.

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Add okhsl-plugin to tasty to support OKHSL color space in tasty styles.

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Add `@keyframes` support in tasty styles. Define CSS animations directly within component styles using the `@keyframes` property, or configure global keyframes via `configure({ keyframes })`. Only animations referenced in styles are injected, with automatic deduplication and cleanup. Local keyframes override global ones with the same name.

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Implement style chunking optimization for improved CSS reuse and performance. Styles are now split into logical chunks (appearance, font, dimension, container, scrollbar, position, misc, and subcomponents), each with its own cache key and CSS class. This enables better CSS reuse across components and reduces CSS output size, especially for components with many variants like Button and Item. The optimization is fully backward compatible - elements still receive className(s) as before, but now with improved caching granularity.

  **New exports:**

  - `useStyles` hook - Generate CSS classes for element-scoped styles with chunking support
  - `useGlobalStyles` hook - Inject global styles for a given selector
  - Chunk utilities: `CHUNK_NAMES`, `STYLE_TO_CHUNK`, `categorizeStyleKeys` (for advanced use cases)

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Add `elements` to `tasty()` element definitions to declare compound sub-elements (e.g. `Component.Icon`) with `data-element` binding. Sub-elements support `qa`/`qaVal`, `mods`, `isDisabled`/`isHidden`/`isChecked`, and `tokens`.

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Remove tastyGlobal syntax. Add `useStyles` and `useGlobalStyles` hooks for handy style generation.

### Patch Changes

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Add HSL to RGB conversion support for color token declarations. HSL color tokens (e.g., `'#primary': 'hsl(200 40% 50%)'`) now generate RGB triplets for `--name-color-rgb` variables, enabling opacity syntax support: `#name.3` → `rgb(var(--name-color-rgb) / .3)`.

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Optimize padding and margin style functions to return a single CSS property with optimized values (1, 2, or 4 values) instead of four separate properties, reducing CSS output size.

- [#891](https://github.com/cube-js/cube-ui-kit/pull/891) [`c12660be`](https://github.com/cube-js/cube-ui-kit/commit/c12660be28c78b80bc462fbee4847da229063e94) Thanks [@tenphi](https://github.com/tenphi)! - Improve types of the tasty helper.

## 0.98.9

### Patch Changes

- [#945](https://github.com/cube-js/cube-ui-kit/pull/945) [`07215bcd`](https://github.com/cube-js/cube-ui-kit/commit/07215bcd71aad735b4dda0d2304a627f4f1b17c0) Thanks [@tenphi](https://github.com/tenphi)! - Improve Item component actions container behavior when using `show-actions-on-hover`. Actions now properly collapse width and padding when not hovered, with smooth transitions for better visual feedback.

- [#947](https://github.com/cube-js/cube-ui-kit/pull/947) [`3361360f`](https://github.com/cube-js/cube-ui-kit/commit/3361360f059996e5e1763913cb16cea7cb47ad89) Thanks [@tenphi](https://github.com/tenphi)! - Add SemanticQueryIcon.

## 0.98.8

### Patch Changes

- [#942](https://github.com/cube-js/cube-ui-kit/pull/942) [`f5a5b05c`](https://github.com/cube-js/cube-ui-kit/commit/f5a5b05c669ba3548a68b9b1bcfcd4777f36119d) Thanks [@tenphi](https://github.com/tenphi)! - Fix Dialog focus management to ensure Escape key works reliably when dialog opens and focus properly returns to the trigger when dialog closes. Focus now properly falls back to the first tabbable element or the dialog element itself if no priority focusable element is found. Replaced react-focus-lock with React Aria's FocusScope for better focus restoration behavior.

## 0.98.7

### Patch Changes

- [#940](https://github.com/cube-js/cube-ui-kit/pull/940) [`126a66fe`](https://github.com/cube-js/cube-ui-kit/commit/126a66feb43cb1aebfbeaeeaa27c747665e5b2c4) Thanks [@tenphi](https://github.com/tenphi)! - Fix ListBox icon detection and selection change handler dependencies. Custom icons on ListBox items are now properly detected, and the selection change handler correctly responds to `disableSelectionToggle` prop changes.

## 0.98.6

### Patch Changes

- [#938](https://github.com/cube-js/cube-ui-kit/pull/938) [`71140ba3`](https://github.com/cube-js/cube-ui-kit/commit/71140ba3cc78450eb70bf39e21b01bfe5f59f03b) Thanks [@tenphi](https://github.com/tenphi)! - Fix FieldWrapper tooltip prop to properly support ReactNode values, not just strings. Previously, ReactNode tooltips (like JSX fragments) were incorrectly cast to strings, causing them to fail.

## 0.98.5

### Patch Changes

- [#936](https://github.com/cube-js/cube-ui-kit/pull/936) [`6c6f0a42`](https://github.com/cube-js/cube-ui-kit/commit/6c6f0a422e48d1068930f2e7e436b79cd66268e5) Thanks [@tenphi](https://github.com/tenphi)! - Fix sub-element definition in Result component.

## 0.98.4

### Patch Changes

- [#934](https://github.com/cube-js/cube-ui-kit/pull/934) [`488bda2d`](https://github.com/cube-js/cube-ui-kit/commit/488bda2d798760654ea28a9cc9de35e2a6e16f45) Thanks [@tenphi](https://github.com/tenphi)! - Fix infinite loop in IconSwitch component caused by unnecessary state updates when children prop reference changes. The component now renders current children directly for the active icon instead of storing it in state, preventing render loops while maintaining proper transition behavior.

## 0.98.3

### Patch Changes

- [#932](https://github.com/cube-js/cube-ui-kit/pull/932) [`ec68eae0`](https://github.com/cube-js/cube-ui-kit/commit/ec68eae0c8ac417572d8d013a20e97c2955127fe) Thanks [@tenphi](https://github.com/tenphi)! - Remove root header tag in LayoutPanelHeader.

## 0.98.2

### Patch Changes

- [#930](https://github.com/cube-js/cube-ui-kit/pull/930) [`51ebcf44`](https://github.com/cube-js/cube-ui-kit/commit/51ebcf445f04c1bcc3e4380c3c5dfbba594cf586) Thanks [@tenphi](https://github.com/tenphi)! - Allow description wrapping in items.

- [#930](https://github.com/cube-js/cube-ui-kit/pull/930) [`51ebcf44`](https://github.com/cube-js/cube-ui-kit/commit/51ebcf445f04c1bcc3e4380c3c5dfbba594cf586) Thanks [@tenphi](https://github.com/tenphi)! - Fix paddings for Layout.PanelHeader

- [#930](https://github.com/cube-js/cube-ui-kit/pull/930) [`51ebcf44`](https://github.com/cube-js/cube-ui-kit/commit/51ebcf445f04c1bcc3e4380c3c5dfbba594cf586) Thanks [@tenphi](https://github.com/tenphi)! - Apply header tag to Item title in card type.

## 0.98.1

### Patch Changes

- [#928](https://github.com/cube-js/cube-ui-kit/pull/928) [`45ff2f40`](https://github.com/cube-js/cube-ui-kit/commit/45ff2f40f7e33e2596d8e8b1de606e0b3800a6c3) Thanks [@tenphi](https://github.com/tenphi)! - Add icons: ColumnTotalIcon, RowTotalsIcon, SubtotalsIcon.

## 0.98.0

### Minor Changes

- [#923](https://github.com/cube-js/cube-ui-kit/pull/923) [`cb6340ef`](https://github.com/cube-js/cube-ui-kit/commit/cb6340ef6b8faff274b7ebd52038587e60d72ff1) Thanks [@tenphi](https://github.com/tenphi)! - Rework of Button component to align its implementation and layout with Item and ItemButton components.

- [#924](https://github.com/cube-js/cube-ui-kit/pull/924) [`fd497403`](https://github.com/cube-js/cube-ui-kit/commit/fd4974035a916cc7f6a17b9a3678571c806f04ea) Thanks [@tenphi](https://github.com/tenphi)! - Add `tokens` prop to tasty components for defining CSS custom properties as inline styles. Tokens support design system values (`$name` for regular properties, `#name` for colors with RGB variants) and are merged from component defaults to instance usage. Use `tokens` instead of `style` prop for dynamic CSS custom properties.

- [#924](https://github.com/cube-js/cube-ui-kit/pull/924) [`fd497403`](https://github.com/cube-js/cube-ui-kit/commit/fd4974035a916cc7f6a17b9a3678571c806f04ea) Thanks [@tenphi](https://github.com/tenphi)! - Add dynamic icon support to Button and Item components. The `icon` and `rightIcon` props now support:

  - `true` - renders an empty slot (reserves space but shows nothing)
  - Function `({ loading, selected, ...mods }) => ReactNode | true` - dynamically renders icon based on component modifiers

  Also made `Mods` type generic for better type definitions: `Mods<{ loading?: boolean }>` instead of extending interface.

### Patch Changes

- [#924](https://github.com/cube-js/cube-ui-kit/pull/924) [`fd497403`](https://github.com/cube-js/cube-ui-kit/commit/fd4974035a916cc7f6a17b9a3678571c806f04ea) Thanks [@tenphi](https://github.com/tenphi)! - Enlarge the size of the fullscreen dialog.

- [#924](https://github.com/cube-js/cube-ui-kit/pull/924) [`fd497403`](https://github.com/cube-js/cube-ui-kit/commit/fd4974035a916cc7f6a17b9a3678571c806f04ea) Thanks [@tenphi](https://github.com/tenphi)! - Add IconSwitch component for icon transitions.

- [#924](https://github.com/cube-js/cube-ui-kit/pull/924) [`fd497403`](https://github.com/cube-js/cube-ui-kit/commit/fd4974035a916cc7f6a17b9a3678571c806f04ea) Thanks [@tenphi](https://github.com/tenphi)! - Remove redundant `isButton` prop from Item component.

- [#924](https://github.com/cube-js/cube-ui-kit/pull/924) [`fd497403`](https://github.com/cube-js/cube-ui-kit/commit/fd4974035a916cc7f6a17b9a3678571c806f04ea) Thanks [@tenphi](https://github.com/tenphi)! - Add `tight` modifier to `preset` style for setting line-height to the same value as font-size.

- [#924](https://github.com/cube-js/cube-ui-kit/pull/924) [`fd497403`](https://github.com/cube-js/cube-ui-kit/commit/fd4974035a916cc7f6a17b9a3678571c806f04ea) Thanks [@tenphi](https://github.com/tenphi)! - Add `card` type to Item component.

- [#924](https://github.com/cube-js/cube-ui-kit/pull/924) [`fd497403`](https://github.com/cube-js/cube-ui-kit/commit/fd4974035a916cc7f6a17b9a3678571c806f04ea) Thanks [@tenphi](https://github.com/tenphi)! - Add `preserveContent` prop to DisplayTransition component. When enabled (default: true), the component preserves children content during exit transitions, ensuring smooth animations even when parent components remove content immediately after hiding.

- [#924](https://github.com/cube-js/cube-ui-kit/pull/924) [`fd497403`](https://github.com/cube-js/cube-ui-kit/commit/fd4974035a916cc7f6a17b9a3678571c806f04ea) Thanks [@tenphi](https://github.com/tenphi)! - Add `title` type support to Item component.

- [#924](https://github.com/cube-js/cube-ui-kit/pull/924) [`fd497403`](https://github.com/cube-js/cube-ui-kit/commit/fd4974035a916cc7f6a17b9a3678571c806f04ea) Thanks [@tenphi](https://github.com/tenphi)! - Remove the selected mod in DisclosureTrigger.'

- [#924](https://github.com/cube-js/cube-ui-kit/pull/924) [`fd497403`](https://github.com/cube-js/cube-ui-kit/commit/fd4974035a916cc7f6a17b9a3678571c806f04ea) Thanks [@tenphi](https://github.com/tenphi)! - Fix Layout.PanelHeader props type.

## 0.97.1

### Patch Changes

- [#921](https://github.com/cube-js/cube-ui-kit/pull/921) [`974b8af4`](https://github.com/cube-js/cube-ui-kit/commit/974b8af4a296111719194bd12fce5556fbe1fe5f) Thanks [@tenphi](https://github.com/tenphi)! - Layout sub-components now automatically add bottom borders between elements when the layout has vertical flow. This eliminates the need to manually set borders on individual components to create visual separation.

## 0.97.0

### Minor Changes

- [#917](https://github.com/cube-js/cube-ui-kit/pull/917) [`c64cd31b`](https://github.com/cube-js/cube-ui-kit/commit/c64cd31b30e1aa0fd3ef57c41a0e189a49575473) Thanks [@tenphi](https://github.com/tenphi)! - Added `Layout.Container` and `Layout.Center` sub-components for centered content layouts:

  - `Layout.Container` - Horizontally centered content with constrained width (min 40x, max 120x). Ideal for forms, articles, and focused content.
  - `Layout.Center` - Extends Container with vertical centering and text-align center. Ideal for empty states, loading screens, and hero sections.

  Both components support `innerStyles` prop for customizing the inner container.

- [#917](https://github.com/cube-js/cube-ui-kit/pull/917) [`c64cd31b`](https://github.com/cube-js/cube-ui-kit/commit/c64cd31b30e1aa0fd3ef57c41a0e189a49575473) Thanks [@tenphi](https://github.com/tenphi)! - Add new `mode` prop to `Layout.Panel` with support for `sticky` and `overlay` modes:

  - `sticky` - Panel floats over content without pushing it aside
  - `overlay` - Panel with dismissable backdrop (closes on backdrop click, Escape key, or focus change to main content)

  New props: `mode`, `isDismissable`, `overlayStyles`

### Patch Changes

- [#918](https://github.com/cube-js/cube-ui-kit/pull/918) [`ecdc6ff3`](https://github.com/cube-js/cube-ui-kit/commit/ecdc6ff38620e163629dbe8da00f109e05e96ad6) Thanks [@tenphi](https://github.com/tenphi)! - Add text highlighting support to Item component with `highlight`, `highlightCaseSensitive`, and `highlightStyles` props.

## 0.96.0

### Minor Changes

- [`fe46a7f2`](https://github.com/cube-js/cube-ui-kit/commit/fe46a7f233b599d94ffd124ec14d2a576c000e93) Thanks [@tenphi](https://github.com/tenphi)! - Add new `Layout` component with compound sub-components for building complex application layouts. Includes `Layout.Header`, `Layout.Footer`, `Layout.Content`, `Layout.Toolbar`, `Layout.Pane`, `Layout.Panel`, `Layout.PanelHeader`, `Layout.Block`, `Layout.Flex`, `Layout.Grid`, and standalone `GridLayout`.

## 0.95.0

### Minor Changes

- [#911](https://github.com/cube-js/cube-ui-kit/pull/911) [`33990457`](https://github.com/cube-js/cube-ui-kit/commit/339904570f42e600dc70873793402a8afd914019) Thanks [@tenphi](https://github.com/tenphi)! - Added `TextItem` component for displaying text with automatic overflow handling and tooltips. Features include:

  - Auto-tooltip on text overflow (enabled by default)
  - Text highlighting with `highlight` prop for search results
  - Customizable highlight styles via `highlightStyles` prop
  - Case-sensitive/insensitive highlight matching
  - Inherits all `Text` component props

  Added `Text.Highlight` sub-component for semantic text highlighting (uses `<mark>` element).

  **Breaking:** Removed `Text.Selection` in favor of `Text.Highlight`.

## 0.94.2

### Patch Changes

- [#905](https://github.com/cube-js/cube-ui-kit/pull/905) [`bb390e25`](https://github.com/cube-js/cube-ui-kit/commit/bb390e25d9f6f0a301d6cac3cd76687d0d4eb408) Thanks [@tenphi](https://github.com/tenphi)! - Fix form fields to prevent internal `form` prop from being spread to DOM elements

- [#912](https://github.com/cube-js/cube-ui-kit/pull/912) [`6ef9986e`](https://github.com/cube-js/cube-ui-kit/commit/6ef9986efe69fb3d74c0ff179f605574dd5d64bd) Thanks [@tenphi](https://github.com/tenphi)! - Fixed `styles` prop leaking to inner elements in `TextInput` and `Switch` components

## 0.94.1

### Patch Changes

- [#909](https://github.com/cube-js/cube-ui-kit/pull/909) [`b72ca0dd`](https://github.com/cube-js/cube-ui-kit/commit/b72ca0ddb761295279db67ce88d194a4c0535c80) Thanks [@tenphi](https://github.com/tenphi)! - Fix the focused state styles of text inputs.

## 0.94.0

### Minor Changes

- [#906](https://github.com/cube-js/cube-ui-kit/pull/906) [`9fd69a24`](https://github.com/cube-js/cube-ui-kit/commit/9fd69a2475da8dc16e47d8561033ff687c2ac9dc) Thanks [@tenphi](https://github.com/tenphi)! - Add new `Disclosure` component for expandable/collapsible content sections. Features include:

  - `Disclosure` - Single expandable panel with trigger and content
  - `Disclosure.Trigger` - Built on ItemButton with full support for icons, descriptions, and actions
  - `Disclosure.Content` - Collapsible content area with smooth height animations
  - `Disclosure.Group` - Accordion container for multiple disclosures with single or multiple expanded support
  - `Disclosure.Item` - Individual item within a group

  Supports controlled/uncontrolled state, `shape` variants (`default`, `card`, `sharp`), disabled state, custom transition duration, and render prop API for custom triggers.

### Patch Changes

- [#908](https://github.com/cube-js/cube-ui-kit/pull/908) [`21d8a310`](https://github.com/cube-js/cube-ui-kit/commit/21d8a310765f121fb9257a55a71e15c87a7b0ae0) Thanks [@tenphi](https://github.com/tenphi)! - Fix content visibility in Disclosure.

## 0.93.1

### Patch Changes

- [#903](https://github.com/cube-js/cube-ui-kit/pull/903) [`e0214842`](https://github.com/cube-js/cube-ui-kit/commit/e0214842a343911fe36c57d0aae73e5f90b36b1c) Thanks [@tenphi](https://github.com/tenphi)! - Add `fixed` modifier to `height` and `width` styles. Use `fixed 10x` to set min, base, and max dimensions to the same value, creating a truly fixed size that cannot flex.

## 0.93.0

### Minor Changes

- [#901](https://github.com/cube-js/cube-ui-kit/pull/901) [`1d980997`](https://github.com/cube-js/cube-ui-kit/commit/1d980997b663287f976d6070cbc63b1623b5a76d) Thanks [@tenphi](https://github.com/tenphi)! - Added unified support for `fieldProps`, `fieldStyles`, `labelProps`, and `labelStyles` across all field components. The `fieldStyles` and `labelStyles` props serve as shorthands for `fieldProps.styles` and `labelProps.styles` respectively, with shorthand props taking priority. All merging logic is centralized in the `wrapWithField` helper.

  **Breaking changes:**

  - Removed `wrapperStyles` prop from TextInputBase and Select components (use `styles` prop instead for the root element).

### Patch Changes

- [#901](https://github.com/cube-js/cube-ui-kit/pull/901) [`1d980997`](https://github.com/cube-js/cube-ui-kit/commit/1d980997b663287f976d6070cbc63b1623b5a76d) Thanks [@tenphi](https://github.com/tenphi)! - Added `onOpenChange` callback prop to Picker, FilterPicker, ComboBox, and Select components. This callback is invoked when the popover/overlay open state changes, receiving a boolean parameter indicating the new open state.

## 0.92.4

### Patch Changes

- [#899](https://github.com/cube-js/cube-ui-kit/pull/899) [`122bc1b1`](https://github.com/cube-js/cube-ui-kit/commit/122bc1b18a7ca70405734d84f8539a70af65c1ea) Thanks [@tenphi](https://github.com/tenphi)! - Fixed `id` and ARIA attributes duplication where they were incorrectly applied to both the field wrapper and the input element. The `id` prop is now correctly applied only to the element with `qa` and `data-input-type` attributes. The fix was implemented in the `wrapWithField` helper to automatically filter out `id` from `fieldProps` passed to the Field wrapper.

## 0.92.3

### Patch Changes

- [#897](https://github.com/cube-js/cube-ui-kit/pull/897) [`01567fce`](https://github.com/cube-js/cube-ui-kit/commit/01567fceeabd38e619b4bbbe221bbc285a133928) Thanks [@tenphi](https://github.com/tenphi)! - Add isDisabled state to FileInput and fix qa props.

- [#897](https://github.com/cube-js/cube-ui-kit/pull/897) [`01567fce`](https://github.com/cube-js/cube-ui-kit/commit/01567fceeabd38e619b4bbbe221bbc285a133928) Thanks [@tenphi](https://github.com/tenphi)! - Fix qa prop in Select component.

## 0.92.2

### Patch Changes

- [#895](https://github.com/cube-js/cube-ui-kit/pull/895) [`d48e94a5`](https://github.com/cube-js/cube-ui-kit/commit/d48e94a534f963af3f49926bae53e1f2c183bd49) Thanks [@tenphi](https://github.com/tenphi)! - Fix `labelProps` being overridden in input and field components. User-provided `labelProps` are now properly merged with aria-generated label properties in TextInput, NumberInput, PasswordInput, TextArea, SearchInput, Slider, RangeSlider, and TimeInput components, allowing customization like `labelProps={{ size: 'small' }}`.

## 0.92.1

### Patch Changes

- [#893](https://github.com/cube-js/cube-ui-kit/pull/893) [`1ec20458`](https://github.com/cube-js/cube-ui-kit/commit/1ec20458cf0b1448a3bfae3d9541d7c507f4bba3) Thanks [@tenphi](https://github.com/tenphi)! - Fix `labelProps` being overridden in input and field components. User-provided `labelProps` are now properly merged with aria-generated label properties in TextInput, NumberInput, PasswordInput, TextArea, SearchInput, Slider, RangeSlider, and TimeInput components, allowing customization like `labelProps={{ size: 'small' }}`.

## 0.92.0

### Minor Changes

- [#890](https://github.com/cube-js/cube-ui-kit/pull/890) [`b79f55c6`](https://github.com/cube-js/cube-ui-kit/commit/b79f55c67159ecbbd9a04e69fcafe166c649e5d0) Thanks [@tenphi](https://github.com/tenphi)! - Added color token fallback syntax `(#color, #fallback)` for robust color hierarchies. Supports nested fallbacks like `(#primary, (#secondary, #default))`. Automatically generates RGB variants for the entire fallback chain, ensuring proper color variable resolution at runtime.

- [#890](https://github.com/cube-js/cube-ui-kit/pull/890) [`b79f55c6`](https://github.com/cube-js/cube-ui-kit/commit/b79f55c67159ecbbd9a04e69fcafe166c649e5d0) Thanks [@tenphi](https://github.com/tenphi)! - Add `isButton` prop support to `Picker`, `FilterPicker`, and `Select` components. The prop is now properly passed to their trigger components (`ItemButton` for Picker/FilterPicker, `Item` for Select), allowing control over button styling. Defaults to `false` to maintain existing behavior.

- [#890](https://github.com/cube-js/cube-ui-kit/pull/890) [`b79f55c6`](https://github.com/cube-js/cube-ui-kit/commit/b79f55c67159ecbbd9a04e69fcafe166c649e5d0) Thanks [@tenphi](https://github.com/tenphi)! - Removed legacy `@` prefix support for custom properties. Use `# @cube-dev/ui-kit prefix instead (e.g., `$custom-color`instead of`@custom-color`).

- [#890](https://github.com/cube-js/cube-ui-kit/pull/890) [`b79f55c6`](https://github.com/cube-js/cube-ui-kit/commit/b79f55c67159ecbbd9a04e69fcafe166c649e5d0) Thanks [@tenphi](https://github.com/tenphi)! - Specify `data-input-type` attribute for each field component and improve `qa` prop handling in various field components for consistency.

### Patch Changes

- [#890](https://github.com/cube-js/cube-ui-kit/pull/890) [`b79f55c6`](https://github.com/cube-js/cube-ui-kit/commit/b79f55c67159ecbbd9a04e69fcafe166c649e5d0) Thanks [@tenphi](https://github.com/tenphi)! - Improved overlay width behavior for Picker and FilterPicker components to match their trigger button width, ensuring better visual consistency.

- [#890](https://github.com/cube-js/cube-ui-kit/pull/890) [`b79f55c6`](https://github.com/cube-js/cube-ui-kit/commit/b79f55c67159ecbbd9a04e69fcafe166c649e5d0) Thanks [@tenphi](https://github.com/tenphi)! - Decrease containerPadding of all overlays 12px -> 8px.

## 0.91.0

### Minor Changes

- [#888](https://github.com/cube-js/cube-ui-kit/pull/888) [`fba935a3`](https://github.com/cube-js/cube-ui-kit/commit/fba935a383dec79876e1b7d5c7e665a161929839) Thanks [@tenphi](https://github.com/tenphi)! - Remove isRequired prop in Form component.

### Patch Changes

- [#888](https://github.com/cube-js/cube-ui-kit/pull/888) [`fba935a3`](https://github.com/cube-js/cube-ui-kit/commit/fba935a383dec79876e1b7d5c7e665a161929839) Thanks [@tenphi](https://github.com/tenphi)! - Fix required validator to check rule.required flag before validating.

- [#888](https://github.com/cube-js/cube-ui-kit/pull/888) [`fba935a3`](https://github.com/cube-js/cube-ui-kit/commit/fba935a383dec79876e1b7d5c7e665a161929839) Thanks [@tenphi](https://github.com/tenphi)! - Improve rule management in form fields.

## 0.90.3

### Patch Changes

- [#886](https://github.com/cube-js/cube-ui-kit/pull/886) [`15daa007`](https://github.com/cube-js/cube-ui-kit/commit/15daa007241565ba554c3776a115d5e853f6856d) Thanks [@tenphi](https://github.com/tenphi)! - Fix ComboBox auto-focus behavior when using `allowsCustomValue`. The component now correctly maintains focus on the first filtered item while typing, allowing Enter key selection to work properly. The focus is automatically re-established when the currently focused item is filtered out of the list. Additionally, the refocus logic now properly verifies that the selected item exists in the filtered collection before attempting to focus on it, preventing focus on non-existent keys.

## 0.90.2

### Patch Changes

- [#884](https://github.com/cube-js/cube-ui-kit/pull/884) [`24a372e9`](https://github.com/cube-js/cube-ui-kit/commit/24a372e9e880624d2ae3f39cdcad8894fd4d7291) Thanks [@tenphi](https://github.com/tenphi)! - Fix ComboBox with `allowsCustomValue` to allow form submission with single Enter press when typing custom values that don't match any items.

## 0.90.1

### Patch Changes

- [#882](https://github.com/cube-js/cube-ui-kit/pull/882) [`568f44a2`](https://github.com/cube-js/cube-ui-kit/commit/568f44a23dd2b152702006dae5316ba3950513be) Thanks [@tenphi](https://github.com/tenphi)! - Fix leakage of `description` prop to the trigger in Select. Add `triggerDescription` prop.

## 0.90.0

### Minor Changes

- [#880](https://github.com/cube-js/cube-ui-kit/pull/880) [`e5884d46`](https://github.com/cube-js/cube-ui-kit/commit/e5884d4671e2bbb818d55a47e48a1ba671a9abfa) Thanks [@tenphi](https://github.com/tenphi)! - Add `showActionsOnHover` prop to Item component. When enabled, actions are hidden by default and revealed smoothly on hover, focus, or focus-within states using opacity transitions. This provides a cleaner interface while keeping actions easily accessible without content shifting.

### Patch Changes

- [#880](https://github.com/cube-js/cube-ui-kit/pull/880) [`e5884d46`](https://github.com/cube-js/cube-ui-kit/commit/e5884d4671e2bbb818d55a47e48a1ba671a9abfa) Thanks [@tenphi](https://github.com/tenphi)! - Allow text wrapping in labels.

- [#880](https://github.com/cube-js/cube-ui-kit/pull/880) [`e5884d46`](https://github.com/cube-js/cube-ui-kit/commit/e5884d4671e2bbb818d55a47e48a1ba671a9abfa) Thanks [@tenphi](https://github.com/tenphi)! - Fix FilterPicker `renderSummary` to be evaluated regardless of selection state. The custom summary renderer and `renderSummary={false}` now work correctly even when no items are selected, providing consistent control over trigger content display.

- [#880](https://github.com/cube-js/cube-ui-kit/pull/880) [`e5884d46`](https://github.com/cube-js/cube-ui-kit/commit/e5884d4671e2bbb818d55a47e48a1ba671a9abfa) Thanks [@tenphi](https://github.com/tenphi)! - Add `Text.Placeholder` variant with disabled opacity styling. This new text variant is useful for displaying placeholder content with reduced visual emphasis.

## 0.89.2

### Patch Changes

- [#878](https://github.com/cube-js/cube-ui-kit/pull/878) [`8d17104e`](https://github.com/cube-js/cube-ui-kit/commit/8d17104e18f6c6789bf4f2f7a83b810173a77f3b) Thanks [@tenphi](https://github.com/tenphi)! - Set `neutral` as the default type for ItemButton.

## 0.89.1

### Patch Changes

- [#877](https://github.com/cube-js/cube-ui-kit/pull/877) [`cec3339c`](https://github.com/cube-js/cube-ui-kit/commit/cec3339ca78ddf458325b2edae3ed36d4ba0f136) Thanks [@tenphi](https://github.com/tenphi)! - Add `shape` prop to Alert component. The shape prop accepts 'card' (default, 1cr radius with border) or 'sharp' (no border radius or border) values to control border styling.

- [#875](https://github.com/cube-js/cube-ui-kit/pull/875) [`f1bc522d`](https://github.com/cube-js/cube-ui-kit/commit/f1bc522dc9dacc90dccc83a2a415436f566a78ad) Thanks [@tenphi](https://github.com/tenphi)! - Add `inherit` type to HotKeys component. The inherit type uses `currentColor` for both text and border, allowing the component to adapt to its parent's color context with a transparent background.

## 0.89.0

### Minor Changes

- [#872](https://github.com/cube-js/cube-ui-kit/pull/872) [`4b8a6d6e`](https://github.com/cube-js/cube-ui-kit/commit/4b8a6d6e4342303ec6ba6c58a2c17b38eeef2964) Thanks [@tenphi](https://github.com/tenphi)! - **BREAKING:** Boolean mods now generate `data-*` instead of `data-is-*` attributes (`mods={{ hovered: true }}` → `data-hovered=""` instead of `data-is-hovered=""`).

  **NEW:** Value mods support - `mods` now accepts string values (`mods={{ theme: 'danger' }}` → `data-theme="danger"`). Includes shorthand syntax in styles (`theme=danger`, `theme="danger"`). See Tasty documentation for details.

- [#872](https://github.com/cube-js/cube-ui-kit/pull/872) [`4b8a6d6e`](https://github.com/cube-js/cube-ui-kit/commit/4b8a6d6e4342303ec6ba6c58a2c17b38eeef2964) Thanks [@tenphi](https://github.com/tenphi)! - Add support for `:has(Item)` syntax in style mappings. Capitalized element names inside `:has()` pseudo-class selectors are now automatically transformed to `data-element` attribute selectors (`:has(Item)` → `:has([data-element="Item"])`).

- [#873](https://github.com/cube-js/cube-ui-kit/pull/873) [`c29bee57`](https://github.com/cube-js/cube-ui-kit/commit/c29bee5708e4aa75e75e80ffb3509de5a6ac9d13) Thanks [@tenphi](https://github.com/tenphi)! - Allow to set cursorStrategy to `web` or `native` in Root component.

## 0.88.0

### Minor Changes

- [`b817bcbc`](https://github.com/cube-js/cube-ui-kit/commit/b817bcbce9a962dfeb579a40020620ea11ab96bf) Thanks [@tenphi](https://github.com/tenphi)! - Rename ClearIcon -> TrashIcon. Add a new ClearIcon.

- [`bc28fc33`](https://github.com/cube-js/cube-ui-kit/commit/bc28fc3387d607733fa98f9d802ff2f31826e2f4) Thanks [@tenphi](https://github.com/tenphi)! - Rename `type` prop in ListBox to `shape`.

### Patch Changes

- [`bc28fc33`](https://github.com/cube-js/cube-ui-kit/commit/bc28fc3387d607733fa98f9d802ff2f31826e2f4) Thanks [@tenphi](https://github.com/tenphi)! - Add `shape` prop to Item component with three values: `card`, `button` (default), and `sharp` to control border radius styling.

## 0.87.6

### Patch Changes

- [#868](https://github.com/cube-js/cube-ui-kit/pull/868) [`7327f98d`](https://github.com/cube-js/cube-ui-kit/commit/7327f98d1a14ccf6cd83d4cfc1ff89254d1aeec8) Thanks [@tenphi](https://github.com/tenphi)! - Add `size` prop for Label with `small` and `medium` (default) values.

## 0.87.5

### Patch Changes

- [#866](https://github.com/cube-js/cube-ui-kit/pull/866) [`2c077631`](https://github.com/cube-js/cube-ui-kit/commit/2c077631940b2a07438069ff3f15fb08212aca6a) Thanks [@tenphi](https://github.com/tenphi)! - Fix Tag label alignment.

## 0.87.4

### Patch Changes

- [#864](https://github.com/cube-js/cube-ui-kit/pull/864) [`7d59ddd8`](https://github.com/cube-js/cube-ui-kit/commit/7d59ddd8f617eae6ef63e473a761906c792bf23e) Thanks [@tenphi](https://github.com/tenphi)! - Replace `noCard` prop with `type` prop in ListBox component. The new `type` prop accepts three values:

  - `card` (default): Standard card styling with border and margin
  - `plain`: No border, no margin, no radius - suitable for embedded use
  - `popover`: No border, but keeps margin and radius - suitable for overlay use

- [#864](https://github.com/cube-js/cube-ui-kit/pull/864) [`7d59ddd8`](https://github.com/cube-js/cube-ui-kit/commit/7d59ddd8f617eae6ef63e473a761906c792bf23e) Thanks [@tenphi](https://github.com/tenphi)! - Remove the hardcoded default width for NumberInput.

- [#864](https://github.com/cube-js/cube-ui-kit/pull/864) [`7d59ddd8`](https://github.com/cube-js/cube-ui-kit/commit/7d59ddd8f617eae6ef63e473a761906c792bf23e) Thanks [@tenphi](https://github.com/tenphi)! - Fix right padding in NumberInput.

## 0.87.3

### Patch Changes

- [#862](https://github.com/cube-js/cube-ui-kit/pull/862) [`3f3a12dc`](https://github.com/cube-js/cube-ui-kit/commit/3f3a12dc3a6af52172aba199e085d7fee1035192) Thanks [@tenphi](https://github.com/tenphi)! - Change the default Label preset to `t3m`.

- [#862](https://github.com/cube-js/cube-ui-kit/pull/862) [`3f3a12dc`](https://github.com/cube-js/cube-ui-kit/commit/3f3a12dc3a6af52172aba199e085d7fee1035192) Thanks [@tenphi](https://github.com/tenphi)! - Fix font weight for Item and Item Button.

- [#862](https://github.com/cube-js/cube-ui-kit/pull/862) [`3f3a12dc`](https://github.com/cube-js/cube-ui-kit/commit/3f3a12dc3a6af52172aba199e085d7fee1035192) Thanks [@tenphi](https://github.com/tenphi)! - Use right text alignment in NumberInput component.

## 0.87.2

### Patch Changes

- [#860](https://github.com/cube-js/cube-ui-kit/pull/860) [`81235aef`](https://github.com/cube-js/cube-ui-kit/commit/81235aefee01497c12e13db3a53a516ca78abaa3) Thanks [@tenphi](https://github.com/tenphi)! - Fix alignment in label position `split`.

## 0.87.1

### Patch Changes

- [#858](https://github.com/cube-js/cube-ui-kit/pull/858) [`b27ab4b4`](https://github.com/cube-js/cube-ui-kit/commit/b27ab4b4a16aff15c579874d590cc5275a078fc6) Thanks [@tenphi](https://github.com/tenphi)! - Enhanced selector affix syntax (`# @cube-dev/ui-kit) for sub-element styling in tasty. Capitalized words in the affix are now automatically transformed to sub-element selectors, allowing complex selector chains like `$: '> Body > Row >'`which generates`.table > [data-element="Body"] > [data-element="Row"] > [data-element="Cell"]`.

- [#857](https://github.com/cube-js/cube-ui-kit/pull/857) [`f6db220c`](https://github.com/cube-js/cube-ui-kit/commit/f6db220c01865273078e17617fa8f31976cf2d8a) Thanks [@tenphi](https://github.com/tenphi)! - Introduces a new render helper component `<RenderCache/>`. Now you can optimize rendering of intensive items like IDE tabs.

## 0.87.0

### Minor Changes

- [#854](https://github.com/cube-js/cube-ui-kit/pull/854) [`9e502b78`](https://github.com/cube-js/cube-ui-kit/commit/9e502b788335c2d7acce6685b71166a760258ad2) Thanks [@tenphi](https://github.com/tenphi)! - Add `split` value for `labelPosition` in all field components.

### Patch Changes

- [#855](https://github.com/cube-js/cube-ui-kit/pull/855) [`18fe5cda`](https://github.com/cube-js/cube-ui-kit/commit/18fe5cda0579ca041fbded397a65bf28f8a9a138) Thanks [@tenphi](https://github.com/tenphi)! - Allow flex shrinking for Item.

- [#850](https://github.com/cube-js/cube-ui-kit/pull/850) [`e0947b58`](https://github.com/cube-js/cube-ui-kit/commit/e0947b58f9bbacd0341b7c54a0dc840a59808017) Thanks [@tenphi](https://github.com/tenphi)! - Reverse the order of buttons in dialogs.

## 0.86.0

### Minor Changes

- [#847](https://github.com/cube-js/cube-ui-kit/pull/847) [`c1445d56`](https://github.com/cube-js/cube-ui-kit/commit/c1445d560ed1e04305032669341fb7b051df0d73) Thanks [@tenphi](https://github.com/tenphi)! - New Tag component based on Item component.

- [#847](https://github.com/cube-js/cube-ui-kit/pull/847) [`c1445d56`](https://github.com/cube-js/cube-ui-kit/commit/c1445d560ed1e04305032669341fb7b051df0d73) Thanks [@tenphi](https://github.com/tenphi)! - Rename ItemBase -> Item. Item -> CollectionItem. Be careful.

### Patch Changes

- [#847](https://github.com/cube-js/cube-ui-kit/pull/847) [`c1445d56`](https://github.com/cube-js/cube-ui-kit/commit/c1445d560ed1e04305032669341fb7b051df0d73) Thanks [@tenphi](https://github.com/tenphi)! - New Badge component based on Item component.

- [#847](https://github.com/cube-js/cube-ui-kit/pull/847) [`c1445d56`](https://github.com/cube-js/cube-ui-kit/commit/c1445d560ed1e04305032669341fb7b051df0d73) Thanks [@tenphi](https://github.com/tenphi)! - Fix auto-scroll in ListBox with sections.

- [#847](https://github.com/cube-js/cube-ui-kit/pull/847) [`c1445d56`](https://github.com/cube-js/cube-ui-kit/commit/c1445d560ed1e04305032669341fb7b051df0d73) Thanks [@tenphi](https://github.com/tenphi)! - A new property for sub-element styles `# @cube-dev/ui-kit. Set `$: '>'` for sub-elements styles so they will only apply to the direct child of the root element.

## 0.85.2

### Patch Changes

- [#851](https://github.com/cube-js/cube-ui-kit/pull/851) [`a2b237ee`](https://github.com/cube-js/cube-ui-kit/commit/a2b237ee687bfab2462ab6ed7ff5fe56ceb7599f) Thanks [@tenphi](https://github.com/tenphi)! - Fix FilterListBox filtering bug.

## 0.85.1

### Patch Changes

- [#844](https://github.com/cube-js/cube-ui-kit/pull/844) [`1c2b44f2`](https://github.com/cube-js/cube-ui-kit/commit/1c2b44f2e4a3c10d8b50c3a5fcd8e602d52501d8) Thanks [@tenphi](https://github.com/tenphi)! - Disable autocomplete in ComboBox be default.

- [#848](https://github.com/cube-js/cube-ui-kit/pull/848) [`677f06cb`](https://github.com/cube-js/cube-ui-kit/commit/677f06cb00ecb01c575570cf4ad93cca7c5e8aba) Thanks [@tenphi](https://github.com/tenphi)! - Fix position of ComboBox and Select popovers.

- [#845](https://github.com/cube-js/cube-ui-kit/pull/845) [`a5fa4e6a`](https://github.com/cube-js/cube-ui-kit/commit/a5fa4e6aab277011528bf08e19baffcab611e55b) Thanks [@tenphi](https://github.com/tenphi)! - Optimize FilterListBox filtering logic.

## 0.85.0

### Minor Changes

- [#842](https://github.com/cube-js/cube-ui-kit/pull/842) [`2ad48fe7`](https://github.com/cube-js/cube-ui-kit/commit/2ad48fe7a2e2624c067c9f0f1ac8500d3eb5ce0a) Thanks [@tenphi](https://github.com/tenphi)! - Allow to add actions to Item, ItemButton, and ItemBase.

- [#842](https://github.com/cube-js/cube-ui-kit/pull/842) [`2ad48fe7`](https://github.com/cube-js/cube-ui-kit/commit/2ad48fe7a2e2624c067c9f0f1ac8500d3eb5ce0a) Thanks [@tenphi](https://github.com/tenphi)! - Add ItemBadge component.

### Patch Changes

- [#842](https://github.com/cube-js/cube-ui-kit/pull/842) [`2ad48fe7`](https://github.com/cube-js/cube-ui-kit/commit/2ad48fe7a2e2624c067c9f0f1ac8500d3eb5ce0a) Thanks [@tenphi](https://github.com/tenphi)! - Add isCard flag to ItemBase component.

- [#842](https://github.com/cube-js/cube-ui-kit/pull/842) [`2ad48fe7`](https://github.com/cube-js/cube-ui-kit/commit/2ad48fe7a2e2624c067c9f0f1ac8500d3eb5ce0a) Thanks [@tenphi](https://github.com/tenphi)! - Fix popover height limit for Select and ComboBox.

## 0.84.0

### Minor Changes

- [#817](https://github.com/cube-js/cube-ui-kit/pull/817) [`bb56ca5a`](https://github.com/cube-js/cube-ui-kit/commit/bb56ca5a8a4b08379685a7d32a797ea65019c12d) Thanks [@tenphi](https://github.com/tenphi)! - Add Picker component as a more advanced version of Select.

## 0.83.3

### Patch Changes

- [#838](https://github.com/cube-js/cube-ui-kit/pull/838) [`17518277`](https://github.com/cube-js/cube-ui-kit/commit/17518277e6bda8b495c0e74b884f6c97096760e3) Thanks [@tenphi](https://github.com/tenphi)! - Add ProgressBarIcon.

- [#840](https://github.com/cube-js/cube-ui-kit/pull/840) [`5fb963f0`](https://github.com/cube-js/cube-ui-kit/commit/5fb963f040f1c1ec59bd63c6918cb5f6f6b7a210) Thanks [@tenphi](https://github.com/tenphi)! - Fix RadioGroup base layout.

## 0.83.2

### Patch Changes

- [#835](https://github.com/cube-js/cube-ui-kit/pull/835) [`97925cab`](https://github.com/cube-js/cube-ui-kit/commit/97925cabf6babdfc546436cb59d24967a826fb74) Thanks [@tenphi](https://github.com/tenphi)! - Fix qa prop in Radio component.

- [#837](https://github.com/cube-js/cube-ui-kit/pull/837) [`f80593b8`](https://github.com/cube-js/cube-ui-kit/commit/f80593b89bba6c638d8cfd795e9ad5b02609e75a) Thanks [@tenphi](https://github.com/tenphi)! - Fix qa prop on TextInputBase.

## 0.83.1

### Patch Changes

- [#832](https://github.com/cube-js/cube-ui-kit/pull/832) [`50cf8a77`](https://github.com/cube-js/cube-ui-kit/commit/50cf8a77c6ce34d8d8be011a3fd9c897e80ef9c5) Thanks [@tenphi](https://github.com/tenphi)! - Fix qa prop binding in ComboBox.

- [#831](https://github.com/cube-js/cube-ui-kit/pull/831) [`9995e8a5`](https://github.com/cube-js/cube-ui-kit/commit/9995e8a5ed4a31166d40e46f7e5e1d6f12d940f8) Thanks [@tenphi](https://github.com/tenphi)! - Fix popover transitions in ComboBox and Select. Fix transitions in Tooltip.

## 0.83.0

### Minor Changes

- [#827](https://github.com/cube-js/cube-ui-kit/pull/827) [`7153c8f2`](https://github.com/cube-js/cube-ui-kit/commit/7153c8f26fc955ed7d78dbe6f53b623f45f6c430) Thanks [@tenphi](https://github.com/tenphi)! - Introduces a brand new Radio.Tabs component as a replacement for RadioGroup with isSolid flag.

## 0.82.2

### Patch Changes

- [#828](https://github.com/cube-js/cube-ui-kit/pull/828) [`f3a39bba`](https://github.com/cube-js/cube-ui-kit/commit/f3a39bba8129b355d149493b927972a12609aa1a) Thanks [@tenphi](https://github.com/tenphi)! - Improve prop handling in ComboBox.Item

## 0.82.1

### Patch Changes

- [#824](https://github.com/cube-js/cube-ui-kit/pull/824) [`e88acca3`](https://github.com/cube-js/cube-ui-kit/commit/e88acca3b7dc34a2a9f6574429766212c2644147) Thanks [@tenphi](https://github.com/tenphi)! - Generate id even for input components that are not connected to a form.

- [#824](https://github.com/cube-js/cube-ui-kit/pull/824) [`e88acca3`](https://github.com/cube-js/cube-ui-kit/commit/e88acca3b7dc34a2a9f6574429766212c2644147) Thanks [@tenphi](https://github.com/tenphi)! - Prevent form prop from leaking to the DOM.

## 0.82.0

### Minor Changes

- [#823](https://github.com/cube-js/cube-ui-kit/pull/823) [`91e81ac3`](https://github.com/cube-js/cube-ui-kit/commit/91e81ac3e78998f458b3bca140bfbd8c28824f97) Thanks [@tenphi](https://github.com/tenphi)! - Add a brand new ComboBox component with virtualization and user/developer-friendly behavior.

### Patch Changes

- [#818](https://github.com/cube-js/cube-ui-kit/pull/818) [`465e4ebc`](https://github.com/cube-js/cube-ui-kit/commit/465e4ebc303c230a9bb31542f77fcf75d1acb6a8) Thanks [@tenphi](https://github.com/tenphi)! - Add DisplayTransition helper component.

- [#818](https://github.com/cube-js/cube-ui-kit/pull/818) [`465e4ebc`](https://github.com/cube-js/cube-ui-kit/commit/465e4ebc303c230a9bb31542f77fcf75d1acb6a8) Thanks [@tenphi](https://github.com/tenphi)! - Fix Tooltip position and transition.

## 0.81.0

### Minor Changes

- [#820](https://github.com/cube-js/cube-ui-kit/pull/820) [`bcc9783e`](https://github.com/cube-js/cube-ui-kit/commit/bcc9783e284b209c053b15673990ce2c633178ac) Thanks [@tenphi](https://github.com/tenphi)! - New Switch sizes: `small` -> `medium` (and now default). new `small` size.

## 0.80.2

### Patch Changes

- [#774](https://github.com/cube-js/cube-ui-kit/pull/774) [`3f8c4b7f`](https://github.com/cube-js/cube-ui-kit/commit/3f8c4b7f40b1869abe694135803e7b784e1c51c2) Thanks [@tenphi](https://github.com/tenphi)! - Improve style state application for padding and margin styles making it predictable.

- [#819](https://github.com/cube-js/cube-ui-kit/pull/819) [`852e73f0`](https://github.com/cube-js/cube-ui-kit/commit/852e73f006ef57c5d52ddbbc420f35e16989aaa5) Thanks [@tenphi](https://github.com/tenphi)! - Add CubePauseIcon and CubePlayIcon.

- [#816](https://github.com/cube-js/cube-ui-kit/pull/816) [`13fb4505`](https://github.com/cube-js/cube-ui-kit/commit/13fb4505adcae3f905b6b6a1c21de9fd291886fc) Thanks [@tenphi](https://github.com/tenphi)! - Support controllable filtering in FilterListBox and FilterPicker.

## 0.80.1

### Patch Changes

- [#812](https://github.com/cube-js/cube-ui-kit/pull/812) [`4c673561`](https://github.com/cube-js/cube-ui-kit/commit/4c6735617a7ac754c0b3e4b0c7871c759ceeea48) Thanks [@tenphi](https://github.com/tenphi)! - Fix tooltip dynamic calculation in ItemBase.

- [#813](https://github.com/cube-js/cube-ui-kit/pull/813) [`96218a6e`](https://github.com/cube-js/cube-ui-kit/commit/96218a6ef18ce24307269f36657fc8209aea68cc) Thanks [@tenphi](https://github.com/tenphi)! - Add ChartHeatmapIcon component.

## 0.80.0

### Minor Changes

- [#810](https://github.com/cube-js/cube-ui-kit/pull/810) [`eb5a2efa`](https://github.com/cube-js/cube-ui-kit/commit/eb5a2efad5681c7f38e5beb6852249e222fd9efa) Thanks [@tenphi](https://github.com/tenphi)! - Add new icons: PercentageIcon, CurrencyDollarIcon, Number123Icon.

### Patch Changes

- [#809](https://github.com/cube-js/cube-ui-kit/pull/809) [`041e7da7`](https://github.com/cube-js/cube-ui-kit/commit/041e7da7be5a293c7919a49f23c758215fe67999) Thanks [@tenphi](https://github.com/tenphi)! - Fix tooltip logic in ItemBase component.

- [#809](https://github.com/cube-js/cube-ui-kit/pull/809) [`041e7da7`](https://github.com/cube-js/cube-ui-kit/commit/041e7da7be5a293c7919a49f23c758215fe67999) Thanks [@tenphi](https://github.com/tenphi)! - Fix accessibility by setting keyboard props to hotkeys in ItemBase component.

## 0.79.0

### Minor Changes

- [#807](https://github.com/cube-js/cube-ui-kit/pull/807) [`ce19c264`](https://github.com/cube-js/cube-ui-kit/commit/ce19c26496fbb87799fc7fb055d1647a4f87c392) Thanks [@tenphi](https://github.com/tenphi)! - **Breaking Change:** AlertDialog API cancel button behavior changed

  The `cancel` button in AlertDialog now rejects the promise instead of resolving with `'cancel'` status, aligning it with the dismiss (Escape key) behavior.

  **Migration Guide:**

  **Before:**

  ```typescript
  alertDialogAPI.open({...})
    .then((status) => {
      if (status === 'cancel') {
        // Handle cancel
      } else if (status === 'confirm') {
        // Handle confirm
      }
    })
  ```

  **After:**

  ```typescript
  alertDialogAPI.open({...})
    .then((status) => {
      if (status === 'confirm') {
        // Handle confirm
      } else if (status === 'secondary') {
        // Handle secondary action
      }
    })
    .catch(() => {
      // Handle cancel or dismiss
    })
  ```

  **Note:** `AlertDialogResolveStatus` type no longer includes `'cancel'` - it now only contains `'confirm' | 'secondary'`.

## 0.78.5

### Patch Changes

- [#805](https://github.com/cube-js/cube-ui-kit/pull/805) [`5fa85184`](https://github.com/cube-js/cube-ui-kit/commit/5fa851840db023def82f1a3838576ba8fe0d65f8) Thanks [@tenphi](https://github.com/tenphi)! - Fix the return type of the TooltipProvider the second time :)

- [#805](https://github.com/cube-js/cube-ui-kit/pull/805) [`5fa85184`](https://github.com/cube-js/cube-ui-kit/commit/5fa851840db023def82f1a3838576ba8fe0d65f8) Thanks [@tenphi](https://github.com/tenphi)! - Fix DecimalDecreaseIcon and DecimalIncreaseIcon.

## 0.78.4

### Patch Changes

- [#803](https://github.com/cube-js/cube-ui-kit/pull/803) [`a4f59bb7`](https://github.com/cube-js/cube-ui-kit/commit/a4f59bb74066d1e900fb69ab3215584182a38cb1) Thanks [@tenphi](https://github.com/tenphi)! - Fix the return type of the TooltipProvider the second time :)

## 0.78.3

### Patch Changes

- [#801](https://github.com/cube-js/cube-ui-kit/pull/801) [`fae98647`](https://github.com/cube-js/cube-ui-kit/commit/fae98647f070ac69f6fa7abc80b5bb568896c81a) Thanks [@tenphi](https://github.com/tenphi)! - Fix the return type of TooltipProvider.

## 0.78.2

### Patch Changes

- [#799](https://github.com/cube-js/cube-ui-kit/pull/799) [`29163467`](https://github.com/cube-js/cube-ui-kit/commit/29163467292aa161131735448ad5e1b659d55abc) Thanks [@tenphi](https://github.com/tenphi)! - Fix tooltip implementation so it doesn't break item navigation.

- [#799](https://github.com/cube-js/cube-ui-kit/pull/799) [`29163467`](https://github.com/cube-js/cube-ui-kit/commit/29163467292aa161131735448ad5e1b659d55abc) Thanks [@tenphi](https://github.com/tenphi)! - Use auto tooltip in ItemBase component by default. See documentation to learn more.

- [#798](https://github.com/cube-js/cube-ui-kit/pull/798) [`17e4f7f7`](https://github.com/cube-js/cube-ui-kit/commit/17e4f7f77103d9c2678cbe6e7c01ab2ca7aa7aa7) Thanks [@tenphi](https://github.com/tenphi)! - Don't pass onPress prop to the element in ItemButton.

## 0.78.1

### Patch Changes

- [#795](https://github.com/cube-js/cube-ui-kit/pull/795) [`2e1a331d`](https://github.com/cube-js/cube-ui-kit/commit/2e1a331d6a02c377e8b8017efe3109574bdde03d) Thanks [@tenphi](https://github.com/tenphi)! - Condense the UI of Dialog component.

- [#796](https://github.com/cube-js/cube-ui-kit/pull/796) [`728f983d`](https://github.com/cube-js/cube-ui-kit/commit/728f983d66a68e78c8c17f6edfde5b0e3b0050cb) Thanks [@tenphi](https://github.com/tenphi)! - Set `disabled`, `checked`, `hidden` mods automatically.

## 0.78.0

### Minor Changes

- [#793](https://github.com/cube-js/cube-ui-kit/pull/793) [`a64ee513`](https://github.com/cube-js/cube-ui-kit/commit/a64ee513381c56b470ebca720a6ad3f21bc5fd3f) Thanks [@tenphi](https://github.com/tenphi)! - The new navigation API that relies on external `useHref` and `useNavigation` hooks.

### Patch Changes

- [#793](https://github.com/cube-js/cube-ui-kit/pull/793) [`a64ee513`](https://github.com/cube-js/cube-ui-kit/commit/a64ee513381c56b470ebca720a6ad3f21bc5fd3f) Thanks [@tenphi](https://github.com/tenphi)! - Add support for full navigation argument type in `to` prop in actions including object `{ pathname, search, hash }` and numbers for history navigation. Use `<Link to={-1}>...` to move back in history.

## 0.77.4

### Patch Changes

- [#791](https://github.com/cube-js/cube-ui-kit/pull/791) [`1ca1deb4`](https://github.com/cube-js/cube-ui-kit/commit/1ca1deb4211ec6a67a5d81fbd7606a76c69faa31) Thanks [@tenphi](https://github.com/tenphi)! - Actualize the interface of Item component.

- [#791](https://github.com/cube-js/cube-ui-kit/pull/791) [`1ca1deb4`](https://github.com/cube-js/cube-ui-kit/commit/1ca1deb4211ec6a67a5d81fbd7606a76c69faa31) Thanks [@tenphi](https://github.com/tenphi)! - Make Panel placeSelf stretch by default.

- [#791](https://github.com/cube-js/cube-ui-kit/pull/791) [`1ca1deb4`](https://github.com/cube-js/cube-ui-kit/commit/1ca1deb4211ec6a67a5d81fbd7606a76c69faa31) Thanks [@tenphi](https://github.com/tenphi)! - Fix Item interface for FilterPicker.

- [#791](https://github.com/cube-js/cube-ui-kit/pull/791) [`1ca1deb4`](https://github.com/cube-js/cube-ui-kit/commit/1ca1deb4211ec6a67a5d81fbd7606a76c69faa31) Thanks [@tenphi](https://github.com/tenphi)! - Add onClear callback for FilterPicker, Select, ComboBox and SearchInput.

- [#791](https://github.com/cube-js/cube-ui-kit/pull/791) [`1ca1deb4`](https://github.com/cube-js/cube-ui-kit/commit/1ca1deb4211ec6a67a5d81fbd7606a76c69faa31) Thanks [@tenphi](https://github.com/tenphi)! - Fix popover of FilterPicker to corretly flip on opening.

## 0.77.3

### Patch Changes

- [#787](https://github.com/cube-js/cube-ui-kit/pull/787) [`78dc7da2`](https://github.com/cube-js/cube-ui-kit/commit/78dc7da2983d1acb1ed32ad48e482a62758c093c) Thanks [@tenphi](https://github.com/tenphi)! - Add ItemAction component with a temporary implementation.

- [#787](https://github.com/cube-js/cube-ui-kit/pull/787) [`78dc7da2`](https://github.com/cube-js/cube-ui-kit/commit/78dc7da2983d1acb1ed32ad48e482a62758c093c) Thanks [@tenphi](https://github.com/tenphi)! - Add a clear button to FilterPicker, Select and ComboBox components. Redesign the clear button in SearchInput component.

- [#789](https://github.com/cube-js/cube-ui-kit/pull/789) [`1251a11b`](https://github.com/cube-js/cube-ui-kit/commit/1251a11b7a406cf960ed1a89115c2f9dd4bd3717) Thanks [@tenphi](https://github.com/tenphi)! - Add DecimalDecreaseIcon.tsx and DecimalIncreaseIcon.tsx.

- [#790](https://github.com/cube-js/cube-ui-kit/pull/790) [`f4e502d1`](https://github.com/cube-js/cube-ui-kit/commit/f4e502d19eae89334c8f2487f7c0a4acb9c3fde6) Thanks [@tenphi](https://github.com/tenphi)! - Make toasts and notifications more visible with a colorful border.

## 0.77.2

### Patch Changes

- [#784](https://github.com/cube-js/cube-ui-kit/pull/784) [`39be6b6b`](https://github.com/cube-js/cube-ui-kit/commit/39be6b6b7053001a36939d047d91dd1ef3d67db5) Thanks [@tenphi](https://github.com/tenphi)! - Fix tooltip condition in ItemBase.

- [#784](https://github.com/cube-js/cube-ui-kit/pull/784) [`39be6b6b`](https://github.com/cube-js/cube-ui-kit/commit/39be6b6b7053001a36939d047d91dd1ef3d67db5) Thanks [@tenphi](https://github.com/tenphi)! - Allow to rewrite the tooltip title in ItemBase.

## 0.77.1

### Patch Changes

- [#782](https://github.com/cube-js/cube-ui-kit/pull/782) [`01192708`](https://github.com/cube-js/cube-ui-kit/commit/01192708383c0e03921020bdeb1d5b5e3f0bc9e7) Thanks [@tenphi](https://github.com/tenphi)! - Fix FilterPicker's tooltip typings.

## 0.77.0

### Minor Changes

- [#780](https://github.com/cube-js/cube-ui-kit/pull/780) [`88accef2`](https://github.com/cube-js/cube-ui-kit/commit/88accef2beaadbdf2c2758de0c3aa961f619a0ca) Thanks [@tenphi](https://github.com/tenphi)! - Remove legacy Modal component.

### Patch Changes

- [#780](https://github.com/cube-js/cube-ui-kit/pull/780) [`88accef2`](https://github.com/cube-js/cube-ui-kit/commit/88accef2beaadbdf2c2758de0c3aa961f619a0ca) Thanks [@tenphi](https://github.com/tenphi)! - Add side border radius to the header and the footer of the menus.

## 0.76.2

### Patch Changes

- [#778](https://github.com/cube-js/cube-ui-kit/pull/778) [`0be20c83`](https://github.com/cube-js/cube-ui-kit/commit/0be20c83f07ff92dd65ba984cb309cdc16166bec) Thanks [@tenphi](https://github.com/tenphi)! - Fix form submission by Enter key.

## 0.76.1

### Patch Changes

- [#776](https://github.com/cube-js/cube-ui-kit/pull/776) [`3f8be8e5`](https://github.com/cube-js/cube-ui-kit/commit/3f8be8e5435e1f6fdcaf0976e27e8a6a3de4890d) Thanks [@tenphi](https://github.com/tenphi)! - Fix CSS total size calculation in debug tools.

## 0.76.0

### Minor Changes

- [#773](https://github.com/cube-js/cube-ui-kit/pull/773) [`d79517e8`](https://github.com/cube-js/cube-ui-kit/commit/d79517e82614fe3fe7c4e0d388ec4ef96ad00c88) Thanks [@tenphi](https://github.com/tenphi)! - Improved debug tools with better DX and simpler API.

### Patch Changes

- [#773](https://github.com/cube-js/cube-ui-kit/pull/773) [`d79517e8`](https://github.com/cube-js/cube-ui-kit/commit/d79517e82614fe3fe7c4e0d388ec4ef96ad00c88) Thanks [@tenphi](https://github.com/tenphi)! - Fix cleanup of style in the new style injector.

- [#773](https://github.com/cube-js/cube-ui-kit/pull/773) [`d79517e8`](https://github.com/cube-js/cube-ui-kit/commit/d79517e82614fe3fe7c4e0d388ec4ef96ad00c88) Thanks [@tenphi](https://github.com/tenphi)! - Optimize rule generation by sorting in cache keys.

- [#773](https://github.com/cube-js/cube-ui-kit/pull/773) [`d79517e8`](https://github.com/cube-js/cube-ui-kit/commit/d79517e82614fe3fe7c4e0d388ec4ef96ad00c88) Thanks [@tenphi](https://github.com/tenphi)! - Improve cache cleanup logic and cache checks.

## 0.75.0

### Minor Changes

- [#767](https://github.com/cube-js/cube-ui-kit/pull/767) [`a43815d8`](https://github.com/cube-js/cube-ui-kit/commit/a43815d8f2f660fd89b5fa7950574204e77158e4) Thanks [@tenphi](https://github.com/tenphi)! - A brand new style injector. Drop `styled-components` dependency.

### Patch Changes

- [#767](https://github.com/cube-js/cube-ui-kit/pull/767) [`a43815d8`](https://github.com/cube-js/cube-ui-kit/commit/a43815d8f2f660fd89b5fa7950574204e77158e4) Thanks [@tenphi](https://github.com/tenphi)! - Add @property definition support via `property` method.

- [#767](https://github.com/cube-js/cube-ui-kit/pull/767) [`a43815d8`](https://github.com/cube-js/cube-ui-kit/commit/a43815d8f2f660fd89b5fa7950574204e77158e4) Thanks [@tenphi](https://github.com/tenphi)! - Fix MenuItem prop passing.

- [#767](https://github.com/cube-js/cube-ui-kit/pull/767) [`a43815d8`](https://github.com/cube-js/cube-ui-kit/commit/a43815d8f2f660fd89b5fa7950574204e77158e4) Thanks [@tenphi](https://github.com/tenphi)! - Add `tastyDebug` tool for debugging.

## 0.74.3

### Patch Changes

- [#770](https://github.com/cube-js/cube-ui-kit/pull/770) [`21336718`](https://github.com/cube-js/cube-ui-kit/commit/21336718865a2e2c8e9a3753ae6961c0cfa83ba1) Thanks [@tenphi](https://github.com/tenphi)! - Add size observer for ItemBase.

## 0.74.2

### Patch Changes

- [#768](https://github.com/cube-js/cube-ui-kit/pull/768) [`fc039f5e`](https://github.com/cube-js/cube-ui-kit/commit/fc039f5e9ae8913908486d7115d86ce4285caa25) Thanks [@tenphi](https://github.com/tenphi)! - Fix checkbox opacity on hover in ListBox.

## 0.74.1

### Patch Changes

- [#765](https://github.com/cube-js/cube-ui-kit/pull/765) [`8310dc90`](https://github.com/cube-js/cube-ui-kit/commit/8310dc90209f14f301a8e60b71f5c2f9bfa27c73) Thanks [@tenphi](https://github.com/tenphi)! - Improve popover state sync.

## 0.74.0

### Minor Changes

- [#764](https://github.com/cube-js/cube-ui-kit/pull/764) [`5e1b4ecb`](https://github.com/cube-js/cube-ui-kit/commit/5e1b4ecb55537f41f9217ca3b20c7bfe81d03dcb) Thanks [@tenphi](https://github.com/tenphi)! - Add support for React 19.

### Patch Changes

- [#762](https://github.com/cube-js/cube-ui-kit/pull/762) [`ecfa2d3b`](https://github.com/cube-js/cube-ui-kit/commit/ecfa2d3b0c56880547093d4acb262adf050dabdc) Thanks [@tenphi](https://github.com/tenphi)! - Update React Aria deps.

- [#764](https://github.com/cube-js/cube-ui-kit/pull/764) [`5e1b4ecb`](https://github.com/cube-js/cube-ui-kit/commit/5e1b4ecb55537f41f9217ca3b20c7bfe81d03dcb) Thanks [@tenphi](https://github.com/tenphi)! - Fix ItemButton default type attribute (button).

## 0.73.2

### Patch Changes

- [#760](https://github.com/cube-js/cube-ui-kit/pull/760) [`2400dd2f`](https://github.com/cube-js/cube-ui-kit/commit/2400dd2f5a625f58da26e964c3833a684b953c61) Thanks [@tenphi](https://github.com/tenphi)! - Add support for loading state in ItemBase via `isLoading` and `loadingSlot` props.

- [#760](https://github.com/cube-js/cube-ui-kit/pull/760) [`2400dd2f`](https://github.com/cube-js/cube-ui-kit/commit/2400dd2f5a625f58da26e964c3833a684b953c61) Thanks [@tenphi](https://github.com/tenphi)! - Add loading state support to ItemButton.

## 0.73.1

### Patch Changes

- [#758](https://github.com/cube-js/cube-ui-kit/pull/758) [`b88c07a5`](https://github.com/cube-js/cube-ui-kit/commit/b88c07a500bc9984ce8b66c55b14166b28b86811) Thanks [@tenphi](https://github.com/tenphi)! - Avoid repetitive warnings in Buttons.

## 0.73.0

### Minor Changes

- [#752](https://github.com/cube-js/cube-ui-kit/pull/752) [`6f3b2616`](https://github.com/cube-js/cube-ui-kit/commit/6f3b2616a50bc1188e7166982e8e4bbff245f663) Thanks [@tenphi](https://github.com/tenphi)! - Add itemBase and ItemButton components packed with lots of features. ItemBase is now used as a base for all Item components in Menu, CommandMenu, ListBox, FilterListBox, FilterPicker, Select, ComboBox.

### Patch Changes

- [#752](https://github.com/cube-js/cube-ui-kit/pull/752) [`6f3b2616`](https://github.com/cube-js/cube-ui-kit/commit/6f3b2616a50bc1188e7166982e8e4bbff245f663) Thanks [@tenphi](https://github.com/tenphi)! - Make menu props optional for open method in `useAnchoredMenu`.

- [#752](https://github.com/cube-js/cube-ui-kit/pull/752) [`6f3b2616`](https://github.com/cube-js/cube-ui-kit/commit/6f3b2616a50bc1188e7166982e8e4bbff245f663) Thanks [@tenphi](https://github.com/tenphi)! - Increase search input size for FilterListBox and CommandMenu.

- [#752](https://github.com/cube-js/cube-ui-kit/pull/752) [`6f3b2616`](https://github.com/cube-js/cube-ui-kit/commit/6f3b2616a50bc1188e7166982e8e4bbff245f663) Thanks [@tenphi](https://github.com/tenphi)! - Add default menu props to `useAnchoredMenu`.

- [#752](https://github.com/cube-js/cube-ui-kit/pull/752) [`6f3b2616`](https://github.com/cube-js/cube-ui-kit/commit/6f3b2616a50bc1188e7166982e8e4bbff245f663) Thanks [@tenphi](https://github.com/tenphi)! - Add `allValueProps`, `customValueProps` and `newCustomValueProps` to customize the additional options in ListBox, FilterListBox and FilterPicker.

- [#752](https://github.com/cube-js/cube-ui-kit/pull/752) [`6f3b2616`](https://github.com/cube-js/cube-ui-kit/commit/6f3b2616a50bc1188e7166982e8e4bbff245f663) Thanks [@tenphi](https://github.com/tenphi)! - Sync opening state between FilterPicker instances and other triggers.

## 0.72.3

### Patch Changes

- [#755](https://github.com/cube-js/cube-ui-kit/pull/755) [`62ff1eed`](https://github.com/cube-js/cube-ui-kit/commit/62ff1eed53448c710348751a0c5716becf8e7c4d) Thanks [@tenphi](https://github.com/tenphi)! - Fix navigation for CommandMenu with sections.

## 0.72.2

### Patch Changes

- [#753](https://github.com/cube-js/cube-ui-kit/pull/753) [`2a7a61ea`](https://github.com/cube-js/cube-ui-kit/commit/2a7a61ea86551b83467a678c06bc9c8cd77f9d79) Thanks [@tenphi](https://github.com/tenphi)! - Fix \$label-width definition in Label component.

- [#753](https://github.com/cube-js/cube-ui-kit/pull/753) [`2a7a61ea`](https://github.com/cube-js/cube-ui-kit/commit/2a7a61ea86551b83467a678c06bc9c8cd77f9d79) Thanks [@tenphi](https://github.com/tenphi)! - Set isDismissable for DialogContainer to true by default.

- [#753](https://github.com/cube-js/cube-ui-kit/pull/753) [`2a7a61ea`](https://github.com/cube-js/cube-ui-kit/commit/2a7a61ea86551b83467a678c06bc9c8cd77f9d79) Thanks [@tenphi](https://github.com/tenphi)! - Fix LRU cache error in the style parser.

## 0.72.1

### Patch Changes

- [#750](https://github.com/cube-js/cube-ui-kit/pull/750) [`0ee6ac95`](https://github.com/cube-js/cube-ui-kit/commit/0ee6ac958946c5621a847d7982f16267b4d29526) Thanks [@tenphi](https://github.com/tenphi)! - Fix \$label-width definition in Label component.

## 0.72.0

### Minor Changes

- [#747](https://github.com/cube-js/cube-ui-kit/pull/747) [`27dc51b2`](https://github.com/cube-js/cube-ui-kit/commit/27dc51b2c3ab08693b02892f38787a3e90e238b9) Thanks [@tenphi](https://github.com/tenphi)! - New syntax for custom properties with fallback: `($prop-name, <fallback_value>)`.

### Patch Changes

- [#749](https://github.com/cube-js/cube-ui-kit/pull/749) [`6f40ed82`](https://github.com/cube-js/cube-ui-kit/commit/6f40ed82775976efecf7b2f99f7356c59b770284) Thanks [@tenphi](https://github.com/tenphi)! - Add SubMenuTrigger component for submenu support in Menu. CommandMenu is not supported.

## 0.71.2

### Patch Changes

- [#745](https://github.com/cube-js/cube-ui-kit/pull/745) [`1646e97f`](https://github.com/cube-js/cube-ui-kit/commit/1646e97f25b6fb8a3488460093ecbd75213ba191) Thanks [@tenphi](https://github.com/tenphi)! - Unescape keys in FilterPicker to support `:` and `=` symbols.

## 0.71.1

### Patch Changes

- [#742](https://github.com/cube-js/cube-ui-kit/pull/742) [`c383d295`](https://github.com/cube-js/cube-ui-kit/commit/c383d295c9a5d30c2931ccbb628d27d4b22715e3) Thanks [@tenphi](https://github.com/tenphi)! - Fix the FilterPicker sorting behavior in controlled mode.

## 0.71.0

### Minor Changes

- [#681](https://github.com/cube-js/cube-ui-kit/pull/681) [`c5f04fec`](https://github.com/cube-js/cube-ui-kit/commit/c5f04fec2c13cf511b6c45059884af94480a17ce) Thanks [@tenphi](https://github.com/tenphi)! - A brand new style parser that supports all kinds of css syntax and nested custom tasty syntax.

## 0.70.0

### Minor Changes

- [#739](https://github.com/cube-js/cube-ui-kit/pull/739) [`796e9bee`](https://github.com/cube-js/cube-ui-kit/commit/796e9bee035ad7246aa018868f0abae930309493) Thanks [@tenphi](https://github.com/tenphi)! - New syntax for custom properties: `$` instead of `@`. The old syntax is now deprecated.

### Patch Changes

- [#739](https://github.com/cube-js/cube-ui-kit/pull/739) [`796e9bee`](https://github.com/cube-js/cube-ui-kit/commit/796e9bee035ad7246aa018868f0abae930309493) Thanks [@tenphi](https://github.com/tenphi)! - Fix color for chart type icons.

## 0.69.3

### Patch Changes

- [#737](https://github.com/cube-js/cube-ui-kit/pull/737) [`45daa5de`](https://github.com/cube-js/cube-ui-kit/commit/45daa5de8c9fbaaa4eac86ef006862e71b2b53a6) Thanks [@tenphi](https://github.com/tenphi)! - Full items prop support in FilterPicker.

## 0.69.2

### Patch Changes

- [#735](https://github.com/cube-js/cube-ui-kit/pull/735) [`7fdc44b0`](https://github.com/cube-js/cube-ui-kit/commit/7fdc44b09e843b5400e86ed0c512616910ee05f5) Thanks [@tenphi](https://github.com/tenphi)! - Fix flipping of popover in FilterPicker if it's already open.

- [#735](https://github.com/cube-js/cube-ui-kit/pull/735) [`7fdc44b0`](https://github.com/cube-js/cube-ui-kit/commit/7fdc44b09e843b5400e86ed0c512616910ee05f5) Thanks [@tenphi](https://github.com/tenphi)! - Improved Button layout.

- [#735](https://github.com/cube-js/cube-ui-kit/pull/735) [`7fdc44b0`](https://github.com/cube-js/cube-ui-kit/commit/7fdc44b09e843b5400e86ed0c512616910ee05f5) Thanks [@tenphi](https://github.com/tenphi)! - Improved FilterPicker layout with additional wrapper for consistency.

- [#735](https://github.com/cube-js/cube-ui-kit/pull/735) [`7fdc44b0`](https://github.com/cube-js/cube-ui-kit/commit/7fdc44b09e843b5400e86ed0c512616910ee05f5) Thanks [@tenphi](https://github.com/tenphi)! - Fix initial state inconsistency in FilterPicker.

- [#735](https://github.com/cube-js/cube-ui-kit/pull/735) [`7fdc44b0`](https://github.com/cube-js/cube-ui-kit/commit/7fdc44b09e843b5400e86ed0c512616910ee05f5) Thanks [@tenphi](https://github.com/tenphi)! - Overflow text ellipsis in Buttons with icons by default.

- [#735](https://github.com/cube-js/cube-ui-kit/pull/735) [`7fdc44b0`](https://github.com/cube-js/cube-ui-kit/commit/7fdc44b09e843b5400e86ed0c512616910ee05f5) Thanks [@tenphi](https://github.com/tenphi)! - Add `showSelectAll` and `selectAllLabel` options for ListBox, FilterListBox, and FilterPicker to add "Select All" option. The label can be customized.

## 0.69.1

### Patch Changes

- [#733](https://github.com/cube-js/cube-ui-kit/pull/733) [`65849abc`](https://github.com/cube-js/cube-ui-kit/commit/65849abc4ef917437cccc1c796cf75680f0a0a7c) Thanks [@tenphi](https://github.com/tenphi)! - Fix minor issues with input styling.

- [#733](https://github.com/cube-js/cube-ui-kit/pull/733) [`65849abc`](https://github.com/cube-js/cube-ui-kit/commit/65849abc4ef917437cccc1c796cf75680f0a0a7c) Thanks [@tenphi](https://github.com/tenphi)! - Expose shouldFocusWrap for ListBox, FilterListBox, and FilterPicker to control whether keyboard navigation should wrap around.

## 0.69.0

### Minor Changes

- [#731](https://github.com/cube-js/cube-ui-kit/pull/731) [`1b57ef6c`](https://github.com/cube-js/cube-ui-kit/commit/1b57ef6c00e8e0fc8437aa92f02c57418cf7b048) Thanks [@tenphi](https://github.com/tenphi)! - More condensed UI. New sizes: medium (40) -> large (40), small (32) -> medium (32), large (48) -> xlarge (48), small (28), xsmall (24).

- [#731](https://github.com/cube-js/cube-ui-kit/pull/731) [`1b57ef6c`](https://github.com/cube-js/cube-ui-kit/commit/1b57ef6c00e8e0fc8437aa92f02c57418cf7b048) Thanks [@tenphi](https://github.com/tenphi)! - Add size prop for TextInputMapper.

## 0.68.0

### Minor Changes

- [#730](https://github.com/cube-js/cube-ui-kit/pull/730) [`5d627efa`](https://github.com/cube-js/cube-ui-kit/commit/5d627efafb1793f45ff8b8ba496b07e17227ac67) Thanks [@tenphi](https://github.com/tenphi)! - Add FilterPicker component for single and multiple picker experience with a filter.

- [#730](https://github.com/cube-js/cube-ui-kit/pull/730) [`5d627efa`](https://github.com/cube-js/cube-ui-kit/commit/5d627efafb1793f45ff8b8ba496b07e17227ac67) Thanks [@tenphi](https://github.com/tenphi)! - Split ListBox into two components: simple ListBox and FilterListBox with search input.

### Patch Changes

- [#730](https://github.com/cube-js/cube-ui-kit/pull/730) [`5d627efa`](https://github.com/cube-js/cube-ui-kit/commit/5d627efafb1793f45ff8b8ba496b07e17227ac67) Thanks [@tenphi](https://github.com/tenphi)! - Improve the layout of Menu component.

- [#727](https://github.com/cube-js/cube-ui-kit/pull/727) [`fa1397f2`](https://github.com/cube-js/cube-ui-kit/commit/fa1397f26e2f6ece95aec915f43e0815355d74f6) Thanks [@tenphi](https://github.com/tenphi)! - Add `fs` custom unit for stable fractions in grid layouts. `1sf` -> `minmax(0, 1fr)`.

- [#730](https://github.com/cube-js/cube-ui-kit/pull/730) [`5d627efa`](https://github.com/cube-js/cube-ui-kit/commit/5d627efafb1793f45ff8b8ba496b07e17227ac67) Thanks [@tenphi](https://github.com/tenphi)! - `wrapWithField` no longer wrap the input component with a field if no label is provided and `forceField` prop is not set.

- [#730](https://github.com/cube-js/cube-ui-kit/pull/730) [`5d627efa`](https://github.com/cube-js/cube-ui-kit/commit/5d627efafb1793f45ff8b8ba496b07e17227ac67) Thanks [@tenphi](https://github.com/tenphi)! - Add a new icon ChartKPI.

- [#727](https://github.com/cube-js/cube-ui-kit/pull/727) [`fa1397f2`](https://github.com/cube-js/cube-ui-kit/commit/fa1397f26e2f6ece95aec915f43e0815355d74f6) Thanks [@tenphi](https://github.com/tenphi)! - Improved tasty documentation.

## 0.67.0

### Minor Changes

- [#725](https://github.com/cube-js/cube-ui-kit/pull/725) [`4b789d2b`](https://github.com/cube-js/cube-ui-kit/commit/4b789d2bddc3bee1c91194c2d76b1c5946cc9cbc) Thanks [@tenphi](https://github.com/tenphi)! - Add useEventBus hook to emit global events and subscribe to them.

- [#725](https://github.com/cube-js/cube-ui-kit/pull/725) [`4b789d2b`](https://github.com/cube-js/cube-ui-kit/commit/4b789d2bddc3bee1c91194c2d76b1c5946cc9cbc) Thanks [@tenphi](https://github.com/tenphi)! - Add useContextMenu hook to invoke a context menu in the exact place of the click.

- [#725](https://github.com/cube-js/cube-ui-kit/pull/725) [`4b789d2b`](https://github.com/cube-js/cube-ui-kit/commit/4b789d2bddc3bee1c91194c2d76b1c5946cc9cbc) Thanks [@tenphi](https://github.com/tenphi)! - Add useAnchoredMenu hook to programmatically invoke a menu anchored to the specific element.

## 0.66.1

### Patch Changes

- [#722](https://github.com/cube-js/cube-ui-kit/pull/722) [`7eaf393`](https://github.com/cube-js/cube-ui-kit/commit/7eaf393cedb574237afee6579ab21b7abf57f83e) Thanks [@tenphi](https://github.com/tenphi)! - Fix a bug when CommandMenu is unable to be navigated via keys when the search input is filled with any value.

## 0.66.0

### Minor Changes

- [#720](https://github.com/cube-js/cube-ui-kit/pull/720) [`2275c30`](https://github.com/cube-js/cube-ui-kit/commit/2275c30a9e918c06d861a4c348057fb191566229) Thanks [@tenphi](https://github.com/tenphi)! - Add CommandMenu component.

- [#720](https://github.com/cube-js/cube-ui-kit/pull/720) [`2275c30`](https://github.com/cube-js/cube-ui-kit/commit/2275c30a9e918c06d861a4c348057fb191566229) Thanks [@tenphi](https://github.com/tenphi)! - Changed HotKeys API. Use `children` to pass hotkeys instead of `keys` prop.

## 0.65.1

### Patch Changes

- [#718](https://github.com/cube-js/cube-ui-kit/pull/718) [`eec1cde`](https://github.com/cube-js/cube-ui-kit/commit/eec1cde994d8087362c46c65636abe97030ad98e) Thanks [@tenphi](https://github.com/tenphi)! - Add `tooltip` prop to menu items. You can pass a `string` or a `TooltipProps` object with `title` prop there for advanced customization.

## 0.65.0

### Minor Changes

- [#716](https://github.com/cube-js/cube-ui-kit/pull/716) [`a42a468`](https://github.com/cube-js/cube-ui-kit/commit/a42a4686c4b9ad731dabe0bc513a335d5975a31c) Thanks [@tenphi](https://github.com/tenphi)! - Add HotKeys component to visualize hot keys combinations.

- [#716](https://github.com/cube-js/cube-ui-kit/pull/716) [`a42a468`](https://github.com/cube-js/cube-ui-kit/commit/a42a4686c4b9ad731dabe0bc513a335d5975a31c) Thanks [@tenphi](https://github.com/tenphi)! - Add `hotkeys` property for menu items to specify hot keys to trigger the action.

### Patch Changes

- [#716](https://github.com/cube-js/cube-ui-kit/pull/716) [`a42a468`](https://github.com/cube-js/cube-ui-kit/commit/a42a4686c4b9ad731dabe0bc513a335d5975a31c) Thanks [@tenphi](https://github.com/tenphi)! - Improve ListBox implementation and add support for the empty state with customization via `emptyLabel` property.

- [#716](https://github.com/cube-js/cube-ui-kit/pull/716) [`a42a468`](https://github.com/cube-js/cube-ui-kit/commit/a42a4686c4b9ad731dabe0bc513a335d5975a31c) Thanks [@tenphi](https://github.com/tenphi)! - Add new chart icons and update the old ones.

## 0.64.1

### Patch Changes

- [#712](https://github.com/cube-js/cube-ui-kit/pull/712) [`6612034`](https://github.com/cube-js/cube-ui-kit/commit/66120342e3c495e10227d3f77c6f43204034256c) Thanks [@tenphi](https://github.com/tenphi)! - Unify the focused state in Menu component.

- [#712](https://github.com/cube-js/cube-ui-kit/pull/712) [`6612034`](https://github.com/cube-js/cube-ui-kit/commit/66120342e3c495e10227d3f77c6f43204034256c) Thanks [@tenphi](https://github.com/tenphi)! - Fix errorMessage type.

## 0.64.0

### Minor Changes

- [#711](https://github.com/cube-js/cube-ui-kit/pull/711) [`ad733be`](https://github.com/cube-js/cube-ui-kit/commit/ad733be793cbadd7de6d21488d127676cd8ef766) Thanks [@tenphi](https://github.com/tenphi)! - The `message` field prop is now deprecated. Use `errorMessage` or `description` instead.

### Patch Changes

- [#713](https://github.com/cube-js/cube-ui-kit/pull/713) [`77275fb`](https://github.com/cube-js/cube-ui-kit/commit/77275fb656b6db7e94cda2e8f6598a149687f6a2) Thanks [@tenphi](https://github.com/tenphi)! - Add new horizontal chart icons.

## 0.63.3

### Patch Changes

- [#706](https://github.com/cube-js/cube-ui-kit/pull/706) [`d440c1e`](https://github.com/cube-js/cube-ui-kit/commit/d440c1e4408cd12ac02291d76d2dcf8c099c550e) Thanks [@tenphi](https://github.com/tenphi)! - Add more documentations for various components and concepts.

## 0.63.2

### Patch Changes

- [#708](https://github.com/cube-js/cube-ui-kit/pull/708) [`e7dad8d`](https://github.com/cube-js/cube-ui-kit/commit/e7dad8d639495934844f5361c715eab694dcd5ba) Thanks [@tenphi](https://github.com/tenphi)! - Update ChartBoxPlot and add Adjustment icons.

## 0.63.1

### Patch Changes

- [#705](https://github.com/cube-js/cube-ui-kit/pull/705) [`0f0b2b3`](https://github.com/cube-js/cube-ui-kit/commit/0f0b2b32badc19947bfed7ce0c69ad4af6cfb6cb) Thanks [@tenphi](https://github.com/tenphi)! - Add new chart icons.

## 0.63.0

### Minor Changes

- [#703](https://github.com/cube-js/cube-ui-kit/pull/703) [`79ab3db`](https://github.com/cube-js/cube-ui-kit/commit/79ab3db8ab185da4615312e3c0daf03cd288a588) Thanks [@tenphi](https://github.com/tenphi)! - Add sections support for Select.

- [#703](https://github.com/cube-js/cube-ui-kit/pull/703) [`79ab3db`](https://github.com/cube-js/cube-ui-kit/commit/79ab3db8ab185da4615312e3c0daf03cd288a588) Thanks [@tenphi](https://github.com/tenphi)! - Remove divider support in Menu but add dividers between sections.

## 0.62.3

### Patch Changes

- [#701](https://github.com/cube-js/cube-ui-kit/pull/701) [`9fc76b5`](https://github.com/cube-js/cube-ui-kit/commit/9fc76b5101bc98c102535a492b59f79334c494f4) Thanks [@tenphi](https://github.com/tenphi)! - Fix Menu type.

## 0.62.2

### Patch Changes

- [#699](https://github.com/cube-js/cube-ui-kit/pull/699) [`71d5328`](https://github.com/cube-js/cube-ui-kit/commit/71d5328bec048c4c6a054bd544d67ffc9b674ebe) Thanks [@tenphi](https://github.com/tenphi)! - Fix Menu with spread function inside.

## 0.62.1

### Patch Changes

- [#697](https://github.com/cube-js/cube-ui-kit/pull/697) [`408ea7b`](https://github.com/cube-js/cube-ui-kit/commit/408ea7bb027c5214d161ec8ef4d5ea72d391d07b) Thanks [@tenphi](https://github.com/tenphi)! - Add support for `description` item prop inside `<Menu/>`.

- [#697](https://github.com/cube-js/cube-ui-kit/pull/697) [`408ea7b`](https://github.com/cube-js/cube-ui-kit/commit/408ea7bb027c5214d161ec8ef4d5ea72d391d07b) Thanks [@tenphi](https://github.com/tenphi)! - Add support for `description` item prop in `<ComboBox/>`.

- [#697](https://github.com/cube-js/cube-ui-kit/pull/697) [`408ea7b`](https://github.com/cube-js/cube-ui-kit/commit/408ea7bb027c5214d161ec8ef4d5ea72d391d07b) Thanks [@tenphi](https://github.com/tenphi)! - Change disabled state of clear and neutral buttons.

- [#697](https://github.com/cube-js/cube-ui-kit/pull/697) [`408ea7b`](https://github.com/cube-js/cube-ui-kit/commit/408ea7bb027c5214d161ec8ef4d5ea72d391d07b) Thanks [@tenphi](https://github.com/tenphi)! - Add border to dialogs with popover type.

- [#697](https://github.com/cube-js/cube-ui-kit/pull/697) [`408ea7b`](https://github.com/cube-js/cube-ui-kit/commit/408ea7bb027c5214d161ec8ef4d5ea72d391d07b) Thanks [@tenphi](https://github.com/tenphi)! - Add border to popover of `<Select/>` and `<Combobox/>`.

- [#697](https://github.com/cube-js/cube-ui-kit/pull/697) [`408ea7b`](https://github.com/cube-js/cube-ui-kit/commit/408ea7bb027c5214d161ec8ef4d5ea72d391d07b) Thanks [@tenphi](https://github.com/tenphi)! - Add support for `<Divider/>` inside `<Menu/>`.

## 0.62.0

### Minor Changes

- [#695](https://github.com/cube-js/cube-ui-kit/pull/695) [`81281f1`](https://github.com/cube-js/cube-ui-kit/commit/81281f1b8f06d34f063f4e9ed899114b6f046078) Thanks [@tenphi](https://github.com/tenphi)! - Remove `ellipsis` flag from `<Select/>`. Text overflow ellipsis is now always used.

### Patch Changes

- [#695](https://github.com/cube-js/cube-ui-kit/pull/695) [`81281f1`](https://github.com/cube-js/cube-ui-kit/commit/81281f1b8f06d34f063f4e9ed899114b6f046078) Thanks [@tenphi](https://github.com/tenphi)! - Add support for description in `Select.Item`.

## 0.61.10

### Patch Changes

- [#693](https://github.com/cube-js/cube-ui-kit/pull/693) [`9b52be6`](https://github.com/cube-js/cube-ui-kit/commit/9b52be68eed3d9335a2b61889e98e8845dd4341e) Thanks [@tenphi](https://github.com/tenphi)! - Allow PrismCode to accept nullish values if they are passed.

## 0.61.9

### Patch Changes

- [#691](https://github.com/cube-js/cube-ui-kit/pull/691) [`31425c9`](https://github.com/cube-js/cube-ui-kit/commit/31425c9259eb968d844acfda15203b96ce0a1457) Thanks [@tenphi](https://github.com/tenphi)! - Fix `defaultContainerProps` in `useDialogContainer` hook.

## 0.61.8

### Patch Changes

- [#689](https://github.com/cube-js/cube-ui-kit/pull/689) [`dc2d451`](https://github.com/cube-js/cube-ui-kit/commit/dc2d451b8cd6df98f867659b55740ab29a90bd6c) Thanks [@tenphi](https://github.com/tenphi)! - Do not render the footer in AlertDialog if all button props are falsy

## 0.61.7

### Patch Changes

- [#687](https://github.com/cube-js/cube-ui-kit/pull/687) [`d6820d0`](https://github.com/cube-js/cube-ui-kit/commit/d6820d09d10aca57527a3578efddcf77f03c283e) Thanks [@tenphi](https://github.com/tenphi)! - Use react renderer for PrismCode.

## 0.61.6

### Patch Changes

- [#685](https://github.com/cube-js/cube-ui-kit/pull/685) [`eeaf472`](https://github.com/cube-js/cube-ui-kit/commit/eeaf472f5c561feec8557939e7152458ad2b3011) Thanks [@tenphi](https://github.com/tenphi)! - Add light version for Tooltip component. Use `isLight` prop to activate it.

## 0.61.5

### Patch Changes

- [#683](https://github.com/cube-js/cube-ui-kit/pull/683) [`e73acd5`](https://github.com/cube-js/cube-ui-kit/commit/e73acd5e27cec6ed5075cada06967c166465ef5d) Thanks [@tenphi](https://github.com/tenphi)! - Fix focused state styles on Menu items.

## 0.61.4

### Patch Changes

- [`56f9304`](https://github.com/cube-js/cube-ui-kit/commit/56f9304f8af3a9d88456ded269e7983e0dfed861) Thanks [@tenphi](https://github.com/tenphi)! - Fix missing aria-label on Close button in FileTabs.

## 0.61.3

### Patch Changes

- [#679](https://github.com/cube-js/cube-ui-kit/pull/679) [`ad55f41`](https://github.com/cube-js/cube-ui-kit/commit/ad55f4118ecaebf87ad05a482b1f0780b2090d6b) Thanks [@tenphi](https://github.com/tenphi)! - Migrate to `scrollbar` style.

## 0.61.2

### Patch Changes

- [#677](https://github.com/cube-js/cube-ui-kit/pull/677) [`f397cf2`](https://github.com/cube-js/cube-ui-kit/commit/f397cf2e602d1360e6ecd6af771392bf76dc2e83) Thanks [@tenphi](https://github.com/tenphi)! - Use native scrolls in Panel by default.

- [#677](https://github.com/cube-js/cube-ui-kit/pull/677) [`f397cf2`](https://github.com/cube-js/cube-ui-kit/commit/f397cf2e602d1360e6ecd6af771392bf76dc2e83) Thanks [@tenphi](https://github.com/tenphi)! - Apply various fixes to the new scrollbar style.

## 0.61.1

### Patch Changes

- [#675](https://github.com/cube-js/cube-ui-kit/pull/675) [`c3cb385`](https://github.com/cube-js/cube-ui-kit/commit/c3cb3859f8e9324ae8fa3ea8424138e73b313d85) Thanks [@tenphi](https://github.com/tenphi)! - Apply various fixes to the new scrollbar style.

## 0.61.0

### Minor Changes

- [#673](https://github.com/cube-js/cube-ui-kit/pull/673) [`2f12b93`](https://github.com/cube-js/cube-ui-kit/commit/2f12b93ae673403b640854f41cc906711fa3249d) Thanks [@tenphi](https://github.com/tenphi)! - Add `scrollbar` style deprecating `styledScrollbar` style.

### Patch Changes

- [#673](https://github.com/cube-js/cube-ui-kit/pull/673) [`2f12b93`](https://github.com/cube-js/cube-ui-kit/commit/2f12b93ae673403b640854f41cc906711fa3249d) Thanks [@tenphi](https://github.com/tenphi)! - Add support for the `offset` value in the `outline` style.

- [#673](https://github.com/cube-js/cube-ui-kit/pull/673) [`2f12b93`](https://github.com/cube-js/cube-ui-kit/commit/2f12b93ae673403b640854f41cc906711fa3249d) Thanks [@tenphi](https://github.com/tenphi)! - Add support for default container props in `useDialogContainer`.

## 0.60.5

### Patch Changes

- [#670](https://github.com/cube-js/cube-ui-kit/pull/670) [`927897d`](https://github.com/cube-js/cube-ui-kit/commit/927897d9bd12cc0075eee3aa33d51fe264efa65b) Thanks [@tenphi](https://github.com/tenphi)! - Thinner resizable panel handler.

- [#670](https://github.com/cube-js/cube-ui-kit/pull/670) [`927897d`](https://github.com/cube-js/cube-ui-kit/commit/927897d9bd12cc0075eee3aa33d51fe264efa65b) Thanks [@tenphi](https://github.com/tenphi)! - Fix issue in Panel component when style property could be applied to both outer and inner containers.

## 0.60.4

### Patch Changes

- [#668](https://github.com/cube-js/cube-ui-kit/pull/668) [`177339c`](https://github.com/cube-js/cube-ui-kit/commit/177339cff21176f640e53df5def47afcc5ddd183) Thanks [@tenphi](https://github.com/tenphi)! - Fix issue that throws an error if ResizablePanel is used in Safari.

## 0.60.3

### Patch Changes

- [#666](https://github.com/cube-js/cube-ui-kit/pull/666) [`bb8ad4e`](https://github.com/cube-js/cube-ui-kit/commit/bb8ad4e881299b213fa31f06f0acdce15ea86ab5) Thanks [@tenphi](https://github.com/tenphi)! - Fix focus state for multiple input components.

## 0.60.2

### Patch Changes

- [#664](https://github.com/cube-js/cube-ui-kit/pull/664) [`c7fdfb4`](https://github.com/cube-js/cube-ui-kit/commit/c7fdfb422c8d819f4078d08df25e9c27f14c0018) Thanks [@tenphi](https://github.com/tenphi)! - Fix Menu children typing.

## 0.60.1

### Patch Changes

- [#662](https://github.com/cube-js/cube-ui-kit/pull/662) [`a72f42f`](https://github.com/cube-js/cube-ui-kit/commit/a72f42f41c6a622aaea9b5454c0f9de6eed634d0) Thanks [@tenphi](https://github.com/tenphi)! - Optimize Button style generation via more variants.

- [#661](https://github.com/cube-js/cube-ui-kit/pull/661) [`6c18b43`](https://github.com/cube-js/cube-ui-kit/commit/6c18b43e680dfb927a79912bd6ad16f8996afead) Thanks [@tenphi](https://github.com/tenphi)! - Fixes Menu Item disabled styles.

## 0.60.0

### Minor Changes

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Add success theme for Button component.

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Decrease the line height of the h2 headers to 32px.

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Improved design of Switch component.

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Replace most of the icons with Tabler icons.

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Remove default custom fonts.

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Replace most of the colors by more contrast and consistent versions.

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Change neutral and outline types visually for Button component and set outline as the default type.

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Rework of all color palette.

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Improve Select and ComboBox styles and the size of their chevron icons.

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Add wrapperStyles to Select and ComboBox components and fix style props extraction.

### Patch Changes

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Allow numbers in more styles.

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Improve Dialog outline except for popovers.

- [#659](https://github.com/cube-js/cube-ui-kit/pull/659) [`2dfa908`](https://github.com/cube-js/cube-ui-kit/commit/2dfa908d16befd4eef0cf0acb957a4e35803959b) Thanks [@tenphi](https://github.com/tenphi)! - Add basic transitions for icons.

## 0.59.14

### Patch Changes

- [#657](https://github.com/cube-js/cube-ui-kit/pull/657) [`d7939cf`](https://github.com/cube-js/cube-ui-kit/commit/d7939cf3d6b6edf4ffece545e8c4604c0272f8d9) Thanks [@tenphi](https://github.com/tenphi)! - Fix drift in Resizable Panel in controllable state.

## 0.59.13

### Patch Changes

- [#655](https://github.com/cube-js/cube-ui-kit/pull/655) [`14986ac`](https://github.com/cube-js/cube-ui-kit/commit/14986acdd81006cc689d417ff09cac03a0f144fc) Thanks [@tenphi](https://github.com/tenphi)! - Fix minimum dialog size.

## 0.59.12

### Patch Changes

- [#653](https://github.com/cube-js/cube-ui-kit/pull/653) [`6cefdcc`](https://github.com/cube-js/cube-ui-kit/commit/6cefdcc8c92b215d118986dec22a1b1e640f6ea7) Thanks [@tenphi](https://github.com/tenphi)! - Fix the cursor type for resizing ResizablePanel in vertical direction.

## 0.59.11

### Patch Changes

- [#651](https://github.com/cube-js/cube-ui-kit/pull/651) [`ae277a7`](https://github.com/cube-js/cube-ui-kit/commit/ae277a785afeba0e5e580f2ef7882b8962ef6094) Thanks [@vasilev-alex](https://github.com/vasilev-alex)! - Pass props to the skeleton layout root.

## 0.59.10

### Patch Changes

- [#647](https://github.com/cube-js/cube-ui-kit/pull/647) [`762b604`](https://github.com/cube-js/cube-ui-kit/commit/762b604b916abe20932dbd0e9b59a39c61db971b) Thanks [@tenphi](https://github.com/tenphi)! - Faster overlay transition with 120ms duration instead of 180ms.

- [#647](https://github.com/cube-js/cube-ui-kit/pull/647) [`762b604`](https://github.com/cube-js/cube-ui-kit/commit/762b604b916abe20932dbd0e9b59a39c61db971b) Thanks [@tenphi](https://github.com/tenphi)! - Minor fixes for typings.

## 0.59.9

### Patch Changes

- [#648](https://github.com/cube-js/cube-ui-kit/pull/648) [`83c7a17`](https://github.com/cube-js/cube-ui-kit/commit/83c7a172987fc82f605e293bd66f63638e97070d) Thanks [@tenphi](https://github.com/tenphi)! - Fix inputRef for text inputs.

## 0.59.8

### Patch Changes

- [#645](https://github.com/cube-js/cube-ui-kit/pull/645) [`d3cf4a1`](https://github.com/cube-js/cube-ui-kit/commit/d3cf4a13a93a32da9021c79801fa8c387bfba5ca) Thanks [@vasilev-alex](https://github.com/vasilev-alex)! - Add maxRows prop to TextArea in control maximum visible rows in auto-size mode.

- [#645](https://github.com/cube-js/cube-ui-kit/pull/645) [`d3cf4a1`](https://github.com/cube-js/cube-ui-kit/commit/d3cf4a13a93a32da9021c79801fa8c387bfba5ca) Thanks [@vasilev-alex](https://github.com/vasilev-alex)! - Improved calculation of height in auto-sized TextArea.

## 0.59.7

### Patch Changes

- [#642](https://github.com/cube-js/cube-ui-kit/pull/642) [`fe2bc40`](https://github.com/cube-js/cube-ui-kit/commit/fe2bc406e82f183f4dfdfdb5c3bfd31fbefc81fc) Thanks [@tenphi](https://github.com/tenphi)! - Move qa attribute to the root wrapper in Switch component.

## 0.59.6

### Patch Changes

- [#640](https://github.com/cube-js/cube-ui-kit/pull/640) [`e3bc889`](https://github.com/cube-js/cube-ui-kit/commit/e3bc8895fd578c41282d715ab3999eaa325faf15) Thanks [@tenphi](https://github.com/tenphi)! - Switch the default Switch wrapper tag to label for better accessibility and e2e testing.

## 0.59.5

### Patch Changes

- [#637](https://github.com/cube-js/cube-ui-kit/pull/637) [`2822be0`](https://github.com/cube-js/cube-ui-kit/commit/2822be08e731d95b8a55b7ac5a699d2f8ef7a9c6) Thanks [@tenphi](https://github.com/tenphi)! - Change `note-text` to improve contrast.

- [#637](https://github.com/cube-js/cube-ui-kit/pull/637) [`2822be0`](https://github.com/cube-js/cube-ui-kit/commit/2822be08e731d95b8a55b7ac5a699d2f8ef7a9c6) Thanks [@tenphi](https://github.com/tenphi)! - Add `special` theme for components that use them.

- [#638](https://github.com/cube-js/cube-ui-kit/pull/638) [`267b203`](https://github.com/cube-js/cube-ui-kit/commit/267b203900dfad383556f212713de6e9b5c95c53) Thanks [@tenphi](https://github.com/tenphi)! - Throw an error if code prop in PrismCode is not a string and not falsy.

- [#637](https://github.com/cube-js/cube-ui-kit/pull/637) [`2822be0`](https://github.com/cube-js/cube-ui-kit/commit/2822be08e731d95b8a55b7ac5a699d2f8ef7a9c6) Thanks [@tenphi](https://github.com/tenphi)! - Allow to set mods for Tag component.

## 0.59.4

### Patch Changes

- [#635](https://github.com/cube-js/cube-ui-kit/pull/635) [`ac9100a`](https://github.com/cube-js/cube-ui-kit/commit/ac9100ae1e7ca0d38b9d077ccb2d63f6022e87f3) Thanks [@tenphi](https://github.com/tenphi)! - Fix outline styles after migration in various components.

- [#635](https://github.com/cube-js/cube-ui-kit/pull/635) [`ac9100a`](https://github.com/cube-js/cube-ui-kit/commit/ac9100ae1e7ca0d38b9d077ccb2d63f6022e87f3) Thanks [@tenphi](https://github.com/tenphi)! - Fix border radius in Action buttons in CopySnippet.

## 0.59.3

### Patch Changes

- [#633](https://github.com/cube-js/cube-ui-kit/pull/633) [`7250112`](https://github.com/cube-js/cube-ui-kit/commit/7250112d571c2391fc79ebe4da0e5a636e543a3a) Thanks [@tenphi](https://github.com/tenphi)! - Fix ComboBox behavior on choosing option via Enter press.

## 0.59.2

### Patch Changes

- [#631](https://github.com/cube-js/cube-ui-kit/pull/631) [`29d3499`](https://github.com/cube-js/cube-ui-kit/commit/29d3499177b817090d1994dd2aecee3c905d64c1) Thanks [@tenphi](https://github.com/tenphi)! - Fix ComboBox behavior outside the form.

## 0.59.1

### Patch Changes

- [#629](https://github.com/cube-js/cube-ui-kit/pull/629) [`d06c017`](https://github.com/cube-js/cube-ui-kit/commit/d06c017bb1dae18c60fe2d1b192c31373dcf5562) Thanks [@tenphi](https://github.com/tenphi)! - Reset the value of the ComboBox on Enter press if it's not an option and custom input is not allowed.

## 0.59.0

### Minor Changes

- [#627](https://github.com/cube-js/cube-ui-kit/pull/627) [`68e0bed`](https://github.com/cube-js/cube-ui-kit/commit/68e0bedd267fb24663ebf88e4f4f5d8432620761) Thanks [@tenphi](https://github.com/tenphi)! - Migration to modern rgb definition.

### Patch Changes

- [#627](https://github.com/cube-js/cube-ui-kit/pull/627) [`68e0bed`](https://github.com/cube-js/cube-ui-kit/commit/68e0bedd267fb24663ebf88e4f4f5d8432620761) Thanks [@tenphi](https://github.com/tenphi)! - Use native css outline for outline style.

## 0.58.0

### Minor Changes

- [#624](https://github.com/cube-js/cube-ui-kit/pull/624) [`954b26c`](https://github.com/cube-js/cube-ui-kit/commit/954b26c39d1a05840016200ea712b47c85c81f8b) Thanks [@tenphi](https://github.com/tenphi)! - Remove CJS support.

- [#624](https://github.com/cube-js/cube-ui-kit/pull/624) [`954b26c`](https://github.com/cube-js/cube-ui-kit/commit/954b26c39d1a05840016200ea712b47c85c81f8b) Thanks [@tenphi](https://github.com/tenphi)! - When a dialog is opened focus on the first input with autofocus or primary button.

- [#624](https://github.com/cube-js/cube-ui-kit/pull/624) [`954b26c`](https://github.com/cube-js/cube-ui-kit/commit/954b26c39d1a05840016200ea712b47c85c81f8b) Thanks [@tenphi](https://github.com/tenphi)! - Fixes various issues with ComboBox input typing and selection.

- [#624](https://github.com/cube-js/cube-ui-kit/pull/624) [`954b26c`](https://github.com/cube-js/cube-ui-kit/commit/954b26c39d1a05840016200ea712b47c85c81f8b) Thanks [@tenphi](https://github.com/tenphi)! - Remove inputValue abstraction from form fields.

### Patch Changes

- [#624](https://github.com/cube-js/cube-ui-kit/pull/624) [`954b26c`](https://github.com/cube-js/cube-ui-kit/commit/954b26c39d1a05840016200ea712b47c85c81f8b) Thanks [@tenphi](https://github.com/tenphi)! - Fix RadioGroup style typings.

- [#624](https://github.com/cube-js/cube-ui-kit/pull/624) [`954b26c`](https://github.com/cube-js/cube-ui-kit/commit/954b26c39d1a05840016200ea712b47c85c81f8b) Thanks [@tenphi](https://github.com/tenphi)! - Fixes the bug when ComboBox is cleared when bluring the input without making any change.

## 0.57.0

### Minor Changes

- [#622](https://github.com/cube-js/cube-ui-kit/pull/622) [`dbb6f35`](https://github.com/cube-js/cube-ui-kit/commit/dbb6f351c61b374087b3aeb977cd7ce578f84254) Thanks [@tenphi](https://github.com/tenphi)! - Add support for Combobox, TextArea and Password fields in TextInputMapper.

### Patch Changes

- [#622](https://github.com/cube-js/cube-ui-kit/pull/622) [`dbb6f35`](https://github.com/cube-js/cube-ui-kit/commit/dbb6f351c61b374087b3aeb977cd7ce578f84254) Thanks [@tenphi](https://github.com/tenphi)! - Show placeholder in TextInput or TextArea with type password.

- [#622](https://github.com/cube-js/cube-ui-kit/pull/622) [`dbb6f35`](https://github.com/cube-js/cube-ui-kit/commit/dbb6f351c61b374087b3aeb977cd7ce578f84254) Thanks [@tenphi](https://github.com/tenphi)! - Add support for `autocomplete` attribute in TextInput.

## 0.56.3

### Patch Changes

- [#620](https://github.com/cube-js/cube-ui-kit/pull/620) [`0080420`](https://github.com/cube-js/cube-ui-kit/commit/00804200a3cbb7fa64177578df4393f1fe1d1d04) Thanks [@tenphi](https://github.com/tenphi)! - Check the env before setting uikit version globally.

## 0.56.2

### Patch Changes

- [#617](https://github.com/cube-js/cube-ui-kit/pull/617) [`eb37f58`](https://github.com/cube-js/cube-ui-kit/commit/eb37f58319689f5b1042ebedcf54fc369a7c98ec) Thanks [@tenphi](https://github.com/tenphi)! - Fixes false error in useDialogContainer.

## 0.56.1

### Patch Changes

- [#615](https://github.com/cube-js/cube-ui-kit/pull/615) [`06090dc`](https://github.com/cube-js/cube-ui-kit/commit/06090dc05a465a598f9fe3b81154b35b8bfb26fa) Thanks [@tenphi](https://github.com/tenphi)! - Allow to pass props for DialogContainer in useDialogContainer hook.

## 0.56.0

### Minor Changes

- [#611](https://github.com/cube-js/cube-ui-kit/pull/611) [`4051fe9`](https://github.com/cube-js/cube-ui-kit/commit/4051fe90041d66c1419fdf3d2041fbd73b483160) Thanks [@tenphi](https://github.com/tenphi)! - Add useDialogContainer hook to manage dialogs.

### Patch Changes

- [#613](https://github.com/cube-js/cube-ui-kit/pull/613) [`7e1cffd`](https://github.com/cube-js/cube-ui-kit/commit/7e1cffd57cb67fd3259dfd7f7f3a5fae40b68519) Thanks [@tenphi](https://github.com/tenphi)! - Add DatabaseIcon.

- [#609](https://github.com/cube-js/cube-ui-kit/pull/609) [`d7a7759`](https://github.com/cube-js/cube-ui-kit/commit/d7a7759cdf52e2aea01c781e606103426ccd4b47) Thanks [@tenphi](https://github.com/tenphi)! - Add `isDirty` flag to Form instances.

- [#612](https://github.com/cube-js/cube-ui-kit/pull/612) [`a598267`](https://github.com/cube-js/cube-ui-kit/commit/a598267fdafd358b15e5e6515414e76da33ab4a3) Thanks [@tenphi](https://github.com/tenphi)! - Postpone form reset in DialogForm until closing transition is over.

- [#609](https://github.com/cube-js/cube-ui-kit/pull/609) [`d7a7759`](https://github.com/cube-js/cube-ui-kit/commit/d7a7759cdf52e2aea01c781e606103426ccd4b47) Thanks [@tenphi](https://github.com/tenphi)! - Do not extract inputStyles from props in Checkbox.

## 0.55.1

### Patch Changes

- [#607](https://github.com/cube-js/cube-ui-kit/pull/607) [`5615358`](https://github.com/cube-js/cube-ui-kit/commit/56153582e5699cbc54eec18e2032d8f5b5734440) Thanks [@tenphi](https://github.com/tenphi)! - Add PlayCircle and Report icons.

## 0.55.0

### Minor Changes

- [#603](https://github.com/cube-js/cube-ui-kit/pull/603) [`c5c6339`](https://github.com/cube-js/cube-ui-kit/commit/c5c63391d9cd894f5f950a797dfeb98aee655e02) Thanks [@tenphi](https://github.com/tenphi)! - Always wrap Switch in a Field.

- [#603](https://github.com/cube-js/cube-ui-kit/pull/603) [`c5c6339`](https://github.com/cube-js/cube-ui-kit/commit/c5c63391d9cd894f5f950a797dfeb98aee655e02) Thanks [@tenphi](https://github.com/tenphi)! - Always wrap Checkbox in a Field except checkbox group case.

## 0.54.4

### Patch Changes

- [#601](https://github.com/cube-js/cube-ui-kit/pull/601) [`26277fe`](https://github.com/cube-js/cube-ui-kit/commit/26277fe57ca004beb39c49e77b76c5a408d72e34) Thanks [@tenphi](https://github.com/tenphi)! - Unify label suffix gap in Field component.

## 0.54.3

### Patch Changes

- [#599](https://github.com/cube-js/cube-ui-kit/pull/599) [`2e04dba`](https://github.com/cube-js/cube-ui-kit/commit/2e04dba3a5a76fddea230b999acaba923a7a6d11) Thanks [@tenphi](https://github.com/tenphi)! - Reset field status on `setFieldValue()`.

## 0.54.2

### Patch Changes

- [#596](https://github.com/cube-js/cube-ui-kit/pull/596) [`4286858`](https://github.com/cube-js/cube-ui-kit/commit/4286858738b960706591c0de6887a0874031a388) Thanks [@tenphi](https://github.com/tenphi)! - Fix RangeSlider to avoid getting stuck at max or min values.

- [#596](https://github.com/cube-js/cube-ui-kit/pull/596) [`4286858`](https://github.com/cube-js/cube-ui-kit/commit/4286858738b960706591c0de6887a0874031a388) Thanks [@tenphi](https://github.com/tenphi)! - Fix Underlay's zIndex so modal dialogs can be stackable.

## 0.54.1

### Patch Changes

- [#594](https://github.com/cube-js/cube-ui-kit/pull/594) [`49396dc`](https://github.com/cube-js/cube-ui-kit/commit/49396dca69fe07513b2318970e16befbcc0a2737) Thanks [@tenphi](https://github.com/tenphi)! - Allow to get a state in menu trigger.

## 0.54.0

### Minor Changes

- [#592](https://github.com/cube-js/cube-ui-kit/pull/592) [`dae9246`](https://github.com/cube-js/cube-ui-kit/commit/dae92466a220dba57472fb3c926e72958354e024) Thanks [@tenphi](https://github.com/tenphi)! - Add DirectionIcon component.

### Patch Changes

- [#592](https://github.com/cube-js/cube-ui-kit/pull/592) [`dae9246`](https://github.com/cube-js/cube-ui-kit/commit/dae92466a220dba57472fb3c926e72958354e024) Thanks [@tenphi](https://github.com/tenphi)! - Add a visual gap between the field input and the message below.

## 0.53.6

### Patch Changes

- [#590](https://github.com/cube-js/cube-ui-kit/pull/590) [`07dd389`](https://github.com/cube-js/cube-ui-kit/commit/07dd389e516da7929c0c7de3af5284fb3f421cf8) Thanks [@tenphi](https://github.com/tenphi)! - Fix size prop for icons.

## 0.53.5

### Patch Changes

- [#588](https://github.com/cube-js/cube-ui-kit/pull/588) [`21c6b6a`](https://github.com/cube-js/cube-ui-kit/commit/21c6b6a10b12d56e00186f7b33d3a72056347108) Thanks [@tenphi](https://github.com/tenphi)! - Change vertical alignment of icons to sub.

- [#588](https://github.com/cube-js/cube-ui-kit/pull/588) [`21c6b6a`](https://github.com/cube-js/cube-ui-kit/commit/21c6b6a10b12d56e00186f7b33d3a72056347108) Thanks [@tenphi](https://github.com/tenphi)! - Add missing icon size tokens for header presets.

## 0.53.4

### Patch Changes

- [#586](https://github.com/cube-js/cube-ui-kit/pull/586) [`7bd4103`](https://github.com/cube-js/cube-ui-kit/commit/7bd4103bb2ce2c09ac15773bb39dc49c7e7e4e1a) Thanks [@tenphi](https://github.com/tenphi)! - Fix CopySnippet height in older safari version.

## 0.53.3

### Patch Changes

- [#584](https://github.com/cube-js/cube-ui-kit/pull/584) [`c6bd47e`](https://github.com/cube-js/cube-ui-kit/commit/c6bd47e7c13188bba749c421ed109f5db766a30f) Thanks [@tenphi](https://github.com/tenphi)! - Fix dependency issue with @internationalized/date.

## 0.53.2

### Patch Changes

- [#582](https://github.com/cube-js/cube-ui-kit/pull/582) [`8871512`](https://github.com/cube-js/cube-ui-kit/commit/887151206646607e8fdbe1659eae5690faa435fc) Thanks [@tenphi](https://github.com/tenphi)! - Add SchemeIcon and CodeIcon.

- [#582](https://github.com/cube-js/cube-ui-kit/pull/582) [`8871512`](https://github.com/cube-js/cube-ui-kit/commit/887151206646607e8fdbe1659eae5690faa435fc) Thanks [@tenphi](https://github.com/tenphi)! - Fix the bug that prevented blur and text selection inside a dialog.

## 0.53.1

### Patch Changes

- [#580](https://github.com/cube-js/cube-ui-kit/pull/580) [`ffb2dd1`](https://github.com/cube-js/cube-ui-kit/commit/ffb2dd1fd606f0c9d09d4a4e040dc47788753ccf) Thanks [@tenphi](https://github.com/tenphi)! - Set ThumbsUpIcon and ThumbsDownIcon color to currentColor.

## 0.53.0

### Minor Changes

- [#577](https://github.com/cube-js/cube-ui-kit/pull/577) [`5dbb99d`](https://github.com/cube-js/cube-ui-kit/commit/5dbb99d3a10ef931a6abd72a3801ffb78ce0edd4) Thanks [@tenphi](https://github.com/tenphi)! - Allow to pass numbers to {min/max}{Width/Height} styles.

- [#577](https://github.com/cube-js/cube-ui-kit/pull/577) [`5dbb99d`](https://github.com/cube-js/cube-ui-kit/commit/5dbb99d3a10ef931a6abd72a3801ffb78ce0edd4) Thanks [@tenphi](https://github.com/tenphi)! - Change default font color to dark-02.

### Patch Changes

- [#577](https://github.com/cube-js/cube-ui-kit/pull/577) [`5dbb99d`](https://github.com/cube-js/cube-ui-kit/commit/5dbb99d3a10ef931a6abd72a3801ffb78ce0edd4) Thanks [@tenphi](https://github.com/tenphi)! - Fix style property leakage in Panel component.

- [#577](https://github.com/cube-js/cube-ui-kit/pull/577) [`5dbb99d`](https://github.com/cube-js/cube-ui-kit/commit/5dbb99d3a10ef931a6abd72a3801ffb78ce0edd4) Thanks [@tenphi](https://github.com/tenphi)! - Fix transition aliases.

## 0.52.3

### Patch Changes

- [#575](https://github.com/cube-js/cube-ui-kit/pull/575) [`60eb4bf`](https://github.com/cube-js/cube-ui-kit/commit/60eb4bfca7541f8cf95a7ce77da5a53c55434b0e) Thanks [@tenphi](https://github.com/tenphi)! - Add PlayIcon, PauseIcon and StopIcon.

## 0.52.2

### Patch Changes

- [#573](https://github.com/cube-js/cube-ui-kit/pull/573) [`4375c19`](https://github.com/cube-js/cube-ui-kit/commit/4375c19d4ea096c24407e103470a5d02358f4e19) Thanks [@tenphi](https://github.com/tenphi)! - Fix diff calculation in PrismDiffCode.

- [#573](https://github.com/cube-js/cube-ui-kit/pull/573) [`4375c19`](https://github.com/cube-js/cube-ui-kit/commit/4375c19d4ea096c24407e103470a5d02358f4e19) Thanks [@tenphi](https://github.com/tenphi)! - Fix the bug when an empty line might appear in PrismDiffCode.

## 0.52.1

### Patch Changes

- [#571](https://github.com/cube-js/cube-ui-kit/pull/571) [`c2904de`](https://github.com/cube-js/cube-ui-kit/commit/c2904debe3310c43632515c9ec0d1913d48d16ba) Thanks [@tenphi](https://github.com/tenphi)! - Fix PrismDiffCode export.

## 0.52.0

### Minor Changes

- [#569](https://github.com/cube-js/cube-ui-kit/pull/569) [`ac2f4af`](https://github.com/cube-js/cube-ui-kit/commit/ac2f4af7457bf8d02410f8d079d90fe50aed18ac) Thanks [@tenphi](https://github.com/tenphi)! - Add support for diff in PrismCode and add a separate PrismDiffCode component that shows a diff between two strings.

## 0.51.0

### Minor Changes

- [#567](https://github.com/cube-js/cube-ui-kit/pull/567) [`c9f76f5`](https://github.com/cube-js/cube-ui-kit/commit/c9f76f5c1400dc96774ed18769ee951be4b1a687) Thanks [@tenphi](https://github.com/tenphi)! - Remove underlay from dialogs with type `panel`.

- [#567](https://github.com/cube-js/cube-ui-kit/pull/567) [`c9f76f5`](https://github.com/cube-js/cube-ui-kit/commit/c9f76f5c1400dc96774ed18769ee951be4b1a687) Thanks [@tenphi](https://github.com/tenphi)! - Add ReturnIcon component.

## 0.50.0

### Minor Changes

- [#564](https://github.com/cube-js/cube-ui-kit/pull/564) [`106f4b2`](https://github.com/cube-js/cube-ui-kit/commit/106f4b28f47783b8e258bd4bc2fb8cdd9b6a0c88) Thanks [@tenphi](https://github.com/tenphi)! - Apply form `defaultValues` change synchronously to avoid inconsistency.

## 0.49.1

### Patch Changes

- [#562](https://github.com/cube-js/cube-ui-kit/pull/562) [`381c3bd`](https://github.com/cube-js/cube-ui-kit/commit/381c3bdf5498b681a78728cca49457dd55153293) Thanks [@tenphi](https://github.com/tenphi)! - Change PrismCode default font and add selection styles.

- [#562](https://github.com/cube-js/cube-ui-kit/pull/562) [`381c3bd`](https://github.com/cube-js/cube-ui-kit/commit/381c3bdf5498b681a78728cca49457dd55153293) Thanks [@tenphi](https://github.com/tenphi)! - Improve CopySnippet formatting to clear CR symbols and remove spaces at the end of each line.

## 0.49.0

### Minor Changes

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - Rename Submit to SubmitButton.

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - Form's resetFields() method now resets errors and touched status as well.

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - Add `resetFieldsValidation()` and `setFieldError()` methods to form to replace deprecated `setFields()`.

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - Add ResetButton component.

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - Simplify API of CopySnippet and improve its design.

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - Allow to pass base styles to Alert as props.

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - Add `isInvalid` and `isValid` props to form instance. First one checks if the form has at least one field that is verified and invalid. The second one checks if ALL fields are verified and valid. Be careful: `isValid` and `!isInvalid` are not the same.

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - More flexible and easier control over disable state of Reset and Submit buttons.

### Patch Changes

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - Recalculate the sidebar position on container resize.

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - Fix pressed state in primary type Button.

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - Fix bug that prevents `onSizeChange()` callback from being fired when ResizablePanel resized beyond its constraints.

- [#560](https://github.com/cube-js/cube-ui-kit/pull/560) [`268867e`](https://github.com/cube-js/cube-ui-kit/commit/268867efd99c14161732b0bbb42b88951ac06bf7) Thanks [@tenphi](https://github.com/tenphi)! - Fix Radio.Button styles.

## 0.48.1

### Patch Changes

- [#558](https://github.com/cube-js/cube-ui-kit/pull/558) [`9dc27fe`](https://github.com/cube-js/cube-ui-kit/commit/9dc27fe943ce3891d1eac40a728562492c3c5e0b) Thanks [@tenphi](https://github.com/tenphi)! - Update border radius size for Card and CopySnippet components.

## 0.48.0

### Minor Changes

- [#556](https://github.com/cube-js/cube-ui-kit/pull/556) [`7c70da6`](https://github.com/cube-js/cube-ui-kit/commit/7c70da6469a6db3a4446ef01ce99e3f886cc4085) Thanks [@tenphi](https://github.com/tenphi)! - Change default border radius to 6px.

## 0.47.0

### Minor Changes

- [#554](https://github.com/cube-js/cube-ui-kit/pull/554) [`4c47412`](https://github.com/cube-js/cube-ui-kit/commit/4c47412d68364fc2f6f19a7df4503c6823102745) Thanks [@tenphi](https://github.com/tenphi)! - Rename IconContainer -> Icon.

## 0.46.7

### Patch Changes

- [#552](https://github.com/cube-js/cube-ui-kit/pull/552) [`2ddc0fa`](https://github.com/cube-js/cube-ui-kit/commit/2ddc0fa9205deed428bb19b56f1301a80de0e751) Thanks [@tenphi](https://github.com/tenphi)! - Optimize icon exports.

## 0.46.6

### Patch Changes

- [#550](https://github.com/cube-js/cube-ui-kit/pull/550) [`ad94f27`](https://github.com/cube-js/cube-ui-kit/commit/ad94f2740336a9b34d11337d15ced5efa28ef2d1) Thanks [@tenphi](https://github.com/tenphi)! - Add new icons: Folder, FolderFilled, FolderOpen, FolderOpenFilled, Hierarchy.

## 0.46.5

### Patch Changes

- [#548](https://github.com/cube-js/cube-ui-kit/pull/548) [`bc16ca4`](https://github.com/cube-js/cube-ui-kit/commit/bc16ca4c9284227d47fe0a418399ac9b0c50a2ed) Thanks [@tenphi](https://github.com/tenphi)! - Add ShieldIcon, ShieldFilledIcon and UserLockIcon components.

- [#547](https://github.com/cube-js/cube-ui-kit/pull/547) [`273f757`](https://github.com/cube-js/cube-ui-kit/commit/273f757b04962805bc9e4fdb903b29de6838d1ef) Thanks [@tenphi](https://github.com/tenphi)! - Fix props propagation in ResizablePanel.

## 0.46.4

### Patch Changes

- [#545](https://github.com/cube-js/cube-ui-kit/pull/545) [`8a460c3`](https://github.com/cube-js/cube-ui-kit/commit/8a460c326e1271c9fbba3b163b84142b968a440f) Thanks [@tenphi](https://github.com/tenphi)! - New drag appearance for ResizablePanel to avoid confusion with a scrollbar.

## 0.46.3

### Patch Changes

- [#543](https://github.com/cube-js/cube-ui-kit/pull/543) [`b813f22`](https://github.com/cube-js/cube-ui-kit/commit/b813f2207f3e332160a76f483dd38305d5643c47) Thanks [@tenphi](https://github.com/tenphi)! - Prevent ResizablePanel from infinite switching state loop in controllable mode.

## 0.46.2

### Patch Changes

- [#541](https://github.com/cube-js/cube-ui-kit/pull/541) [`40c6072`](https://github.com/cube-js/cube-ui-kit/commit/40c607213543557359c3fe9ee976cd42d85331ea) Thanks [@tenphi](https://github.com/tenphi)! - Smoother transition for ResizablePanel.'

- [#541](https://github.com/cube-js/cube-ui-kit/pull/541) [`40c6072`](https://github.com/cube-js/cube-ui-kit/commit/40c607213543557359c3fe9ee976cd42d85331ea) Thanks [@tenphi](https://github.com/tenphi)! - Round the output size style in ResizablePanel.

## 0.46.1

### Patch Changes

- [#538](https://github.com/cube-js/cube-ui-kit/pull/538) [`7ba6e5e`](https://github.com/cube-js/cube-ui-kit/commit/7ba6e5e5066ceaae6f119eb6dab0264ae3e74ad2) Thanks [@tenphi](https://github.com/tenphi)! - Stabilize ResizablePanel & remove requirement for the flex layout.

## 0.46.0

### Minor Changes

- [#536](https://github.com/cube-js/cube-ui-kit/pull/536) [`b10e55e`](https://github.com/cube-js/cube-ui-kit/commit/b10e55ee6adca81763280f5a72dde7c2e4ad1534) Thanks [@tenphi](https://github.com/tenphi)! - Add Panel component.

- [#536](https://github.com/cube-js/cube-ui-kit/pull/536) [`b10e55e`](https://github.com/cube-js/cube-ui-kit/commit/b10e55ee6adca81763280f5a72dde7c2e4ad1534) Thanks [@tenphi](https://github.com/tenphi)! - Add ResizablePanel component.

## 0.45.0

### Minor Changes

- [#533](https://github.com/cube-js/cube-ui-kit/pull/533) [`e6246bd`](https://github.com/cube-js/cube-ui-kit/commit/e6246bd8fdefa98bf37ec5f23c88435c60d33fe8) Thanks [@tenphi](https://github.com/tenphi)! - Fix for Combobox input inside Form.

## 0.44.0

### Minor Changes

- [#529](https://github.com/cube-js/cube-ui-kit/pull/529) [`dfc6298`](https://github.com/cube-js/cube-ui-kit/commit/dfc62981a1940d5053222228347617e4e60588ba) Thanks [@tenphi](https://github.com/tenphi)! - Add support for more complex selectors in mods.

- [#529](https://github.com/cube-js/cube-ui-kit/pull/529) [`dfc6298`](https://github.com/cube-js/cube-ui-kit/commit/dfc62981a1940d5053222228347617e4e60588ba) Thanks [@tenphi](https://github.com/tenphi)! - Improve typings and add support for the most html attributes and event handlers.

### Patch Changes

- [#529](https://github.com/cube-js/cube-ui-kit/pull/529) [`dfc6298`](https://github.com/cube-js/cube-ui-kit/commit/dfc62981a1940d5053222228347617e4e60588ba) Thanks [@tenphi](https://github.com/tenphi)! - Futher improvement of typings.

## 0.43.0

### Minor Changes

- [#527](https://github.com/cube-js/cube-ui-kit/pull/527) [`3aad044`](https://github.com/cube-js/cube-ui-kit/commit/3aad044eef077b19a82f2422f2e929ee2358aee3) Thanks [@tenphi](https://github.com/tenphi)! - Do not create field instance for non-exist fields in Form. Use default values from Form when creating new fields.

### Patch Changes

- [#527](https://github.com/cube-js/cube-ui-kit/pull/527) [`3aad044`](https://github.com/cube-js/cube-ui-kit/commit/3aad044eef077b19a82f2422f2e929ee2358aee3) Thanks [@tenphi](https://github.com/tenphi)! - Add input trimming and keyboard interaction for TextInputMapper.

- [#527](https://github.com/cube-js/cube-ui-kit/pull/527) [`3aad044`](https://github.com/cube-js/cube-ui-kit/commit/3aad044eef077b19a82f2422f2e929ee2358aee3) Thanks [@tenphi](https://github.com/tenphi)! - Add support for all html attributes in basic components.

## 0.42.1

### Patch Changes

- [#525](https://github.com/cube-js/cube-ui-kit/pull/525) [`4846f53`](https://github.com/cube-js/cube-ui-kit/commit/4846f53906f3054b9699efa6a2e45c5479fdbb45) Thanks [@tenphi](https://github.com/tenphi)! - Improve TextInputMapper styles inside Form.'

## 0.42.0

### Minor Changes

- [#523](https://github.com/cube-js/cube-ui-kit/pull/523) [`e684da6`](https://github.com/cube-js/cube-ui-kit/commit/e684da698ab6ac28ba97daab0d69ce4c47fab8b3) Thanks [@tenphi](https://github.com/tenphi)! - Add support for object values in Form.

- [#523](https://github.com/cube-js/cube-ui-kit/pull/523) [`e684da6`](https://github.com/cube-js/cube-ui-kit/commit/e684da698ab6ac28ba97daab0d69ce4c47fab8b3) Thanks [@tenphi](https://github.com/tenphi)! - Add TextInputMapper component.

## 0.41.3

### Patch Changes

- [#521](https://github.com/cube-js/cube-ui-kit/pull/521) [`6f6737f`](https://github.com/cube-js/cube-ui-kit/commit/6f6737fde7ce84ba1c0d4641ffe1623070cf66fd) Thanks [@tenphi](https://github.com/tenphi)! - Remove trailing space in CopySnippet.

## 0.41.2

### Patch Changes

- [#519](https://github.com/cube-js/cube-ui-kit/pull/519) [`b7505ee`](https://github.com/cube-js/cube-ui-kit/commit/b7505ee615ed36c73eb5f5d04890f90590ae2578) Thanks [@tenphi](https://github.com/tenphi)! - Add UserIcon and UserGroupIcon.

## 0.41.1

### Patch Changes

- [#517](https://github.com/cube-js/cube-ui-kit/pull/517) [`6e17c77`](https://github.com/cube-js/cube-ui-kit/commit/6e17c77b94ab81c3b1aef9da071d6623f9d83057) Thanks [@tenphi](https://github.com/tenphi)! - Fix version declaration.

- [#517](https://github.com/cube-js/cube-ui-kit/pull/517) [`6e17c77`](https://github.com/cube-js/cube-ui-kit/commit/6e17c77b94ab81c3b1aef9da071d6623f9d83057) Thanks [@tenphi](https://github.com/tenphi)! - Fix warning about incorrectly rendered component in SliderBase.

- [#517](https://github.com/cube-js/cube-ui-kit/pull/517) [`6e17c77`](https://github.com/cube-js/cube-ui-kit/commit/6e17c77b94ab81c3b1aef9da071d6623f9d83057) Thanks [@tenphi](https://github.com/tenphi)! - Correctly pass focusWithinProps in Slider.

- [#517](https://github.com/cube-js/cube-ui-kit/pull/517) [`6e17c77`](https://github.com/cube-js/cube-ui-kit/commit/6e17c77b94ab81c3b1aef9da071d6623f9d83057) Thanks [@tenphi](https://github.com/tenphi)! - Do not pass invalid isDisabled prop in Action.

## 0.41.0

### Minor Changes

- [#515](https://github.com/cube-js/cube-ui-kit/pull/515) [`79ae983`](https://github.com/cube-js/cube-ui-kit/commit/79ae9839878232e4654441fe8ffb986a79189ccc) Thanks [@tenphi](https://github.com/tenphi)! - Declare uikit version globally.

## 0.40.0

### Minor Changes

- [#511](https://github.com/cube-js/cube-ui-kit/pull/511) [`384b41a`](https://github.com/cube-js/cube-ui-kit/commit/384b41a087d2965bbd4dc815c73435ed357ca576) Thanks [@tenphi](https://github.com/tenphi)! - Add field support for FileInput.

- [#511](https://github.com/cube-js/cube-ui-kit/pull/511) [`384b41a`](https://github.com/cube-js/cube-ui-kit/commit/384b41a087d2965bbd4dc815c73435ed357ca576) Thanks [@tenphi](https://github.com/tenphi)! - Remove @react-types typings and rely solely on react-aria package.

### Patch Changes

- [#511](https://github.com/cube-js/cube-ui-kit/pull/511) [`384b41a`](https://github.com/cube-js/cube-ui-kit/commit/384b41a087d2965bbd4dc815c73435ed357ca576) Thanks [@tenphi](https://github.com/tenphi)! - Add isTouched flag to Form.

- [#511](https://github.com/cube-js/cube-ui-kit/pull/511) [`384b41a`](https://github.com/cube-js/cube-ui-kit/commit/384b41a087d2965bbd4dc815c73435ed357ca576) Thanks [@tenphi](https://github.com/tenphi)! - Support "accept" attribute in FileInput component.

- [#511](https://github.com/cube-js/cube-ui-kit/pull/511) [`384b41a`](https://github.com/cube-js/cube-ui-kit/commit/384b41a087d2965bbd4dc815c73435ed357ca576) Thanks [@tenphi](https://github.com/tenphi)! - Reinitialize Field on name change.

## 0.39.1

### Patch Changes

- [#512](https://github.com/cube-js/cube-ui-kit/pull/512) [`0a1d52e`](https://github.com/cube-js/cube-ui-kit/commit/0a1d52ef8249e892a6b242bbcc2a586e20718315) Thanks [@tenphi](https://github.com/tenphi)! - Add UnlockIcon.

## 0.39.0

### Minor Changes

- [#425](https://github.com/cube-js/cube-ui-kit/pull/425) [`d31976e`](https://github.com/cube-js/cube-ui-kit/commit/d31976eccdfba4517057c699bbc921a00b02d9c5) Thanks [@tenphi](https://github.com/tenphi)! - Add casting property to Field component to cast Field value to different type that input allows

## 0.38.0

### Minor Changes

- [#507](https://github.com/cube-js/cube-ui-kit/pull/507) [`c2b126e`](https://github.com/cube-js/cube-ui-kit/commit/c2b126e3b6d9e46a75025c334066f777acd8106c) Thanks [@tenphi](https://github.com/tenphi)! - Change MenuItem API to support isDisabled and onAction props.

### Patch Changes

- [#507](https://github.com/cube-js/cube-ui-kit/pull/507) [`c2b126e`](https://github.com/cube-js/cube-ui-kit/commit/c2b126e3b6d9e46a75025c334066f777acd8106c) Thanks [@tenphi](https://github.com/tenphi)! - Fix unresponsive Menu Item on tap to click.

## 0.37.5

### Patch Changes

- [#504](https://github.com/cube-js/cube-ui-kit/pull/504) [`b83122e`](https://github.com/cube-js/cube-ui-kit/commit/b83122e01f9cc1ff1febf4eaa451044106b8c202) Thanks [@tenphi](https://github.com/tenphi)! - Add support for dark schema for Underlay.

- [#504](https://github.com/cube-js/cube-ui-kit/pull/504) [`b83122e`](https://github.com/cube-js/cube-ui-kit/commit/b83122e01f9cc1ff1febf4eaa451044106b8c202) Thanks [@tenphi](https://github.com/tenphi)! - Fix FileTabs Pane max size.

- [#504](https://github.com/cube-js/cube-ui-kit/pull/504) [`b83122e`](https://github.com/cube-js/cube-ui-kit/commit/b83122e01f9cc1ff1febf4eaa451044106b8c202) Thanks [@tenphi](https://github.com/tenphi)! - Fix typings for SearchInput to support onSubmit and onClear callbacks.

## 0.37.4

### Patch Changes

- [#501](https://github.com/cube-js/cube-ui-kit/pull/501) [`90cfd16`](https://github.com/cube-js/cube-ui-kit/commit/90cfd1601924f49f5393d8a712ad10e5dba5f6fc) Thanks [@tenphi](https://github.com/tenphi)! - Add CalendarEditIcon

## 0.37.3

### Patch Changes

- [#498](https://github.com/cube-js/cube-ui-kit/pull/498) [`77e7ab7`](https://github.com/cube-js/cube-ui-kit/commit/77e7ab77c2797e1f5f986e0e6b40c760689eb25c) Thanks [@tenphi](https://github.com/tenphi)! - Pass `qa` prop for fields.

## 0.37.2

### Patch Changes

- [#495](https://github.com/cube-js/cube-ui-kit/pull/495) [`743d5fa`](https://github.com/cube-js/cube-ui-kit/commit/743d5fa8b242bd60acd55d94d3d01450bd7bcbfb) Thanks [@tenphi](https://github.com/tenphi)! - Add StatsIcon.

## 0.37.1

### Patch Changes

- [#492](https://github.com/cube-js/cube-ui-kit/pull/492) [`84002df`](https://github.com/cube-js/cube-ui-kit/commit/84002df9f8bbbacd48e4cac51ae568749f8781e9) Thanks [@tenphi](https://github.com/tenphi)! - Support multiple directions in fade style.

## 0.37.0

### Minor Changes

- [#487](https://github.com/cube-js/cube-ui-kit/pull/487) [`07350da`](https://github.com/cube-js/cube-ui-kit/commit/07350da1032b59659b6d207548ad23eb2c4d0bbe) Thanks [@tenphi](https://github.com/tenphi)! - Add lots of new icons.

## 0.36.0

### Minor Changes

- [#485](https://github.com/cube-js/cube-ui-kit/pull/485) [`8104857`](https://github.com/cube-js/cube-ui-kit/commit/8104857cc27223977fc35ca324341ed342e1aa0b) Thanks [@tenphi](https://github.com/tenphi)! - Add `fade` and `inset` styles.

### Patch Changes

- [#485](https://github.com/cube-js/cube-ui-kit/pull/485) [`8104857`](https://github.com/cube-js/cube-ui-kit/commit/8104857cc27223977fc35ca324341ed342e1aa0b) Thanks [@tenphi](https://github.com/tenphi)! - Add `position` style to `position` style list.

## 0.35.10

### Patch Changes

- [#483](https://github.com/cube-js/cube-ui-kit/pull/483) [`e8e9a7e`](https://github.com/cube-js/cube-ui-kit/commit/e8e9a7e4ba43261f5a562932a404f719d9e2a41b) Thanks [@tenphi](https://github.com/tenphi)! - Export ProviderProps type.

## 0.35.9

### Patch Changes

- [#481](https://github.com/cube-js/cube-ui-kit/pull/481) [`c02d7ea`](https://github.com/cube-js/cube-ui-kit/commit/c02d7eaf05714e9afd64705ead4cb8f775c1aecc) Thanks [@tenphi](https://github.com/tenphi)! - Fix RadioButton layout flow.

## 0.35.8

### Patch Changes

- [#479](https://github.com/cube-js/cube-ui-kit/pull/479) [`f31f3cc`](https://github.com/cube-js/cube-ui-kit/commit/f31f3cce82304389efc22c8c6f99d81c8acc9e91) Thanks [@tenphi](https://github.com/tenphi)! - Export useProviderProps and UIKitContext.

- [#479](https://github.com/cube-js/cube-ui-kit/pull/479) [`f31f3cc`](https://github.com/cube-js/cube-ui-kit/commit/f31f3cce82304389efc22c8c6f99d81c8acc9e91) Thanks [@tenphi](https://github.com/tenphi)! - Improve styles for Radio.Button

- [#479](https://github.com/cube-js/cube-ui-kit/pull/479) [`f31f3cc`](https://github.com/cube-js/cube-ui-kit/commit/f31f3cce82304389efc22c8c6f99d81c8acc9e91) Thanks [@tenphi](https://github.com/tenphi)! - Export useProviderProps hook.

## 0.35.7

### Patch Changes

- [#476](https://github.com/cube-js/cube-ui-kit/pull/476) [`5bf114c`](https://github.com/cube-js/cube-ui-kit/commit/5bf114c636f380e4ac17b1472197e0409b09d2ed) Thanks [@tenphi](https://github.com/tenphi)! - Export useProviderProps hook.

## 0.35.6

### Patch Changes

- [#474](https://github.com/cube-js/cube-ui-kit/pull/474) [`827ca5b`](https://github.com/cube-js/cube-ui-kit/commit/827ca5b111e0def5546252a211b106ca7f3f6d95) Thanks [@tenphi](https://github.com/tenphi)! - Add StringIcon component.

## 0.35.5

### Patch Changes

- [#472](https://github.com/cube-js/cube-ui-kit/pull/472) [`70782a2`](https://github.com/cube-js/cube-ui-kit/commit/70782a2310e51cee946232c3c39dd06add9ffeac) Thanks [@tenphi](https://github.com/tenphi)! - Add Sparkles icon.

## 0.35.4

### Patch Changes

- [#470](https://github.com/cube-js/cube-ui-kit/pull/470) [`66a69c7`](https://github.com/cube-js/cube-ui-kit/commit/66a69c7ced6cada44cc76344749c66ceb37ba691) Thanks [@tenphi](https://github.com/tenphi)! - Add ThumbsUp and ThumbsDown icons.

## 0.35.3

### Patch Changes

- [#468](https://github.com/cube-js/cube-ui-kit/pull/468) [`2bd3b1d`](https://github.com/cube-js/cube-ui-kit/commit/2bd3b1d383c83f65be411dcf445cbce712fe11c9) Thanks [@tenphi](https://github.com/tenphi)! - Fix Root component so it can accept style object.'

## 0.35.2

### Patch Changes

- [#465](https://github.com/cube-js/cube-ui-kit/pull/465) [`3597635`](https://github.com/cube-js/cube-ui-kit/commit/3597635b770a57be18f8388fab07251cec5c227a) Thanks [@tenphi](https://github.com/tenphi)! - Fix passing breakpoints property to the Root component.

- [#463](https://github.com/cube-js/cube-ui-kit/pull/463) [`bc3acb1`](https://github.com/cube-js/cube-ui-kit/commit/bc3acb147966e8bbaf2b8b3f3325cd423a11cd9d) Thanks [@tenphi](https://github.com/tenphi)! - Change icon container inner placement to center. Suitable for icons that are smaller than default size.

- [#463](https://github.com/cube-js/cube-ui-kit/pull/463) [`bc3acb1`](https://github.com/cube-js/cube-ui-kit/commit/bc3acb147966e8bbaf2b8b3f3325cd423a11cd9d) Thanks [@tenphi](https://github.com/tenphi)! - Fix passing styles from DialogTrigger to Popver component.

## 0.35.1

### Patch Changes

- [#461](https://github.com/cube-js/cube-ui-kit/pull/461) [`820de13`](https://github.com/cube-js/cube-ui-kit/commit/820de130bbd27077b3067496e2d21602dcdfd847) Thanks [@tenphi](https://github.com/tenphi)! - Add SlashIcon.

## 0.35.0

### Minor Changes

- [#460](https://github.com/cube-js/cube-ui-kit/pull/460) [`de511ca`](https://github.com/cube-js/cube-ui-kit/commit/de511ca4e83fdd659888e8c7e058b293774ef45e) Thanks [@tenphi](https://github.com/tenphi)! - Add even more icons.

### Patch Changes

- [#460](https://github.com/cube-js/cube-ui-kit/pull/460) [`de511ca`](https://github.com/cube-js/cube-ui-kit/commit/de511ca4e83fdd659888e8c7e058b293774ef45e) Thanks [@tenphi](https://github.com/tenphi)! - Allow icons to fill all available vertical space in complex layouts.

- [#458](https://github.com/cube-js/cube-ui-kit/pull/458) [`4740e98`](https://github.com/cube-js/cube-ui-kit/commit/4740e987ab71ce20ee7d2a4a6affd15c0f117e0b) Thanks [@tenphi](https://github.com/tenphi)! - Export wrapIcon helper.

## 0.34.0

### Minor Changes

- [#456](https://github.com/cube-js/cube-ui-kit/pull/456) [`6371914`](https://github.com/cube-js/cube-ui-kit/commit/6371914e3a03f55b1ff57f1db715480cec5c6970) Thanks [@tenphi](https://github.com/tenphi)! - Add a new set icons.

## 0.33.4

### Patch Changes

- [#453](https://github.com/cube-js/cube-ui-kit/pull/453) [`cc85ee4`](https://github.com/cube-js/cube-ui-kit/commit/cc85ee4c5c1dc032526cfa178ca9b0b9b8c979b7) Thanks [@tenphi](https://github.com/tenphi)! - Use smaller horizontal paddings buttons.

- [#455](https://github.com/cube-js/cube-ui-kit/pull/455) [`d72f96c`](https://github.com/cube-js/cube-ui-kit/commit/d72f96c7086dca45499fe8b8e96f40740effb017) Thanks [@tenphi](https://github.com/tenphi)! - Set default gap inside Button layout to 6px instead of 8px.

- [#453](https://github.com/cube-js/cube-ui-kit/pull/453) [`cc85ee4`](https://github.com/cube-js/cube-ui-kit/commit/cc85ee4c5c1dc032526cfa178ca9b0b9b8c979b7) Thanks [@tenphi](https://github.com/tenphi)! - Use --icon-size property as the default size for the icon set.

## 0.33.3

### Patch Changes

- [#450](https://github.com/cube-js/cube-ui-kit/pull/450) [`70ada53`](https://github.com/cube-js/cube-ui-kit/commit/70ada5326791bf73c16f3fa137fac720eef7cde3) Thanks [@tenphi](https://github.com/tenphi)! - Support `download` attribute in Button and Link components.

- [#451](https://github.com/cube-js/cube-ui-kit/pull/451) [`889660f`](https://github.com/cube-js/cube-ui-kit/commit/889660f2cb4f084ea93d6157456a7046af46ebc0) Thanks [@tenphi](https://github.com/tenphi)! - Fix styled scrollbar styles to return background.

- [#451](https://github.com/cube-js/cube-ui-kit/pull/451) [`889660f`](https://github.com/cube-js/cube-ui-kit/commit/889660f2cb4f084ea93d6157456a7046af46ebc0) Thanks [@tenphi](https://github.com/tenphi)! - Add typings for outer style props in the Radio component.

## 0.33.2

### Patch Changes

- [#448](https://github.com/cube-js/cube-ui-kit/pull/448) [`9d60269`](https://github.com/cube-js/cube-ui-kit/commit/9d60269d6bfc33c6953eef5ad5d2e591ba7aae89) Thanks [@tenphi](https://github.com/tenphi)! - Add aria-hidden to all icons.

- [#448](https://github.com/cube-js/cube-ui-kit/pull/448) [`9d60269`](https://github.com/cube-js/cube-ui-kit/commit/9d60269d6bfc33c6953eef5ad5d2e591ba7aae89) Thanks [@tenphi](https://github.com/tenphi)! - Make all icons spans and change layout to inline-grid.

## 0.33.1

### Patch Changes

- [#445](https://github.com/cube-js/cube-ui-kit/pull/445) [`0b7f5fe`](https://github.com/cube-js/cube-ui-kit/commit/0b7f5fe6e8f6f7b5eed152223205cf54a75c948f) Thanks [@tenphi](https://github.com/tenphi)! - Fix LockIcon component.

## 0.33.0

### Minor Changes

- [#442](https://github.com/cube-js/cube-ui-kit/pull/442) [`d887177`](https://github.com/cube-js/cube-ui-kit/commit/d887177d0684fd994e92b1638ed5b7f1f3e95bae) Thanks [@tenphi](https://github.com/tenphi)! - Add icon set. Import icons like components: `CloseIcon`, `PlusIcon`, etc.

- [#443](https://github.com/cube-js/cube-ui-kit/pull/443) [`c2701c2`](https://github.com/cube-js/cube-ui-kit/commit/c2701c2e8dfc9ee073501bb99ffe100149b9f32e) Thanks [@tenphi](https://github.com/tenphi)! - Fix tip position for Tooltip component in right/left placement.

## 0.32.0

### Minor Changes

- [#440](https://github.com/cube-js/cube-ui-kit/pull/440) [`853e3e2`](https://github.com/cube-js/cube-ui-kit/commit/853e3e2692b1bd5adb158f825e4f816df1758548) Thanks [@tenphi](https://github.com/tenphi)! - Add full React 18 support. UI Kit now requires React 18 to run.

## 0.31.2

### Patch Changes

- [#437](https://github.com/cube-js/cube-ui-kit/pull/437) [`5411b86`](https://github.com/cube-js/cube-ui-kit/commit/5411b86a40139bbb68cee322ef3642a3e96486c5) Thanks [@ovr](https://github.com/ovr)! - fix(deps): Make storybook as dev dependencies

## 0.31.1

### Patch Changes

- [#435](https://github.com/cube-js/cube-ui-kit/pull/435) [`902c1f9`](https://github.com/cube-js/cube-ui-kit/commit/902c1f9fdf393fbacc851247c122ea714f674f59) Thanks [@tenphi](https://github.com/tenphi)! - Add correct type exports to the published package.

## 0.31.0

### Minor Changes

- [#432](https://github.com/cube-js/cube-ui-kit/pull/432) [`46b8354`](https://github.com/cube-js/cube-ui-kit/commit/46b8354457c24807e0920993be4ff1e445aeb86c) Thanks [@tenphi](https://github.com/tenphi)! - Add license field to the published package.json

## 0.30.1

### Patch Changes

- [#428](https://github.com/cube-js/cube-ui-kit/pull/428) [`95c56f7`](https://github.com/cube-js/cube-ui-kit/commit/95c56f7877140eef58014c12d2824d9fa0c69355) Thanks [@tenphi](https://github.com/tenphi)! - Add `isStatic` property to active static mode without animation in Placeholder and Skeleton components.

## 0.30.0

### Minor Changes

- [#426](https://github.com/cube-js/cube-ui-kit/pull/426) [`b20cb7f`](https://github.com/cube-js/cube-ui-kit/commit/b20cb7f91c07a933e524477b274a96ac144985cf) Thanks [@tenphi](https://github.com/tenphi)! - Add support for `styled-components` v6.

## 0.29.1

### Patch Changes

- [#423](https://github.com/cube-js/cube-ui-kit/pull/423) [`d40fc1f`](https://github.com/cube-js/cube-ui-kit/commit/d40fc1f290d54935382b55017d4de5cc5977cbf7) Thanks [@tenphi](https://github.com/tenphi)! - Add a compact view for the Result component

## 0.29.0

### Minor Changes

- [#421](https://github.com/cube-js/cube-ui-kit/pull/421) [`c6ce743`](https://github.com/cube-js/cube-ui-kit/commit/c6ce743fab1db7d0daeb9bd017e1338b8cdd565a) Thanks [@tenphi](https://github.com/tenphi)! - Added new DateRangeSeparatedPicker component for better UX while selecting date ranges

## 0.28.0

### Minor Changes

- [#419](https://github.com/cube-js/cube-ui-kit/pull/419) [`910a8d4`](https://github.com/cube-js/cube-ui-kit/commit/910a8d424330c38941b0a86585c13baffc1016f4) Thanks [@tenphi](https://github.com/tenphi)! - Migration to the combined `react-aria` and `react-stately` packages.

### Patch Changes

- [#413](https://github.com/cube-js/cube-ui-kit/pull/413) [`76d9fd7`](https://github.com/cube-js/cube-ui-kit/commit/76d9fd70b51efa7108456df2611d981e5a2a22b4) Thanks [@tenphi](https://github.com/tenphi)! - Fix Field label sizing.

## 0.27.2

### Patch Changes

- [#414](https://github.com/cube-js/cube-ui-kit/pull/414) [`ec4f294`](https://github.com/cube-js/cube-ui-kit/commit/ec4f294c6fa8e264f69188e2a9fdaf012db99c62) Thanks [@tenphi](https://github.com/tenphi)! - Disable text wrapping inside Menu elements.

## 0.27.1

### Patch Changes

- [#410](https://github.com/cube-js/cube-ui-kit/pull/410) [`f4c958a`](https://github.com/cube-js/cube-ui-kit/commit/f4c958a0fd625ba651d4d6bcfea933afbd95571b) Thanks [@tenphi](https://github.com/tenphi)! - Fixes border colors in the hover state for solid Radio Buttons.

## 0.27.0

### Minor Changes

- [#409](https://github.com/cube-js/cube-ui-kit/pull/409) [`9289732`](https://github.com/cube-js/cube-ui-kit/commit/928973274ee6f748b3475ab3adb29dc1d43552cf) Thanks [@tenphi](https://github.com/tenphi)! - Add support for initial value properties for fields that are linked to a form.

### Patch Changes

- [#407](https://github.com/cube-js/cube-ui-kit/pull/407) [`886e521`](https://github.com/cube-js/cube-ui-kit/commit/886e52195d8db6f8fa3fea514e6921d333770dc5) Thanks [@tenphi](https://github.com/tenphi)! - Fix "for" attribute in field labels.

- [#407](https://github.com/cube-js/cube-ui-kit/pull/407) [`886e521`](https://github.com/cube-js/cube-ui-kit/commit/886e52195d8db6f8fa3fea514e6921d333770dc5) Thanks [@tenphi](https://github.com/tenphi)! - Show warning if a field is linked to a form but default value is provided. And in case when a field is unlinked but validation rules are provided.'

## 0.26.4

### Patch Changes

- [#405](https://github.com/cube-js/cube-ui-kit/pull/405) [`9201d17`](https://github.com/cube-js/cube-ui-kit/commit/9201d17faffdfdba10783d8a6717a96fed6db68e) Thanks [@tenphi](https://github.com/tenphi)! - Return name attribute of input element in Radio component.

## 0.26.3

### Patch Changes

- [#402](https://github.com/cube-js/cube-ui-kit/pull/402) [`a9674c2`](https://github.com/cube-js/cube-ui-kit/commit/a9674c26de7f36aab137cc086d590d5bf06836a6) Thanks [@tenphi](https://github.com/tenphi)! - Add ability to customize mods for the Badge component.

## 0.26.2

### Patch Changes

- [#400](https://github.com/cube-js/cube-ui-kit/pull/400) [`fcb2b6d`](https://github.com/cube-js/cube-ui-kit/commit/fcb2b6db7fcc307b9dfac4f451f4909c21f2d5f6) Thanks [@tenphi](https://github.com/tenphi)! - Change field tooltip color to `#purple-text`.

## 0.26.1

### Patch Changes

- [#397](https://github.com/cube-js/cube-ui-kit/pull/397) [`4fb9227`](https://github.com/cube-js/cube-ui-kit/commit/4fb9227634f74a03898d5ddc62e8a11eb00cb9e6) Thanks [@tenphi](https://github.com/tenphi)! - Improve focus ring behaviour on DatePicker and DateRangePicker.

- [#399](https://github.com/cube-js/cube-ui-kit/pull/399) [`67b8af3`](https://github.com/cube-js/cube-ui-kit/commit/67b8af384a8a4b0c4272fff9dcdc8977b4b868c8) Thanks [@tenphi](https://github.com/tenphi)! - Increase `zIndex` style for Modals.

## 0.26.0

### Minor Changes

- [#395](https://github.com/cube-js/cube-ui-kit/pull/395) [`e6c5f09`](https://github.com/cube-js/cube-ui-kit/commit/e6c5f0944aee83b471aa8106c714da04a22b0afb) Thanks [@tenphi](https://github.com/tenphi)! - Use standard date format for all date inputs.

## 0.25.0

### Minor Changes

- [#393](https://github.com/cube-js/cube-ui-kit/pull/393) [`bff7e10`](https://github.com/cube-js/cube-ui-kit/commit/bff7e10ad2d2076c9d4dd15019a8b27387271365) Thanks [@tenphi](https://github.com/tenphi)! - Add solid type of radio button group.

### Patch Changes

- [#393](https://github.com/cube-js/cube-ui-kit/pull/393) [`bff7e10`](https://github.com/cube-js/cube-ui-kit/commit/bff7e10ad2d2076c9d4dd15019a8b27387271365) Thanks [@tenphi](https://github.com/tenphi)! - Share mods between Radio wrapper and the input elements. So now you can change styles of wrapper depending on checked state

## 0.24.4

### Patch Changes

- [#389](https://github.com/cube-js/cube-ui-kit/pull/389) [`b60f790`](https://github.com/cube-js/cube-ui-kit/commit/b60f790a0e4590ddc22a6afda4c6382fea426b7e) Thanks [@tenphi](https://github.com/tenphi)! - Move Vite and some storybook addons to dev dependencies.

- [#390](https://github.com/cube-js/cube-ui-kit/pull/390) [`e0c0fc1`](https://github.com/cube-js/cube-ui-kit/commit/e0c0fc190b3509b21c4002e4d92ca4f0aee677e0) Thanks [@tenphi](https://github.com/tenphi)! - Do not wrap text inside Radio.Group

## 0.24.3

### Patch Changes

- [#387](https://github.com/cube-js/cube-ui-kit/pull/387) [`446801f`](https://github.com/cube-js/cube-ui-kit/commit/446801f9be024b61f0c31709d5d4874b855a59b4) Thanks [@tenphi](https://github.com/tenphi)! - Fix `kbd` tag text color style.

## 0.24.2

### Patch Changes

- [#385](https://github.com/cube-js/cube-ui-kit/pull/385) [`b85b0b2`](https://github.com/cube-js/cube-ui-kit/commit/b85b0b260c035dddca39cade68e8875e65095336) Thanks [@tenphi](https://github.com/tenphi)! - Fix styles for the CopyPasteBlock component.

## 0.24.1

### Patch Changes

- [#382](https://github.com/cube-js/cube-ui-kit/pull/382) [`eec5e0e`](https://github.com/cube-js/cube-ui-kit/commit/eec5e0e534f195ec8a3fb47775d1af0bcd8f2aeb) Thanks [@tenphi](https://github.com/tenphi)! - Add `size` property and position style properties for the CopyPasteBlock component.

## 0.24.0

### Minor Changes

- [#380](https://github.com/cube-js/cube-ui-kit/pull/380) [`ca81a3a`](https://github.com/cube-js/cube-ui-kit/commit/ca81a3af4f91e53abd07dfcb133169d5c095c083) Thanks [@tenphi](https://github.com/tenphi)! - Add CopyPasteBlock component

## 0.23.2

### Patch Changes

- [#377](https://github.com/cube-js/cube-ui-kit/pull/377) [`ad00f76`](https://github.com/cube-js/cube-ui-kit/commit/ad00f762d8f3d8a5270afbfd815a3d0518c80b68) Thanks [@tenphi](https://github.com/tenphi)! - Remove label duplicates passed via the `children` property from Checkbox and Switch components.

## 0.23.1

### Patch Changes

- [#375](https://github.com/cube-js/cube-ui-kit/pull/375) [`28ca840`](https://github.com/cube-js/cube-ui-kit/commit/28ca8401c31396f8a08e3ae4cdb95ccf6ac91dba) Thanks [@tenphi](https://github.com/tenphi)! - Fix popover position of DatePicker and DateRangePicker

## 0.23.0

### Minor Changes

- [#373](https://github.com/cube-js/cube-ui-kit/pull/373) [`a204af6`](https://github.com/cube-js/cube-ui-kit/commit/a204af648b411b79a151e69f255045918b968ffc) Thanks [@tenphi](https://github.com/tenphi)! - Add date & time inputs: DateInput, TimeInput, DatePicker, DateRangePicker.
  Change default transition time from 120ms to 80ms.

## 0.22.8

### Patch Changes

- [#371](https://github.com/cube-js/cube-ui-kit/pull/371) [`2b2e45d`](https://github.com/cube-js/cube-ui-kit/commit/2b2e45d1d1e6b1b1e777b67050fa61dd644591af) Thanks [@tenphi](https://github.com/tenphi)! - Bundle styles that disable overflow behavior.

## 0.22.7

### Patch Changes

- [#369](https://github.com/cube-js/cube-ui-kit/pull/369) [`3d702c9`](https://github.com/cube-js/cube-ui-kit/commit/3d702c9d58b66e9871d129270e49bb278b46c64c) Thanks [@tenphi](https://github.com/tenphi)! - Fix DialogTrigger's `type` prop typing.

## 0.22.6

### Patch Changes

- [#367](https://github.com/cube-js/cube-ui-kit/pull/367) [`611336d`](https://github.com/cube-js/cube-ui-kit/commit/611336d07acb5ad1dd436b9384135f119e40b30c) Thanks [@tenphi](https://github.com/tenphi)! - Allow scrolling inside the Menu component.

## 0.22.5

### Patch Changes

- [#359](https://github.com/cube-js/cube-ui-kit/pull/359) [`2a07328`](https://github.com/cube-js/cube-ui-kit/commit/2a0732876c2352831acdd52f8f5f7097ff6f1244) Thanks [@tenphi](https://github.com/tenphi)! - Fix the `inputRef` prop in the NumberInput component.

- [#361](https://github.com/cube-js/cube-ui-kit/pull/361) [`3759837`](https://github.com/cube-js/cube-ui-kit/commit/3759837dd49283a285aa87ee58d31e3dc477fb21) Thanks [@tenphi](https://github.com/tenphi)! - Remove transform in the base state for all modal components. That fixes `fixed` positioning inside.

## 0.22.4

### Patch Changes

- [#357](https://github.com/cube-js/cube-ui-kit/pull/357) [`4f5f4d6`](https://github.com/cube-js/cube-ui-kit/commit/4f5f4d660fa2955b19f1333932caeff5e13dd3c4) Thanks [@tenphi](https://github.com/tenphi)! - Fix suffix support in NumberInput.

## 0.22.3

### Patch Changes

- [#355](https://github.com/cube-js/cube-ui-kit/pull/355) [`20387c7`](https://github.com/cube-js/cube-ui-kit/commit/20387c752f36c1923b6dac806160ffd055ecc696) Thanks [@tenphi](https://github.com/tenphi)! - Avoid creating form fields with empty names.

## 0.22.2

### Patch Changes

- [#352](https://github.com/cube-js/cube-ui-kit/pull/352) [`f302128`](https://github.com/cube-js/cube-ui-kit/commit/f3021284abc7b2c7e3d5a0523737adf4c19a96bf) Thanks [@tenphi](https://github.com/tenphi)! - Add element attribute for loading icon in the Button component to fix styling.

## 0.22.1

### Patch Changes

- [#350](https://github.com/cube-js/cube-ui-kit/pull/350) [`53ea3fe`](https://github.com/cube-js/cube-ui-kit/commit/53ea3feddd0afc5ead0b14c5847dcf2daa594a8d) Thanks [@tenphi](https://github.com/tenphi)! - Add `showValid` prop to Form and Field component. If `true` the field shows its valid status.

- [#350](https://github.com/cube-js/cube-ui-kit/pull/350) [`53ea3fe`](https://github.com/cube-js/cube-ui-kit/commit/53ea3feddd0afc5ead0b14c5847dcf2daa594a8d) Thanks [@tenphi](https://github.com/tenphi)! - Optimize forms to avoid unnecessary field validations.

## 0.22.0

### Minor Changes

- [#347](https://github.com/cube-js/cube-ui-kit/pull/347) [`34410df`](https://github.com/cube-js/cube-ui-kit/commit/34410dfe1771d1285a8a0a4dd1f9b3ef170ded1a) Thanks [@tenphi](https://github.com/tenphi)! - Fix support of field props on input elements.

- [#348](https://github.com/cube-js/cube-ui-kit/pull/348) [`7da9b7b`](https://github.com/cube-js/cube-ui-kit/commit/7da9b7ba7931240e046e38af40c9a1c2bb1cd9d6) Thanks [@tenphi](https://github.com/tenphi)! - Add support for debounce in async validation via `validationDelay` property.

## 0.21.0

### Minor Changes

- [#344](https://github.com/cube-js/cube-ui-kit/pull/344) [`2ea241e`](https://github.com/cube-js/cube-ui-kit/commit/2ea241e2a902c858b3bbcab00c609458123d3622) Thanks [@tenphi](https://github.com/tenphi)! - Update Storybook to version 7

## 0.20.8

### Patch Changes

- [#340](https://github.com/cube-js/cube-ui-kit/pull/340) [`2cf93ce`](https://github.com/cube-js/cube-ui-kit/commit/2cf93ce0db9b3c6d95e33ef6a1cd383f62f9747d) Thanks [@tenphi](https://github.com/tenphi)! - Improve styles in PrismCode component.

- [#341](https://github.com/cube-js/cube-ui-kit/pull/341) [`24a6ce9`](https://github.com/cube-js/cube-ui-kit/commit/24a6ce9e2ecbd28bd5f6dfabefba287174174f89) Thanks [@tenphi](https://github.com/tenphi)! - Add styling properties for the Menu component: `itemStyles`, `sectionStyles` and `sectionHeadingStyles`.

## 0.20.7

### Patch Changes

- [#338](https://github.com/cube-js/cube-ui-kit/pull/338) [`ba4a73f`](https://github.com/cube-js/cube-ui-kit/commit/ba4a73fbde7d7556e211793289851a6b1b9eeba1) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed missing data-\* attribiutes on `<Combobox />` component

## 0.20.6

### Patch Changes

- [#337](https://github.com/cube-js/cube-ui-kit/pull/337) [`62280c4`](https://github.com/cube-js/cube-ui-kit/commit/62280c4c84bfb6c9819662ba01056b162aaf8e22) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed false positive a11y warnings in Button component

- [#333](https://github.com/cube-js/cube-ui-kit/pull/333) [`79b72a1`](https://github.com/cube-js/cube-ui-kit/commit/79b72a199983b73d626ef15a2c189bd6551fe5be) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fix regression when Field's childen might be nullish

- [#335](https://github.com/cube-js/cube-ui-kit/pull/335) [`8e2c86a`](https://github.com/cube-js/cube-ui-kit/commit/8e2c86ab7d9ae231e229a8806c533c14011da0f4) Thanks [@tenphi](https://github.com/tenphi)! - Fix paddings for the Badge component.

- [#336](https://github.com/cube-js/cube-ui-kit/pull/336) [`a6ce43d`](https://github.com/cube-js/cube-ui-kit/commit/a6ce43de18707a13b4339483b0627348eed3b6dc) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fix types of Combobox

- [#336](https://github.com/cube-js/cube-ui-kit/pull/336) [`a6ce43d`](https://github.com/cube-js/cube-ui-kit/commit/a6ce43de18707a13b4339483b0627348eed3b6dc) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fix filtering in Combobox

## 0.20.5

### Patch Changes

- [#331](https://github.com/cube-js/cube-ui-kit/pull/331) [`9b06ba7`](https://github.com/cube-js/cube-ui-kit/commit/9b06ba7400f8cbfbc145357d647c723380c42109) Thanks [@tenphi](https://github.com/tenphi)! - Update CloudLogo to support dark schema in Safari

## 0.20.4

### Patch Changes

- [#327](https://github.com/cube-js/cube-ui-kit/pull/327) [`ab9564d`](https://github.com/cube-js/cube-ui-kit/commit/ab9564d8e378df1d355746a4478aed797b7c3bc9) Thanks [@tenphi](https://github.com/tenphi)! - Add dark schema support for CloudLogo.

## 0.20.3

### Patch Changes

- [#325](https://github.com/cube-js/cube-ui-kit/pull/325) [`01ca4c4`](https://github.com/cube-js/cube-ui-kit/commit/01ca4c48506cd5d17d18839c151db40753768d1a) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fix rerenders of window resize

## 0.20.2

### Patch Changes

- [#323](https://github.com/cube-js/cube-ui-kit/pull/323) [`40b4401`](https://github.com/cube-js/cube-ui-kit/commit/40b4401472fbb074306c1cfd168eeaf40afa9370) Thanks [@tenphi](https://github.com/tenphi)! - Fix aria-label passing in CopySnippet component

## 0.20.1

### Patch Changes

- [#321](https://github.com/cube-js/cube-ui-kit/pull/321) [`c8784ab`](https://github.com/cube-js/cube-ui-kit/commit/c8784ab98e5b1816d6bdc3f861d22044af9f7f5e) Thanks [@tenphi](https://github.com/tenphi)! - Show the Clear Button in the SearchInput component even if the `suffix` prop provided.

- [#321](https://github.com/cube-js/cube-ui-kit/pull/321) [`c8784ab`](https://github.com/cube-js/cube-ui-kit/commit/c8784ab98e5b1816d6bdc3f861d22044af9f7f5e) Thanks [@tenphi](https://github.com/tenphi)! - Add the `hideText` property to hide parts of `CodeSnippet` text.
  Add the `actions` property and `CodeSnippet.Button` component to allow adding new actions to the `CodeSnippet` compoonent.

## 0.20.0

### Minor Changes

- [#317](https://github.com/cube-js/cube-ui-kit/pull/317) [`5487b12`](https://github.com/cube-js/cube-ui-kit/commit/5487b12ddcca823a5efc5954244720e1687bc1bf) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CUK-5](https://cubedevinc.atlassian.net/browse/CC-1485) Migrate all form components on new `useFieldProps` hook

### Patch Changes

- [#319](https://github.com/cube-js/cube-ui-kit/pull/319) [`a53cedf`](https://github.com/cube-js/cube-ui-kit/commit/a53cedf8ffdc283bc0d280a82689835f210c6c4d) Thanks [@tenphi](https://github.com/tenphi)! - Show the Clear Button in the SearchInput component even if the `suffix` prop provided.

- [#318](https://github.com/cube-js/cube-ui-kit/pull/318) [`e3afdbe`](https://github.com/cube-js/cube-ui-kit/commit/e3afdbe2e872db4f03160ff4d25d28bdeaaf8900) Thanks [@tenphi](https://github.com/tenphi)! - Draw range connection link for RangeSlider component.

## 0.19.0

### Minor Changes

- [#267](https://github.com/cube-js/cube-ui-kit/pull/267) [`86a2f11`](https://github.com/cube-js/cube-ui-kit/commit/86a2f118e09e0a37cdfe3ea2dd7a27ac780138f3) Thanks [@tenphi](https://github.com/tenphi)! - Change letter spacing in typography presets. Remove `h5s`, `h5m`, `t3s` and `t4m` presets for good.

### Patch Changes

- [#314](https://github.com/cube-js/cube-ui-kit/pull/314) [`c59fa27`](https://github.com/cube-js/cube-ui-kit/commit/c59fa27911dfbbb058842dc2f3ba2a2af8e0f97b) Thanks [@tenphi](https://github.com/tenphi)! - Fix danger primary text color for Button.

- [#316](https://github.com/cube-js/cube-ui-kit/pull/316) [`c09a431`](https://github.com/cube-js/cube-ui-kit/commit/c09a4317a0330558c74b59fedec0dd8a06b1af5c) Thanks [@tenphi](https://github.com/tenphi)! - Add the small size to the Switch component.

## 0.18.2

### Patch Changes

- [#311](https://github.com/cube-js/cube-ui-kit/pull/311) [`3cf56c8`](https://github.com/cube-js/cube-ui-kit/commit/3cf56c86584cf4435f5d98304791055d4edda9c1) Thanks [@tenphi](https://github.com/tenphi)! - Limit the size of the Field items to avoid overflow in the real layouts.

## 0.18.1

### Patch Changes

- [#308](https://github.com/cube-js/cube-ui-kit/pull/308) [`d044698`](https://github.com/cube-js/cube-ui-kit/commit/d044698a9b8d303b409fad9df4c0493458c38e7d) Thanks [@tenphi](https://github.com/tenphi)! - Fix TrackingProvider api to pass element instead of ref.

## 0.18.0

### Minor Changes

- [#305](https://github.com/cube-js/cube-ui-kit/pull/305) [`89c18da`](https://github.com/cube-js/cube-ui-kit/commit/89c18da9c457e5ed4d19a94d73e40f71ceb4bf20) Thanks [@tenphi](https://github.com/tenphi)! - Remove legacy `styled` and `StyleProvider`. Add `TrackingProvider` for analytics purposes.

### Patch Changes

- [#304](https://github.com/cube-js/cube-ui-kit/pull/304) [`c663fd1`](https://github.com/cube-js/cube-ui-kit/commit/c663fd1c0e0d8cd1e53f94f9ee2a4a2c02b0cf36) Thanks [@dangreen](https://github.com/dangreen)! - upgrade production dependencies

## 0.17.0

### Minor Changes

- [#300](https://github.com/cube-js/cube-ui-kit/pull/300) [`c631c5b`](https://github.com/cube-js/cube-ui-kit/commit/c631c5b5070739fa592c22a84dd90758d2cb175c) Thanks [@tenphi](https://github.com/tenphi)! - Variants API, camelCase support for mods, nested mods support.

### Patch Changes

- [#296](https://github.com/cube-js/cube-ui-kit/pull/296) [`3e23428`](https://github.com/cube-js/cube-ui-kit/commit/3e234289aa707ea8dcaac28e08a938cd71e26005) Thanks [@dangreen](https://github.com/dangreen)! - @react-stately/selection added as a direct dependency

## 0.16.4

### Patch Changes

- [#297](https://github.com/cube-js/cube-ui-kit/pull/297) [`67eafd9`](https://github.com/cube-js/cube-ui-kit/commit/67eafd918d50d847d9c789dec9453b7face78b19) Thanks [@tenphi](https://github.com/tenphi)! - Merge passed `mods` with the default one for all components instead of replacing it.

- [#294](https://github.com/cube-js/cube-ui-kit/pull/294) [`e22815b`](https://github.com/cube-js/cube-ui-kit/commit/e22815b3623f115309ce526cfa67a60bc3e7e3bd) Thanks [@tenphi](https://github.com/tenphi)! - Fix bug when null `value` prop is passing to SearchInput component but the value remains the same.

## 0.16.3

### Patch Changes

- [#292](https://github.com/cube-js/cube-ui-kit/pull/292) [`842836f`](https://github.com/cube-js/cube-ui-kit/commit/842836faf77af9e966235bed6e731527f02d5436) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Added new prop in `<DialogTrigger />` - `shouldCloseOnInteractOutside`, which gives you a chance to filter out interaction with elements that should not dismiss the overlay.

## 0.16.2

### Patch Changes

- [#290](https://github.com/cube-js/cube-ui-kit/pull/290) [`79adb32`](https://github.com/cube-js/cube-ui-kit/commit/79adb32ae90b6e65bdd1815c2eb5b679cb9abcc2) Thanks [@tenphi](https://github.com/tenphi)! - Add an `inputStyles` prop to the `CheckboxGroup` component to customize styles of a checkbox group itself.
  Improve Tasty caching.

## 0.16.1

### Patch Changes

- [#274](https://github.com/cube-js/cube-ui-kit/pull/274) [`43b7913`](https://github.com/cube-js/cube-ui-kit/commit/43b791387f1797d3a9ec7622a63d60e8248bb3d0) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - added ability to specify the way how we'd like to hide a dialog: by unmounting or by hiding in css

## 0.16.0

### Minor Changes

- [#287](https://github.com/cube-js/cube-ui-kit/pull/287) [`15d83f0`](https://github.com/cube-js/cube-ui-kit/commit/15d83f0394deddaa1e2226582bde627d5943726e) Thanks [@tenphi](https://github.com/tenphi)! - Change RangeSlider API to accept only array with two numbers as a value.

## 0.15.0

### Minor Changes

- [#285](https://github.com/cube-js/cube-ui-kit/pull/285) [`01a08ac`](https://github.com/cube-js/cube-ui-kit/commit/01a08acdd83678a2072200847ccafb7da028c0db) Thanks [@tenphi](https://github.com/tenphi)! - Full rework of Slider component. Split it into two separate components: Slider and RangeSlider. Add `gradation` property. Fix styling and accessibility issues.

## 0.14.16

### Patch Changes

- [#283](https://github.com/cube-js/cube-ui-kit/pull/283) [`f07722e`](https://github.com/cube-js/cube-ui-kit/commit/f07722e11a3b61edf16a7ec67d23ba39abccee4f) Thanks [@tenphi](https://github.com/tenphi)! - Fix label positioning for side layout in Form.
  Fix RangeSlider's usage inside forms with `labelPosition="side"`.

## 0.14.15

### Patch Changes

- [#281](https://github.com/cube-js/cube-ui-kit/pull/281) [`a30cf7d`](https://github.com/cube-js/cube-ui-kit/commit/a30cf7d8966a52a5a5c90af4875de6bd9eae1a00) Thanks [@tenphi](https://github.com/tenphi)! - Checkbox now has an abilility to have both a label and a text value inside forms.

## 0.14.14

### Patch Changes

- [#279](https://github.com/cube-js/cube-ui-kit/pull/279) [`14120c8`](https://github.com/cube-js/cube-ui-kit/commit/14120c8d6e651db1d79c22214952d7aa9befdc41) Thanks [@tenphi](https://github.com/tenphi)! - The `border` style now explicitly sets zero-width border for all border that are not mentioned by modifiers. So that it always overrides default values.

## 0.14.13

### Patch Changes

- [#277](https://github.com/cube-js/cube-ui-kit/pull/277) [`86061ce`](https://github.com/cube-js/cube-ui-kit/commit/86061cea6aa42c852d46013ad168b1eda9f72345) Thanks [@tenphi](https://github.com/tenphi)! - Fix NumberInput default width

- [#277](https://github.com/cube-js/cube-ui-kit/pull/277) [`86061ce`](https://github.com/cube-js/cube-ui-kit/commit/86061cea6aa42c852d46013ad168b1eda9f72345) Thanks [@tenphi](https://github.com/tenphi)! - The `border` style now explicitly sets zero-width border for all border that are not mentioned by modifiers. So that it always overrides default values.

## 0.14.12

### Patch Changes

- [#271](https://github.com/cube-js/cube-ui-kit/pull/271) [`90cc2f8`](https://github.com/cube-js/cube-ui-kit/commit/90cc2f876233c3341206536b7f27f78b831e4e92) Thanks [@tenphi](https://github.com/tenphi)! - Add new `special` theme for `Button` and `Select` components.
  Allow single input layout for `RangeSlider` component.
  Add `ellipsis` property to `Select` component to allow text overflow of selected value.

## 0.14.11

### Patch Changes

- [#269](https://github.com/cube-js/cube-ui-kit/pull/269) [`a339fa6`](https://github.com/cube-js/cube-ui-kit/commit/a339fa634c7e68b7e59fa6d5483c5b787d722293) Thanks [@tenphi](https://github.com/tenphi)! - Add support for `icon-size` property in preset style.

- [#273](https://github.com/cube-js/cube-ui-kit/pull/273) [`32d062a`](https://github.com/cube-js/cube-ui-kit/commit/32d062a84d2410259911323b90bda998bdbe1bb8) Thanks [@tenphi](https://github.com/tenphi)! - Add optional ellipsis support for the `Title` component. Make it consistent with the `Text` component.

## 0.14.10

### Patch Changes

- [#265](https://github.com/cube-js/cube-ui-kit/pull/265) [`e96fc55`](https://github.com/cube-js/cube-ui-kit/commit/e96fc55c16d2061039b403905cc7bc26b9419988) Thanks [@tenphi](https://github.com/tenphi)! - Increase the specificity of generated styles.

- [#266](https://github.com/cube-js/cube-ui-kit/pull/266) [`abb4db7`](https://github.com/cube-js/cube-ui-kit/commit/abb4db7fd26dca35609a489548d1d0c9bfb04c97) Thanks [@tenphi](https://github.com/tenphi)! - Change preset style of the Select component and its options to `t3` to match TextInput.

## 0.14.9

### Patch Changes

- [#263](https://github.com/cube-js/cube-ui-kit/pull/263) [`1a57278`](https://github.com/cube-js/cube-ui-kit/commit/1a5727834ade61ba2b837f409d5bce789b117ea3) Thanks [@tenphi](https://github.com/tenphi)! - Apply the correct preset style to all action components.

## 0.14.8

### Patch Changes

- [#260](https://github.com/cube-js/cube-ui-kit/pull/260) [`deee752`](https://github.com/cube-js/cube-ui-kit/commit/deee7526cba3a3f6925a5f3a2a15cbf8be148c8f) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Added new color token: "Warning"

## 0.14.7

### Patch Changes

- [#257](https://github.com/cube-js/cube-ui-kit/pull/257) [`cd3d251`](https://github.com/cube-js/cube-ui-kit/commit/cd3d2512c21b9a3e064edcd09825b1ca37e8645e) Thanks [@tenphi](https://github.com/tenphi)! - Fix font presets on action elements.

## 0.14.6

### Patch Changes

- [#255](https://github.com/cube-js/cube-ui-kit/pull/255) [`30d52f9`](https://github.com/cube-js/cube-ui-kit/commit/30d52f97fde22374df285b00f1febec93b842ed6) Thanks [@tenphi](https://github.com/tenphi)! - Reduce the distance between radio buttons inside Radio.Group

## 0.14.5

### Patch Changes

- [#253](https://github.com/cube-js/cube-ui-kit/pull/253) [`4aba492`](https://github.com/cube-js/cube-ui-kit/commit/4aba49270a26808e4fa2173ed192571253606cf1) Thanks [@tenphi](https://github.com/tenphi)! - Fix styles for disabled option in Select & ComboBox components.

- [#252](https://github.com/cube-js/cube-ui-kit/pull/252) [`fe6526d`](https://github.com/cube-js/cube-ui-kit/commit/fe6526d3cec03a1ab40cc240339e6e6eadf75f3d) Thanks [@tenphi](https://github.com/tenphi)! - SubmitError is removed when any value in the form is changed.

## 0.14.4

### Patch Changes

- [#249](https://github.com/cube-js/cube-ui-kit/pull/249) [`da3bfe8`](https://github.com/cube-js/cube-ui-kit/commit/da3bfe8a07761efadef5ff9c2cfe8185c302eccb) Thanks [@tenphi](https://github.com/tenphi)! - Fixes wrapper prop support on Menu Item.
  Fixes styles of Tooltip's Tip to better match the geometry of a tooltip.

- [#247](https://github.com/cube-js/cube-ui-kit/pull/247) [`c001216`](https://github.com/cube-js/cube-ui-kit/commit/c001216dd674b3a3e3cc66961a26c34667b1e903) Thanks [@tenphi](https://github.com/tenphi)! - Improve performance of style caching for raw tasty components.

## 0.14.3

### Patch Changes

- [#245](https://github.com/cube-js/cube-ui-kit/pull/245) [`bd9d88f`](https://github.com/cube-js/cube-ui-kit/commit/bd9d88f0b52ba3e1ed09aa0208a3cb5ea14fb303) Thanks [@tenphi](https://github.com/tenphi)! - Fix incorrect custom property binding in Menu component.

- [#243](https://github.com/cube-js/cube-ui-kit/pull/243) [`27b8198`](https://github.com/cube-js/cube-ui-kit/commit/27b8198db2c9a549b537a857964dca9fd590e82a) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CC-1616](https://cubedevinc.atlassian.net/browse/CC-1635) Recalculate position of a drodown on filter change

## 0.14.2

### Patch Changes

- [#240](https://github.com/cube-js/cube-ui-kit/pull/240) [`d2369ba`](https://github.com/cube-js/cube-ui-kit/commit/d2369baae76de2abecfc865a91e2cac8d06d4d05) Thanks [@tenphi](https://github.com/tenphi)! - Add text security support in the TextArea component for Firefox

## 0.14.1

### Patch Changes

- [#239](https://github.com/cube-js/cube-ui-kit/pull/239) [`8a31e19`](https://github.com/cube-js/cube-ui-kit/commit/8a31e1970eaed1a4afd77360b8d9e2ed85934be6) Thanks [@tenphi](https://github.com/tenphi)! - Fix `inherit` token values, so they mean what is meant.

- [#237](https://github.com/cube-js/cube-ui-kit/pull/237) [`c079e38`](https://github.com/cube-js/cube-ui-kit/commit/c079e38fa9cac4e89554ae7d440f175106d4286c) Thanks [@tenphi](https://github.com/tenphi)! - Add ellipsis for long filenames in FileInput and prevent wrapping.

- [#233](https://github.com/cube-js/cube-ui-kit/pull/233) [`4578e97`](https://github.com/cube-js/cube-ui-kit/commit/4578e97b3ec5790b88850b5310b67a8fa983411e) Thanks [@tenphi](https://github.com/tenphi)! - [BUMP] Upgrade tiny-invariant from 1.2.0 to 1.3.1

## 0.14.0

### Minor Changes

- [#212](https://github.com/cube-js/cube-ui-kit/pull/212) [`66cece1`](https://github.com/cube-js/cube-ui-kit/commit/66cece1f6156a87f8fe16bc35a04dec54c2c2761) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Bump react-aria and react-stately to their latest versions

### Patch Changes

- [#230](https://github.com/cube-js/cube-ui-kit/pull/230) [`9578486`](https://github.com/cube-js/cube-ui-kit/commit/9578486f497e207bce25da4cffc84307bfb91a13) Thanks [@tenphi](https://github.com/tenphi)! - The Form component set `submitError` no more on failed validation.
  `SubmitError` component now handles non-valid errors as `Internal error`.

## 0.13.6

### Patch Changes

- [#227](https://github.com/cube-js/cube-ui-kit/pull/227) [`19c1adf`](https://github.com/cube-js/cube-ui-kit/commit/19c1adf7b5142dca8bb81def3be1e90e378b3199) Thanks [@tenphi](https://github.com/tenphi)! - Add `SubmitError` component to display error that throws onSubmit callback.
  Allow to manually visualize a submit error.

## 0.13.5

### Patch Changes

- [#224](https://github.com/cube-js/cube-ui-kit/pull/224) [`6f58989`](https://github.com/cube-js/cube-ui-kit/commit/6f58989b15fb24c0d105d3c24f909f356b925e55) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CC-1327](https://cubedevinc.atlassian.net/browse/CC-1327): Fixed bug when `onDismiss` doesn't trigger on `ESC` press within `AlertDialog`

- [#221](https://github.com/cube-js/cube-ui-kit/pull/221) [`2721552`](https://github.com/cube-js/cube-ui-kit/commit/2721552429f06e89d05c865c391f629f81da8763) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Add `RangeSlider` component

  ```jsx
  <RangeSlider defaultValue={[10, 40]} minValue={0} maxValue={100} step={2} />
  ```

- [#226](https://github.com/cube-js/cube-ui-kit/pull/226) [`7d9b2d0`](https://github.com/cube-js/cube-ui-kit/commit/7d9b2d0c814371c8e0805fdde3b63f7c7c8a128f) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CC-1364](https://cubedevinc.atlassian.net/browse/CC-1364) - fixed bug when useNotificationObserver calls callback with already removed notification

## 0.13.4

### Patch Changes

- [#222](https://github.com/cube-js/cube-ui-kit/pull/222) [`b3057c9`](https://github.com/cube-js/cube-ui-kit/commit/b3057c953c5947ed21c327acaca0dca67163f9e8) Thanks [@tenphi](https://github.com/tenphi)! - Fix for the small size of the NumberInput.

## 0.13.3

### Patch Changes

- [#219](https://github.com/cube-js/cube-ui-kit/pull/219) [`d178c72`](https://github.com/cube-js/cube-ui-kit/commit/d178c72abf4d890c9bfbc644961a6aa5bfb2a143) Thanks [@tenphi](https://github.com/tenphi)! - Fix overlapping of LegacyTabs' fades with dialogs.

## 0.13.2

### Patch Changes

- [#218](https://github.com/cube-js/cube-ui-kit/pull/218) [`121e4a0`](https://github.com/cube-js/cube-ui-kit/commit/121e4a0ebdf4ed64720cbc89ce61be8eb2fd3f8d) Thanks [@tenphi](https://github.com/tenphi)! - Set default bold font weight to 700.

- [#217](https://github.com/cube-js/cube-ui-kit/pull/217) [`91092dd`](https://github.com/cube-js/cube-ui-kit/commit/91092dd81c80ab25242cd558214033dcdb7629d3) Thanks [@tenphi](https://github.com/tenphi)! - Fix the bug that didn't allow to type into a ComboBox to the initial value inside a Form.

- [#215](https://github.com/cube-js/cube-ui-kit/pull/215) [`f5b707e`](https://github.com/cube-js/cube-ui-kit/commit/f5b707ebf3b26b9b8f37b5032b0417afb2c0f801) Thanks [@tenphi](https://github.com/tenphi)! - Fix SSR support

## 0.13.1

### Patch Changes

- [#213](https://github.com/cube-js/cube-ui-kit/pull/213) [`04852be`](https://github.com/cube-js/cube-ui-kit/commit/04852be0b17cb2d7ecab80c530128ec957e5cf3e) Thanks [@tenphi](https://github.com/tenphi)! - Fix that allows notifications to be dismissed correctly when they are off the display limit.

## 0.13.0

### Minor Changes

- [#207](https://github.com/cube-js/cube-ui-kit/pull/207) [`fa16cd6`](https://github.com/cube-js/cube-ui-kit/commit/fa16cd6f74190b238583312aec6343a9258bb9b4) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Redesigned close button in `<Notification />` component.

  Added ability to dismiss a notification in `<NotificationList />` component.

  ```typescript jsx
  import { NotificationsList } from '@cube-dev/ui-kit';

  <NotificationList onDismiss={() => console.log('dismissed')}>
    <NotificationsList.Item
      header="Notification title"
      description="Notification description"
    />
  </NotificationList>;
  ```

  Now notifications generates more uniq ids by default.

### Patch Changes

- [#206](https://github.com/cube-js/cube-ui-kit/pull/206) [`11f14c3`](https://github.com/cube-js/cube-ui-kit/commit/11f14c3b8c65c39a91dd6dac6d094a7bd9bfe549) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Added support of keyboard navigation inside Menu component

- [#211](https://github.com/cube-js/cube-ui-kit/pull/211) [`e74374d`](https://github.com/cube-js/cube-ui-kit/commit/e74374d2e9b9bd8b52a0e80ef561815f08d185c3) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Do not render more than 5 notificaitons at the same time

## 0.12.7

### Patch Changes

- [#203](https://github.com/cube-js/cube-ui-kit/pull/203) [`f50b93a`](https://github.com/cube-js/cube-ui-kit/commit/f50b93aa6651f2feca7762345a3c4d54fe3d8ae4) Thanks [@tenphi](https://github.com/tenphi)! - On form submission the `isSubmitting` flag now set to true before the start of the validation.

- [#202](https://github.com/cube-js/cube-ui-kit/pull/202) [`8e6767a`](https://github.com/cube-js/cube-ui-kit/commit/8e6767acc57670e0b7c3e47bcb4f0090cbb1e322) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Improve typings of `onSubmit` and `onValuesChange` callbacks in `<Form />` component. Now they properly match with `FormInstance` and `useForm`.

## 0.12.6

### Patch Changes

- [#200](https://github.com/cube-js/cube-ui-kit/pull/200) [`6b7448a`](https://github.com/cube-js/cube-ui-kit/commit/6b7448a65e8112df2c0b079dbfaae9802922d065) Thanks [@tenphi](https://github.com/tenphi)! - Form is no longer validated on field removal (bugfix)

- [#200](https://github.com/cube-js/cube-ui-kit/pull/200) [`6b7448a`](https://github.com/cube-js/cube-ui-kit/commit/6b7448a65e8112df2c0b079dbfaae9802922d065) Thanks [@tenphi](https://github.com/tenphi)! - Validation rules in Form now allows to return complex markup in error messages.

## 0.12.5

### Patch Changes

- [#198](https://github.com/cube-js/cube-ui-kit/pull/198) [`dec5c65`](https://github.com/cube-js/cube-ui-kit/commit/dec5c65a121a06391d0757b7aee1a43cd17342c6) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed input width in `<Combobox />` and `<Select />` components

## 0.12.4

### Patch Changes

- [#181](https://github.com/cube-js/cube-ui-kit/pull/181) [`1f6220e`](https://github.com/cube-js/cube-ui-kit/commit/1f6220eeb7fc9c28f83f02eb113e92b8542fec89) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Improve display names across all components

- [#195](https://github.com/cube-js/cube-ui-kit/pull/195) [`ee8ab23`](https://github.com/cube-js/cube-ui-kit/commit/ee8ab238ac9d0ca6ed2b35c816cbf155c6eefcf8) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Reduced gap between `label` and `labelSuffix` in `<Field />`

## 0.12.3

### Patch Changes

- [#182](https://github.com/cube-js/cube-ui-kit/pull/182) [`6db0491`](https://github.com/cube-js/cube-ui-kit/commit/6db04916412cbf0150b0cc730451fd7c595571a5) Thanks [@tenphi](https://github.com/tenphi)! - Add `icon` property to Input components. You should use it instead `prefix` property to ensure your icon will have correct paddings.
  Styles of Input components have been rewritten to improve consistency and maintenance.

- [#193](https://github.com/cube-js/cube-ui-kit/pull/193) [`5c3ed68`](https://github.com/cube-js/cube-ui-kit/commit/5c3ed682a967d6bcaa26765b2c839b1d04a0f182) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed alignment between label and suffix in Field component

- [#177](https://github.com/cube-js/cube-ui-kit/pull/177) [`16a213a`](https://github.com/cube-js/cube-ui-kit/commit/16a213a616c4e5d328e344797323abdf910e7a53) Thanks [@tenphi](https://github.com/tenphi)! - ComboBox now respects `onSelectionChange` event while working inside a form.

- [#185](https://github.com/cube-js/cube-ui-kit/pull/185) [`7a7b861`](https://github.com/cube-js/cube-ui-kit/commit/7a7b861ff2f0f50c751b0b73e4da3b4a682379c3) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed types in `onSubmit` and `onValuesChange` types in `Form`

## 0.12.2

### Patch Changes

- [`dcc4edc`](https://github.com/cube-js/cube-ui-kit/commit/dcc4edc3ef560d25062277b5e4f2fcee7afe4168) - Pass `labelSuffix` to all form components

## 0.12.1

### Patch Changes

- [#178](https://github.com/cube-js/cube-ui-kit/pull/178) [`932d401`](https://github.com/cube-js/cube-ui-kit/commit/932d401f5100b92b7635f51054049e6176d672ff) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed bug in button when `isLoading` prop didn't affect on mods

## 0.12.0

### Minor Changes

- [#174](https://github.com/cube-js/cube-ui-kit/pull/174) [`76a9f37`](https://github.com/cube-js/cube-ui-kit/commit/76a9f373253dea98e2099ee2a39199064da7a3d6) Thanks [@tenphi](https://github.com/tenphi)! - Rename `default` size to `medium` and `default` type to `secondary` in the Button component.
  Add `rightIcon` property to the Button component.

- [#175](https://github.com/cube-js/cube-ui-kit/pull/175) [`34b680e`](https://github.com/cube-js/cube-ui-kit/commit/34b680eae60a4fbf9d310a048a8bb53d41cbf1ce) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Added new prop `labelSuffix` in Field component. Using this prop you can add any adornment after the label.

- [#176](https://github.com/cube-js/cube-ui-kit/pull/176) [`4239ef6`](https://github.com/cube-js/cube-ui-kit/commit/4239ef6889956523409c9ff67696331e5ba2229c) Thanks [@tenphi](https://github.com/tenphi)! - Add a loading modifier and `placeholder` property to Select and ComboBox components.

### Patch Changes

- [#163](https://github.com/cube-js/cube-ui-kit/pull/163) [`644812c`](https://github.com/cube-js/cube-ui-kit/commit/644812cef1c6ca8f9e16d614641603a45e23a42b) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Now all icon only buttons have proper sizes

- [#175](https://github.com/cube-js/cube-ui-kit/pull/175) [`34b680e`](https://github.com/cube-js/cube-ui-kit/commit/34b680eae60a4fbf9d310a048a8bb53d41cbf1ce) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Reduced default delay in tooltip to 250ms

- [#169](https://github.com/cube-js/cube-ui-kit/pull/169) [`fe67fcc`](https://github.com/cube-js/cube-ui-kit/commit/fe67fcc96499505dfa31a581eaff9385d06aab6d) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Add `disableRemoveOnUnmount` prop in `<Notificaiton />` and `<Toast />` components

- [#171](https://github.com/cube-js/cube-ui-kit/pull/171) [`3f99948`](https://github.com/cube-js/cube-ui-kit/commit/3f999483bc1cf54f73cd9099f3226e00041eafde) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Adds customization form Menu.Item.
  Now you can pass props like `icon` even if any react element inside `Menu.Item`

- [#166](https://github.com/cube-js/cube-ui-kit/pull/166) [`c9226c6`](https://github.com/cube-js/cube-ui-kit/commit/c9226c68e73f7343c69c27972253ae1e9ac7a532) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Bugfixes in `<Notification />` and `<Toast />` components:

  - Fixed width of notifications in bar
  - Nofifications and toasts now respects duration property
  - Fixed bug when user were unable to select a text inside a description

- [#162](https://github.com/cube-js/cube-ui-kit/pull/162) [`328b664`](https://github.com/cube-js/cube-ui-kit/commit/328b664faff7894f91d34cbaac6e9abaad564a44) Thanks [@tenphi](https://github.com/tenphi)! - Fix font family fallback for `preset` style.

- [#173](https://github.com/cube-js/cube-ui-kit/pull/173) [`34fdefb`](https://github.com/cube-js/cube-ui-kit/commit/34fdefba170c32f091df52ac895bc08f439655a2) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Fixes `childrenchildrenchildren` bug when use `TooltipProvider` component

- [#165](https://github.com/cube-js/cube-ui-kit/pull/165) [`6c53550`](https://github.com/cube-js/cube-ui-kit/commit/6c535506e649c42033d3c0508c5844e8987188b5) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Fixed bug when menu doesn't open within a modal

- [#167](https://github.com/cube-js/cube-ui-kit/pull/167) [`89899c2`](https://github.com/cube-js/cube-ui-kit/commit/89899c220e1cf1b00395f610a17b5bbc0fbaa307) Thanks [@tenphi](https://github.com/tenphi)! - fix(Switch): thumb disabled styles

## 0.11.2

### Patch Changes

- [#161](https://github.com/cube-js/cube-ui-kit/pull/161) [`f5976df`](https://github.com/cube-js/cube-ui-kit/commit/f5976df3e318006ce62b325393f2f86aa9dce9e1) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed description preset in notificaiton

- [#156](https://github.com/cube-js/cube-ui-kit/pull/156) [`f0ac89a`](https://github.com/cube-js/cube-ui-kit/commit/f0ac89aff31626f9aea61cf99dfd397e5ccb7d1a) Thanks [@nikolaykost](https://github.com/nikolaykost)! - pass `isLoading` and `isDisabled` from `Form.Item` to childs

  ```jsx
  <Form.Item isLoading isDisabled>
    <Input />
  </Form.Item>
  ```

## 0.11.1

### Patch Changes

- [#158](https://github.com/cube-js/cube-ui-kit/pull/158) [`e03992b`](https://github.com/cube-js/cube-ui-kit/commit/e03992bcbd79e2ebcfd187b1d9478ac1a4e3c18e) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed bug when notifications displays below the legacy `<Modal />` component

## 0.11.0

### Minor Changes

- [#154](https://github.com/cube-js/cube-ui-kit/pull/154) [`1555c0d`](https://github.com/cube-js/cube-ui-kit/commit/1555c0d454939cebb7dc547d8290165450a7ce5d) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CUK-65](https://cubedevinc.atlassian.net/browse/CUK-65) - Notification component

### Patch Changes

- [#154](https://github.com/cube-js/cube-ui-kit/pull/154) [`1555c0d`](https://github.com/cube-js/cube-ui-kit/commit/1555c0d454939cebb7dc547d8290165450a7ce5d) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Toast Component

## 0.10.13

### Patch Changes

- [#151](https://github.com/cube-js/cube-ui-kit/pull/151) [`e3eaeba`](https://github.com/cube-js/cube-ui-kit/commit/e3eaebac88a3826ad7b1bb542e72e25af563d367) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Adds prop `selectionType` for `Menu` component. That stands for values `checkbox` or `radio`.

  ```jsx
  <Menu selectionType="checkbox" selectionMode="single">
    <Item key="1">Item 1</Item>
    <Item key="2">Item 2</Item>
  </Menu>
  ```

- [#111](https://github.com/cube-js/cube-ui-kit/pull/111) [`f45b927`](https://github.com/cube-js/cube-ui-kit/commit/f45b927bb34dbc9bd0374a5d55c039bd37fa899e) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CC-677](https://cubedevinc.atlassian.net/browse/CC-677) significantly improved performance of the `Spin` component in all browsers.

## 0.10.12

### Patch Changes

- [#149](https://github.com/cube-js/cube-ui-kit/pull/149) [`3ea195c`](https://github.com/cube-js/cube-ui-kit/commit/3ea195c713f880e7d4e45e19b72cc6f4a1b4d5b4) Thanks [@tenphi](https://github.com/tenphi)! - fix(Combobox): error on trigger

## 0.10.11

### Patch Changes

- [#133](https://github.com/cube-js/cube-ui-kit/pull/133) [`943dbc6`](https://github.com/cube-js/cube-ui-kit/commit/943dbc69e7225c9f80c85cc887a1928a9b29b09f) Thanks [@tenphi](https://github.com/tenphi)! - fix(FileTabs): styles

- [#146](https://github.com/cube-js/cube-ui-kit/pull/146) [`77a9c29`](https://github.com/cube-js/cube-ui-kit/commit/77a9c29b2fcefe1d49904b170c133dea530f33e7) Thanks [@tenphi](https://github.com/tenphi)! - fix(tasty): style merging while wrapping
  feat(preset.style): add bold-font-weight token

## 0.10.10

### Patch Changes

- [#140](https://github.com/cube-js/cube-ui-kit/pull/140) [`2b12419`](https://github.com/cube-js/cube-ui-kit/commit/2b12419446e001eb69d923ba0ec4523a87999452) Thanks [@tenphi](https://github.com/tenphi)! - fix(Space): items alignment

## 0.10.9

### Patch Changes

- [#138](https://github.com/cube-js/cube-ui-kit/pull/138) [`e7861d3`](https://github.com/cube-js/cube-ui-kit/commit/e7861d33fd480439a9bbbab3a1a0659ec3af8422) Thanks [@tenphi](https://github.com/tenphi)! - Fix extractStyles() logic.
  Fix label position inside a field.

## 0.10.8

### Patch Changes

- [#131](https://github.com/cube-js/cube-ui-kit/pull/131) [`0f4e39a`](https://github.com/cube-js/cube-ui-kit/commit/0f4e39a98e469ee0ed0757d6fc76a2a0eb9591e1) Thanks [@tenphi](https://github.com/tenphi)! - fix(Field): pass labelStyles prop

## 0.10.7

### Patch Changes

- [#129](https://github.com/cube-js/cube-ui-kit/pull/129) [`facd201`](https://github.com/cube-js/cube-ui-kit/commit/facd2013b2130aa44dcdc3e55540742df464c923) Thanks [@tenphi](https://github.com/tenphi)! - fix(Field): pass labelStyles prop

## 0.10.6

### Patch Changes

- [#127](https://github.com/cube-js/cube-ui-kit/pull/127) [`3c875d6`](https://github.com/cube-js/cube-ui-kit/commit/3c875d60e4bc41be17e12926648c9dcfd2ca858c) Thanks [@tenphi](https://github.com/tenphi)! - fix(Field): pass labelPosition prop

## 0.10.5

### Patch Changes

- [#125](https://github.com/cube-js/cube-ui-kit/pull/125) [`7c457f5`](https://github.com/cube-js/cube-ui-kit/commit/7c457f5cb85983f0ed3870d9b2f78b1bdfd81f9f) Thanks [@tenphi](https://github.com/tenphi)! - fix(Card): pass style props

- [#124](https://github.com/cube-js/cube-ui-kit/pull/124) [`f4ed612`](https://github.com/cube-js/cube-ui-kit/commit/f4ed612289bff0526b61696e3d5c054a2cb578fc) Thanks [@tenphi](https://github.com/tenphi)! - fix(Space): condition for the vertical modifier

## 0.10.4

### Patch Changes

- [#119](https://github.com/cube-js/cube-ui-kit/pull/119) [`bdccbf8`](https://github.com/cube-js/cube-ui-kit/commit/bdccbf8d0bd4762659185b9571efbdc1c1e97f09) Thanks [@tenphi](https://github.com/tenphi)! - Allow `tasty` to extend components with required properties.

## 0.10.3

### Patch Changes

- [#120](https://github.com/cube-js/cube-ui-kit/pull/120) [`6aa6e26`](https://github.com/cube-js/cube-ui-kit/commit/6aa6e2645fc92bd8d7d6ed86f4e2ddff5fc7df62) Thanks [@tenphi](https://github.com/tenphi)! - Fix the display style default value in gap style generator.

## 0.10.2

### Patch Changes

- [#116](https://github.com/cube-js/cube-ui-kit/pull/116) [`3967bd0`](https://github.com/cube-js/cube-ui-kit/commit/3967bd05c7a810ab4d83b71236b33f9382f00329) Thanks [@tenphi](https://github.com/tenphi)! - Pass `styles` prop to Field component.
  Add stories for Field component.
  Export `CubeRadioGroupProps` type.

## 0.10.1

### Patch Changes

- [#113](https://github.com/cube-js/cube-ui-kit/pull/113) [`d6e2f46`](https://github.com/cube-js/cube-ui-kit/commit/d6e2f46c15aad30a102e070412e570fbc39ac725) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed transparent background of `<Select />` component

- [#112](https://github.com/cube-js/cube-ui-kit/pull/112) [`7432820`](https://github.com/cube-js/cube-ui-kit/commit/743282055b923d841d9caab34361a4f4df2e987f) Thanks [@tenphi](https://github.com/tenphi)! - Stabilize Form behavior.
  Fix Switch component styles.

## 0.10.0

### Minor Changes

- [#84](https://github.com/cube-js/cube-ui-kit/pull/84) [`9af598c`](https://github.com/cube-js/cube-ui-kit/commit/9af598c08a0f1e2ea2a5e4a00118367428262e27) Thanks [@tenphi](https://github.com/tenphi)! - [CUK-72](https://cubedevinc.atlassian.net/jira/software/projects/CUK/boards/3?selectedIssue=CUK-72) Move all style engine logic into a single folder `tasty` and export new `tasty()` helper as `styled` replacement but with simplified and optimized API.

- [#99](https://github.com/cube-js/cube-ui-kit/pull/99) [`8be45cd`](https://github.com/cube-js/cube-ui-kit/commit/8be45cddb565cc093b4d3b421de6984d5646a91b) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CC-484](https://cubedevinc.atlassian.net/browse/CC-484) This PR removes several organisms from ui-kit: TopBar, StatsCard, SearchResults, DirectoryTree.

### Patch Changes

- [#110](https://github.com/cube-js/cube-ui-kit/pull/110) [`52fbee3`](https://github.com/cube-js/cube-ui-kit/commit/52fbee3bef49c96182ca735770db5dca1e7338f4) Thanks [@tenphi](https://github.com/tenphi)! - Update `Select` & `Combobox` selected option styles.

- [#105](https://github.com/cube-js/cube-ui-kit/pull/105) [`8ce1f2d`](https://github.com/cube-js/cube-ui-kit/commit/8ce1f2dd84a0f4f1e11b7e0e65212ac73bdf3cd0) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CUK-33](https://cubedevinc.atlassian.net/browse/CUK-33) Now you can use the `<DialogForm />` component together with `<DialogTrigger />` 🎉

  ```tsx
  <DialogTrigger>
    <Button>Open dialog</Button>
    <DialogForm>...</DialogForm>
  </DialogTrigger>
  ```

- [#105](https://github.com/cube-js/cube-ui-kit/pull/105) [`8ce1f2d`](https://github.com/cube-js/cube-ui-kit/commit/8ce1f2dd84a0f4f1e11b7e0e65212ac73bdf3cd0) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CUK-33](https://cubedevinc.atlassian.net/browse/CUK-33) Removed unused `type` property in the `<DialogForm />`component

- [#104](https://github.com/cube-js/cube-ui-kit/pull/104) [`cead470`](https://github.com/cube-js/cube-ui-kit/commit/cead4704c8fb03bfba70c8652fde7cd8c814bf9a) Thanks [@tenphi](https://github.com/tenphi)! - Deprecation of StyleProvider

- [#104](https://github.com/cube-js/cube-ui-kit/pull/104) [`cead470`](https://github.com/cube-js/cube-ui-kit/commit/cead4704c8fb03bfba70c8652fde7cd8c814bf9a) Thanks [@tenphi](https://github.com/tenphi)! - Fix paddings and `size` prop typings in Dialog Component.

- [#105](https://github.com/cube-js/cube-ui-kit/pull/105) [`8ce1f2d`](https://github.com/cube-js/cube-ui-kit/commit/8ce1f2dd84a0f4f1e11b7e0e65212ac73bdf3cd0) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CUK-33](https://cubedevinc.atlassian.net/browse/CUK-33) Added documentation for the `<DialogForm />` component

- [#104](https://github.com/cube-js/cube-ui-kit/pull/104) [`cead470`](https://github.com/cube-js/cube-ui-kit/commit/cead4704c8fb03bfba70c8652fde7cd8c814bf9a) Thanks [@tenphi](https://github.com/tenphi)! - Fix neutral pressed fill style for Button component

- [#109](https://github.com/cube-js/cube-ui-kit/pull/109) [`57a4cd3`](https://github.com/cube-js/cube-ui-kit/commit/57a4cd319eb8f7a9259772c289c218fce8a6e649) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Rework design of `Menu` component with _sections_.
  Now _sections_ more readable and has convenient design.

- [#104](https://github.com/cube-js/cube-ui-kit/pull/104) [`cead470`](https://github.com/cube-js/cube-ui-kit/commit/cead4704c8fb03bfba70c8652fde7cd8c814bf9a) Thanks [@tenphi](https://github.com/tenphi)! - Support for `element` prop in `tasty` helper.

- [#104](https://github.com/cube-js/cube-ui-kit/pull/104) [`cead470`](https://github.com/cube-js/cube-ui-kit/commit/cead4704c8fb03bfba70c8652fde7cd8c814bf9a) Thanks [@tenphi](https://github.com/tenphi)! - Fix Legacy Modal component to correctly pass theme prop

## 0.9.12

### Patch Changes

- [#90](https://github.com/cube-js/cube-ui-kit/pull/90) [`ed07084`](https://github.com/cube-js/cube-ui-kit/commit/ed070842d46e5b448d1f88a9eeaee01b27d46467) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - this is a test release. will be removed

## 0.9.11

### Patch Changes

- [#89](https://github.com/cube-js/cube-ui-kit/pull/89) [`da511c5`](https://github.com/cube-js/cube-ui-kit/commit/da511c5749c6cb85272852fc323caf02a9177eba) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - this is a test release
