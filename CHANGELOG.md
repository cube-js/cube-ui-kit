# @cube-dev/ui-kit

## 0.168.0

### Minor Changes

- [#1344](https://github.com/cube-js/cube-ui-kit/pull/1344) [`7f786591`](https://github.com/cube-js/cube-ui-kit/commit/7f7865910ae4f9858d5052cd1452cb457530ce92) Thanks [@tenphi](https://github.com/tenphi)! - Collapse the kit's stylesheet writes into one style invalidation per commit.

  Every `insertRule()` on a live stylesheet invalidates style for that sheet's scope. Kit components inject during React's render phase, so when anything else reads layout in the same pass — a tooltip positioning itself, `TextArea` autosizing, a virtualized table measuring rows — the two interleave and the browser is forced to recalculate style between every injection.

  `<Root>` now enables tasty's `batchInjection` and opens a batch window for its own commits. A commit that mounts a portal does not re-render `<Root>`, so windows are opened per portal boundary too: `<Portal>` (tooltips) and `<Overlay>` (popovers, modals and trays — the `Dialog` and `Menu` surfaces). Those are the commits where injection and measurement interleave worst, because react-aria positions the overlay from a layout effect in the same commit that mounts it.

  Writes are queued and applied together, and the flush happens in `useInsertionEffect` — before any `useLayoutEffect` — so nothing can measure an element whose rules have not landed yet. Any commit without a window in it writes straight through exactly as before.

  No API change: no new props, no new setup. SSR is unaffected — styles are collected as text there and the provider is inert without a `document`.

## 0.167.0

### Minor Changes

- [#1350](https://github.com/cube-js/cube-ui-kit/pull/1350) [`ee97f365`](https://github.com/cube-js/cube-ui-kit/commit/ee97f3651bca7c1fd9bcf8201eb2a236a885b6f2) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: corner-anchored widget chrome, app-defined widget modifiers, a reason on `onLayoutChange`, and a real `dragCancel` default.

  - **`dragCancel` now defaults to `BOARD_SELECTION_CANCEL`** instead of no cancel at all. A control inside a widget has to keep its own press whether or not the board happens to support selection — previously that only worked on a _selectable_ board, where `selectionCancel` incidentally doubled as the drag guard, so every other board had to hand-write a selector or a pointer-down on a child's button would drag the widget instead. Pass your own selector to narrow or widen it, or `''` for the old behaviour.
  - **`cornerChrome`** (with **`cornerChromePlacement`**, default `'ne'`) puts a control on a widget's corner, centred on it. It renders in the same layer as the corner resize grips, which is the layer that escapes the widget's own `overflow: hidden` — chrome hung off the corner from inside a widget is cropped in half by that clip, or by an ancestor's scroll container when the widget sits in the first row. Being outside the widget host, it is also outside the drag gesture, so pressing it can never start a drag and it needs no `dragCancel` entry.
  - **`mods`** on `Board.Widget` (and board-wide via `widgetProps`) merges app-defined modifiers into the ones the board sets, so a `styles` map can match on app state (`mods={{ editing: true }}` with `styles={{ shadow: { editing: '…' } }}`) instead of the app swapping whole style objects per state. Board's own modifiers are applied last, so a custom one can never shadow `selected`, `drag` and the rest, which the board's styling and its accessibility wiring both depend on.
  - **`onLayoutChange` now reports why the layout changed** — `'drag'`, `'resize'`, `'transfer'`, or `'normalize'` for the commits no gesture caused (a reflow for a changed column count, an `isAutoHeight` widget growing). An app that persisted every commit had no way to tell a user's edit from the board fitting itself to a constraint that moved, so it wrote the reflow back as an edit and marked a document dirty nobody touched. The argument is additive: existing one-parameter handlers keep working.

  The docs also now explain that widget style maps are **merged**: a map with no `''` entry extends the defaults, while one that sets `''` replaces them and needs `'@inherit'` to keep any. Reaching for `'': false` to switch a single state off is the easy mistake — it silently takes `selected`, `pre-selected` and the drag lift with it.

- [#1351](https://github.com/cube-js/cube-ui-kit/pull/1351) [`2caf1072`](https://github.com/cube-js/cube-ui-kit/commit/2caf1072c29e90098ff387d42329ecf3bed6fdce) Thanks [@tenphi](https://github.com/tenphi)! - New: `resolveTokenValue()`, `resolveTokenValues()` and `resolvePresetValues()`, plus the `useTokenValue()` / `useTokenValues()` / `usePresetValues()` hooks — a supported way to ask the kit for a design token's _resolved_ value, for consumers rendering into a surface our stylesheets do not reach: a third-party iframe (Stripe Elements), a CodeMirror or Monaco theme, a chart spec. Those take colors, lengths and font descriptors as values, and `var(--purple-color)` means nothing to them.

  Reading tokens off `getComputedStyle()` by hand fails silently. `Root` declares the token block on `<body>`, so `<html>`, a detached node, and a tree that has not mounted `Root` yet are all outside it — and a token read from outside does not come back empty, it comes back as tasty's registered `@property` default. Some of those are obvious duds (`rgba(0, 0, 0, 0)`, `0px`), but many are ordinary-looking values that are merely wrong: `--gap` reads `4px` rather than the kit's `8px`, `--transition` reads `80ms`, `--radius` reads `6px`. So the helpers do not inspect the value. They read `$tokens-applied`, a new marker the token block declares alongside the tokens, and use it to answer the only question that settles the matter — are the kit's tokens in effect on this element? Off that surface every read returns `null` (or an explicit `fallback`) and warns once in development; on it, the computed value is the truth, so a token that genuinely is `transparent` or `0px` — `#clear`, `#scrollbar-outline`, `$h2-letter-spacing` — comes through intact. The hooks re-resolve when the palette is re-seeded or the scheme / contrast tier flips, and match the server's markup while hydrating.

  All six take `{ element, fallback }` — pass `element` to resolve against a local override (a subtree with its own `tokens` prop, or one under a differing `data-schema`) instead of the document.

- [#1345](https://github.com/cube-js/cube-ui-kit/pull/1345) [`8fdee382`](https://github.com/cube-js/cube-ui-kit/commit/8fdee38230d0aee519df7db8c6edd5a6951910b7) Thanks [@tenphi](https://github.com/tenphi)! - Update Tasty to 3.3.1 (from 3.1.0). Three things come with it.

  **Color tokens no longer emit companion channel variables, and `colorSpace` is deprecated.** A `#name` token used to declare `--name-color` plus a decomposed companion — `--name-color-rgb` here, since the kit configured `colorSpace: 'rgb'` — and only the companion is gone: `--name-color` is emitted exactly as authored. Opacity has used CSS relative color syntax since 3.1.0, so nothing inside Tasty needed the channels any more. **If your own CSS reads a companion — `rgb(var(--primary-color-rgb) / .2)` and the like — it silently stops resolving.** Rewrite it against the token itself: `oklch(from var(--primary-color) l c h / .2)`, which works on any color, including the ones no build-time conversion could evaluate. `configure({ colorSpace })` now warns in development and does nothing; the kit no longer sets it. One more consequence worth planning for: a token is emitted in the space it was authored in, so `getComputedStyle(el).backgroundColor` now returns `oklch(…)` / `oklab(…)` where it used to return `rgb(…)`. The color is the same, but any test or code that parses those strings by hand has to stop assuming sRGB syntax.

  **The inherited color is now readable as a color, through `$current-color`.** `#current` keeps emitting the `currentcolor` keyword, so it still resolves against the element that reads it — which is what lets a ramp express its disabled state once, in `color`, and have everything painted from `#current` below it fade along. Beside that, every `color` style now publishes `--current-color`, registered with `initial-value: currentcolor`, for the cases the keyword cannot serve: hand-authored CSS, or anywhere the inherited color is needed as a _color_. Read it as `$current-color`. A value that already reads the color it inherits — `#current`, a `#current` fade — is deliberately not published into it, since resolving it again one level down would fade it twice.

  **Opt-in batched style injection** (from 3.2.0): `configure({ batchInjection: true })` plus a `<TastyBatchProvider>` queue a commit's stylesheet writes into one FIFO and apply them together, so the document is style-invalidated once per flush instead of once per component — which matters in a tree that measures layout during render (popovers, autosizing inputs, virtualized lists). The provider flushes in `useInsertionEffect`, before any layout effect, so a queued write can never be observed by a measurement. `flushStyles()`, `hasPendingStyleWrites()` and `resetStyleBatch()` come with it, and all of it is re-exported from `@cube-dev/ui-kit`. Batching stays off unless an app turns it on.

### Patch Changes

- [#1345](https://github.com/cube-js/cube-ui-kit/pull/1345) [`8fdee382`](https://github.com/cube-js/cube-ui-kit/commit/8fdee38230d0aee519df7db8c6edd5a6951910b7) Thanks [@tenphi](https://github.com/tenphi)! - `no-redundant-default-prop` now knows three defaults it used to miss: `ItemTable`'s `size` and `summary`, and `Pagination`'s `summary`. The registry it checks against is parsed line by line out of `*.docs.mdx`, so a documented default whose `(default: …)` annotation had been hard-wrapped onto the next line was invisible to the parser. Unwrapping the documentation surfaced them, and the generator proved each value against the component it belongs to.

- [#1352](https://github.com/cube-js/cube-ui-kit/pull/1352) [`40261f63`](https://github.com/cube-js/cube-ui-kit/commit/40261f631ff684c624f78f4132ab63338da211c7) Thanks [@tenphi](https://github.com/tenphi)! - `useContextMenu` and `useAnchoredMenu` now re-read `defaultMenuProps` on every render instead of snapshotting them when the menu opens. A menu whose content lives in those defaults — the row context menu in `Tree` and the tab context menu in `Tabs` both do — stayed frozen while open, so items appearing, disappearing or flipping `isDisabled` were invisible until it was closed and reopened. Runtime props passed to `open()`/`update()` still take precedence and are unaffected.

## 0.166.0

### Minor Changes

- [#1348](https://github.com/cube-js/cube-ui-kit/pull/1348) [`e0ccb9b0`](https://github.com/cube-js/cube-ui-kit/commit/e0ccb9b022269e45a9c35ebd97c66c7dd7e3c416) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: a fixed `cols × rows` matrix, two exported placement helpers, and a hover-ring opt-out.

  - **`rows`** renders exactly that many rows whatever the content needs — a matrix rather than a grid that hugs its widgets — and implies a `maxRows` of the same value, so `gridBounds` keeps every drag and resize inside it without a per-widget `maxH`.
  - **`rowHeight="stretch"`** divides the board's own measured height into those rows. Together the two express "a grid of a declared size that fills the box it is given": the board takes its parent's height and each cell an equal share, so resizing the container resizes the cells instead of adding or removing them. It engages only with `rows` set and a parent that has a height of its own; otherwise the board keeps its ordinary content-hugging behaviour at the default row height. Previously an app wanting this had to measure the box itself, divide by the row count, and feed the result back in as `rowHeight` — which meant rendering nothing until the first measurement landed.
  - **`placeInFreeSlot(others, item, cols, maxRows?)`** and **`distributeEvenly(layout, { cols, rows })`** are now exported. The first is the rule the board already applies when a dragged widget cannot stay where it was dropped; exporting it means a widget an app adds programmatically lands where a drag would have put it, instead of wherever the app's own re-implementation of the scan decided. The second tiles items evenly across both axes while keeping the row structure the layout already has, and is the one operation that deliberately grows items — which is why it is a call the app makes rather than a mode the board is in.
  - **`hoverRing`** (on `Board.Widget`, or for the whole board via `widgetProps`) turns off the resting ring a widget shows on hover. It is the affordance that says a widget can be picked up, and on scenery — a chromeless layout container, a spacer — it advertises an interaction the widget does not really offer. Turning it off used to mean overriding `styles.shadow`, which replaces the whole modifier map, so the `selected` ring and the drag lift had to be re-authored by hand just to drop the hover state.

### Patch Changes

- [#1346](https://github.com/cube-js/cube-ui-kit/pull/1346) [`3e5e3fee`](https://github.com/cube-js/cube-ui-kit/commit/3e5e3fee2e02a47519a22db35ecad2cf3c74988b) Thanks [@tenphi](https://github.com/tenphi)! - Tooltip: force wrapping of unbreakable content (URLs, tokens, identifiers) so it no longer overflows the tooltip.

## 0.165.0

### Minor Changes

- [#1338](https://github.com/cube-js/cube-ui-kit/pull/1338) [`4ffa6e03`](https://github.com/cube-js/cube-ui-kit/commit/4ffa6e03dc359d4226b2df4002f38a5811d42fdc) Thanks [@tenphi](https://github.com/tenphi)! - Add accessible nested tree rows, expansion state, hierarchy-aware operations, cascading ItemTable selection, grouped DataTable headers for pivoted results, and intrinsic table sizing with `isAutoHeight`.

### Patch Changes

- [#1343](https://github.com/cube-js/cube-ui-kit/pull/1343) [`947bd472`](https://github.com/cube-js/cube-ui-kit/commit/947bd472dc7de93265282eedd950c58c8c4ed386) Thanks [@tenphi](https://github.com/tenphi)! - Make Board's `collisionMode="swap"` source-aware: cross-board drops now insert only at an empty anchor, downscale without moving destination widgets, and cancel invalid transfers.

- [#1341](https://github.com/cube-js/cube-ui-kit/pull/1341) [`7a4b6778`](https://github.com/cube-js/cube-ui-kit/commit/7a4b6778bbc859f04394d7732362413a5436e6c5) Thanks [@tenphi](https://github.com/tenphi)! - Update Tasty to 3.1.0. Colour-token opacity is now applied with CSS relative colour syntax instead of the token's channel components, so every `#token.N` value — `#surface-text.04`, `#purple.10` and the rest — emits `oklch(from var(--surface-text-color) l c h / .04)`. The colours are unchanged, `#current.N` still composes with the alpha it inherits, and the `--*-color-rgb` companion variables are untouched, so raw CSS that reads them directly (`rgb(var(--primary-color-rgb) / .2)` in `GlobalStyles`) keeps working. Tasty also now treats `light-dark()` and `contrast-color()` as colours, alongside `color-mix()` and `color()`.

- [#1337](https://github.com/cube-js/cube-ui-kit/pull/1337) [`4594454b`](https://github.com/cube-js/cube-ui-kit/commit/4594454b8df49978de6a33f489e2871dfbdd5303) Thanks [@tenphi](https://github.com/tenphi)! - `TextArea` / `CommandTextArea`: `autoSize` no longer disturbs the page while typing, and a single line is one row again.

  - **The height is now measured off-screen instead of on the live textarea.** Measuring used to set `height: auto` on the real element, force a layout, then restore it — twice per keystroke. Any ancestor sharing the column re-laid out mid-keystroke, so in a chat layout the transcript's scroll viewport grew by the collapsed rows and its scroll offset moved; the browser's scroll anchoring undid that imperfectly, which reads as the whole conversation bouncing a pixel in the rhythm of typing. A textarea already grown past its `rows` minimum — the everyday state of a chat prompt — lost 40px of scroll offset per keystroke with anchoring out of the way.
  - **Row counting is fixed.** `height: auto` sizes a textarea from its `rows` attribute and the font's own metrics, and that height was being divided by CSS `line-height` to get a row count. Where the line height is tighter than the font's natural line box, one line of text counted as two rows, so an `autoSize` textarea with `rows={1}` rendered a row taller than its content. Row counting now rounds a measured content height that carries no such floor, which also stops a fractional line height (a zoomed page, a percentage preset) from adding a phantom row.

## 0.164.0

### Minor Changes

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - A `baseColor` now contributes its **saturation** as well as its hue, and `baseSaturation` follows the accent's chroma however that chroma was expressed.

  `baseColor` previously contributed hue only, which left a hole: picking a base color set which way the greys leaned but not how far, so the chrome's chroma still came from the accent seed and had nothing to do with the color chosen. Its **tone** is still discarded — the chrome's own lightness ladder is the design.

  ```ts
  setPaletteConfig({ baseColor: "#6e7076" }); // near-grey in, near-grey chrome out
  setPaletteConfig({ baseColor: "#FFD400" }); // saturation 100 in, clipped to 50
  ```

  The derived saturation is **clipped to `MAX_BASE_SATURATION`** (`50`, newly exported). Naming a base color says "the chrome _is_ this color", so it lands near it rather than at the 12% share `baseSaturation` otherwise inherits — but a fully saturated chrome stops being chrome, and the base colors converge above `25` anyway, so the clip costs nothing that was still moving.

  `baseSaturation`'s default also changes shape. Unset, it takes `0.12` of whatever the **accent zone** carries — the `saturation` seed, or an `accentColor`'s own chroma when one is set:

  ```
  input.baseSaturation
    ?? (baseColor  ? min(baseColor.saturation, 50)
                   : (accentColor?.saturation ?? saturation) * 0.12)
  ```

  Reading the accent color there is the one place a brand color reaches the base zone, and it has to: without it, a near-grey brand left the chrome carrying 12% of a saturation nobody asked for. Nothing here touches the palette-level `saturation`, so the status themes still inherit exactly what they did and the guarantee that a brand color cannot re-chromatise them is intact.

  The shipped palette is unchanged: with no color seed the expression is `saturation × 0.12` as before, and the snapshot is byte-identical.

- [#1333](https://github.com/cube-js/cube-ui-kit/pull/1333) [`cd07258c`](https://github.com/cube-js/cube-ui-kit/commit/cd07258cf9be82dc5139ff8664c69416a733540d) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: scoped drag grid lines, a corner resize-grip placement, and collision modes for the free grid.

  - **`showGridLines="drag"` now scopes the grid to the board taking part in the gesture** — the board owning the drag (its source, or whichever board the widget is currently over) or resizing one of its own widgets. Previously any drag lit up every board sharing a `Board.Provider`, including boards the widget could not land in. The old behaviour is still available, now opt-in, as `showGridLines="any-drag"`, which advertises every board as somewhere to land.
  - **`resizeGripPlacement`** (`'inside' | 'corner'`, default `'inside'`) on `Board` and `Board.Widget` positions the corner resize grips. `'corner'` centres each grip on the widget's corner — drawn outside the widget box, which clips its own content — so it lines up with a control centred on the opposite corner. The grip's hit-zone moves out with it, so the half that overhangs is grabbable and hovering it keeps the grip revealed. Edge grips are unaffected.
  - **`collisionMode`** (`'revert' | 'downscale' | 'swap'`, default `'revert'`) on `Board` resolves a drop the grid would otherwise refuse, where a collision blocks a move (`compact="free"`, or `preventCollision`). `'downscale'` shrinks the widget into the free space at the drop cell; `'swap'` trades places with one widget — the one the drop covers most, which takes the cell the drag began at — each keeping as much of its own size as fits, and falls back to `'downscale'` then `'revert'`. It never displaces more than that one widget, a drop straddling two widgets trades with one rather than refusing, and dragging back retraces the original arrangement. No mode ever grows a widget, and arrow keys honour the mode without ever resizing anything.

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - `ColorSwatch` is a component of its own, with sizes and automatic fitting.

  It was already exported — as an implementation detail of the color fields, with no size of its own and no docs. It now lives in `src/components/fields/ColorSwatch/`, ships stories and documentation, and takes a `size`:

  ```jsx
  <ColorSwatch color="#7a4dbf" />              // tracks the control around it
  <ColorSwatch color="#7a4dbf" size="large" /> // 28px
  ```

  - **`size`** — `small` / `medium` / `large` = `20px` / `24px` / `28px`.
  - **Left unset, the swatch sizes itself to its host.** `Item`, `Button` and the text inputs publish their height as the `$size` custom property, so a swatch in an `icon`, `rightIcon`, `prefix` or `suffix` slot lands `8px` inside it — `20px` in a `small` control, `24px` in a `medium` one, `32px` in a `large` one — with nothing passed between the two. Outside a control it falls back to `medium`.

  Nothing the kit renders changes size. `ColorInput` and `ColorPicker` keep the fixed `20px` swatch they have always drawn, at every field size: it reads as a value the field is showing rather than as part of the control, and a text input hangs its prefix off the border with no padding of its own, so a tracking swatch in a large field would sit against the edge. Automatic fitting is for a swatch you place yourself, where the host has the padding that makes it work.

  The import path `@cube-dev/ui-kit` is unchanged.

- [#1335](https://github.com/cube-js/cube-ui-kit/pull/1335) [`f777bbb3`](https://github.com/cube-js/cube-ui-kit/commit/f777bbb3c809484932b8cd6c2b9c15857e7ba7a8) Thanks [@solarrust](https://github.com/solarrust)! - `PrismCode` and `CopySnippet` take an `isWrapped` prop that soft-wraps long content instead of scrolling it sideways.

  By default both components keep each line on one line and scroll horizontally, which buries long error messages and logs off to the right. `isWrapped` lays the content out on multiple lines instead: unbreakable runs like URLs, tokens and identifiers break too (`overflow-wrap: anywhere`), not just spaces. On `CopySnippet` the block additionally grows vertically to fit — so even a single very long line is fully readable rather than clamped to the collapsed height — and the prop is forwarded to the inner `PrismCode`, which owns the wrapping itself.

  ```jsx
  <PrismCode code={longErrorMessage} language="bash" isWrapped />
  <CopySnippet code={longErrorMessage} language="bash" isWrapped />
  ```

  On `CopySnippet` it is a different axis from `nowrap` — `nowrap` collapses real newlines into one scrolling line, `isWrapped` breaks long lines — and `nowrap` wins when both are set. The copy button and syntax highlighting are unchanged.

- [#1332](https://github.com/cube-js/cube-ui-kit/pull/1332) [`ac2ec331`](https://github.com/cube-js/cube-ui-kit/commit/ac2ec331a5d5b5d6b7af4849b0870b41f6637324) Thanks [@tenphi](https://github.com/tenphi)! - `current` moves from the `type` axis to the `theme` axis on `Button`, `Item` (and `ItemButton`), `Item.Action` and `ItemBadge`. It was never a shape: it names where the colors come from — the inherited `currentcolor` rather than a brand ramp — which is the question `theme` answers. As a type it occupied the slot that decides emphasis, so picking `current` meant giving up the choice between a filled button, an outlined one and a bare label.

  On the `theme` axis it composes instead, and every type now has a `current` flavour:

  - `item` — the old `Item` shape: no border, nothing painted at rest, the fill stepping in on hover, pressed and selected.
  - `clear` — the same ramp plus the focus ring a standalone control needs. The default for `Item.Action` and `ItemBadge`.
  - `outline` — the old `Button` shape: a resting `#current.03` chip inside a `#current.08` border.
  - `outline-2` — `outline` for a container that is already painting something. The brand themes swap an opaque base (`#surface-3` for `#surface-2`); `current` has no opaque base to swap, so the same intent is carried by roughly doubling the tint at every step.
  - `primary` — the high-emphasis control, and the one flavour that fills opaquely, like every other theme's `primary`: the fill is the inherited color at full opacity and the label is punched out of it with the new `#current-fill` token, which defaults to `#surface` — the page background, which is always the opposite of the text painted on it and so follows the scheme for free. Hover and pressed lay a translucent `#black` over the same base, since an arbitrary color has no lighter or darker sibling to step to the way the brand ramps walk `accent-surface` to `-2` and `-3`. The rim comes from the same token at `.25` — every other `primary` rims its fill with `accent-surface-border`, cr 1.48 against it, and this measures 1.82 in light and 1.55 in dark. Disabled swaps the rim to `#surface-text.2`, which holds against a `.4` chip that a `#surface` rim would wash into. The label is painted with `-webkit-text-fill-color` rather than `color`: `#current` compiles to the literal `currentcolor`, which in `fill` resolves against the element's own `color`, so setting `color` to the label token would make the fill resolve to the label color and paint a white pill with a white label.

    `#current-fill` is a real color token with a default, not a bare custom property, so it takes the alpha suffix (`#current-fill.5` is the disabled label) and a container overrides it with one declaration — `styles={{ '#current-fill': '#fixed-dark' }}` — moving the label, the icon slots and the rim together. It exists for the one container the `#surface` default is wrong for: a container whose own text color IS the page paints `#white`, which IS `#surface` in light mode, so an unaided label measures cr 1.00 against its own chip. Its own fill is the right value there, since it contrasts with its own text by construction. Ordinary containers set nothing.

  - `link` — no chip at all. The brand themes intensify from `accent-text-soft` to `accent-text` on hover; here "soft" is the inherited color at `.8` and "strong" is it at full opacity.
  - `card` — the static panel: a `#current.05` fill inside a `#current.2` border (`Item` only).

  `current.outline` and `current.item` are byte-identical to the old `Button` and `Item` flavours, so nothing that used `type="current"` changes appearance.

  The top step of each ramp stops at `#current.24` in light. The dark counterpart is not authored: each `@dark` step is solved so its OKHST tone delta from the surface matches the light step's, which lands the two schemes on the same chip-vs-page contrast (1.084 / 1.083 at hover, 1.959 / 1.961 at the top step). That works out _lower_ than the light alpha throughout — `.031 / .046 / .13 / .175 / .221` against `.04 / .06 / .18 / .24 / .3` — because near the dark end of the scale a small sRGB move is a large perceptual one, so the same tint reads stronger on a dark surface than on a light page.

  ### Migration

  **`type="current"` is removed with no runtime fallback.** It resolves to no variant and falls back to base styles, the same as any other unknown type — there is no mapping and no deprecation warning. The spelling shipped one release ago and has no consumers outside the kit, so this is a clean break rather than a deprecation:

  | Old                            | New                                                     |
  | ------------------------------ | ------------------------------------------------------- |
  | `<Button type="current">`      | `<Button theme="current">` (type defaults to `outline`) |
  | `<Item type="current">`        | `<Item theme="current">` (type defaults to `item`)      |
  | `<Item.Action type="current">` | drop it — `current` is already the default theme        |
  | `<ItemBadge type="current">`   | drop it — `current` is already the default theme        |

  `Item` accepts `theme="current"` with every type except `header`, which stays theme-agnostic; the warning that fired for `type="current"` with any theme but `default` is gone, since there is no longer such a pair to reject.

  ### `Item.Action` / `ItemBadge` defaults

  `type` now defaults to `clear` and `theme` to `current`, and neither is read from `ItemActionContext` any more — the two axes are independent, so a shape no longer implies a color source and vice versa. Both defaults are plain values the lint registry can prove, which the previous `theme` entry (`skip: 'context'`) was not.

  This changes one case: an action that named a `type` but no `theme` used to inherit the host row's theme, and now takes the host's color through `currentcolor` instead. Inside a themed row the two are close by construction — a `danger` row paints `#danger-accent-text`, which is what the action then mixes from — but the chip is an alpha tint rather than the brand ramp. Pass `theme="default"` (or any other theme) to opt back into a fixed palette.

  `Banner` is the one in-repo consumer that needed a matching edit. Its actions ask for `type="outline"` and then cleared the border, because back then `outline` meant `note.outline` and friends — whose border is the opaque `#note-border`, a pale line built for a `#surface-2` chip on a light page and plainly wrong on a saturated banner. The fill carried the chip on its own there. On the `current` theme the border is `#current.08` mixed from the banner's own white label, and the fill is a 3% tint that cannot carry a chip by itself, so clearing the border left the action invisible. The override is gone and the type renders as designed.

  `ItemActionContext` no longer reaches the DOM at all beyond `isDisabled`. An interim version of this branch published the host theme as a `data-surface` attribute so the `current` ramp could pick per-surface alphas for the `special` theme's fixed dark-purple surface; that is gone, because only `ItemAction` and `ItemBadge` ever set the attribute, so `Button` and `Item` on the same surface silently fell back to the light ramp.

  ### Two nesting fixes

  Both fall out of `current.primary` keeping `color` as the fill rather than the label:

  - The `Actions` slot is recolored to the label, like the icon slots already were — a nested `Item.Action` defaults to `theme="current"` and mixes its own label from the `currentcolor` it inherits, so without this it took the chip color and vanished into it.
  - `ItemButton`'s `ActionsWrapper` reproduces the label rather than the chip, for the same reason on the sibling path.

  ### Also

  - `current` is registered in `TastyThemeNames`, so `theme="current"` autocompletes on every tasty component.
  - New `CurrentStates` stories on `Button` and `Item` sweep every type and state on the theme, inside containers that paint their own text color; the context sweeps are renamed `CurrentTheme`.

- [#1334](https://github.com/cube-js/cube-ui-kit/pull/1334) [`ffd1c7b5`](https://github.com/cube-js/cube-ui-kit/commit/ffd1c7b56ab4f2be9557841f7884c68ace3646ea) Thanks [@tenphi](https://github.com/tenphi)! - `LoadingAnimation` is retuned to sit next to the current monochrome `CubeLogo`, and the empty-crate illustration Cube Cloud has been carrying locally ships as `NoDataIcon`, drawn from the same three tokens.

  **The faces are near-neutral now.** `loading-face-1..3` used to take a fraction of the _brand_ seed saturation (0.3 / 0.62 / 0.66), which put the shadowed face at chroma **0.0676** — eight times `border` — so a spinner rendered as a purple gradient beside a logo drawn in `currentColor`. They now take `baseChroma(0.2)`, the same normalised share the neutral chrome takes (`border`, `placeholder`, the text ramp), landing at **0.0059 / 0.0161 / 0.0248**. The brand hue still carries, as a tint rather than as a color, and still follows a re-seeded palette.

  **Contrast, not tone, is the spec.** A relative tone delta is uniform on the OKHST scale, but the dark scheme resolves it inside the `darkTone` window, which compressed the ramp to ~75% of its light span. Measured against `surface`:

  |               | face-1 | face-2 | face-3    |
  | ------------- | ------ | ------ | --------- |
  | light, before | 1.063  | 1.320  | 1.915     |
  | dark, before  | 1.053  | 1.264  | **1.735** |
  | light, after  | 1.201  | 1.653  | 2.409     |
  | dark, after   | 1.212  | 1.666  | **2.424** |

  Glaze has no per-color `darkTone`, so the intent moves into a WCAG floor against `surface` and each scheme solves for it. The authored `tone: '-2'` is deliberately short of every floor, so all three faces are pinned by the ratio rather than by a delta that means something different in each scheme — light and dark now agree to within 1%, and the whole ramp is roughly a third stronger than it was (Oklab ΔL 0.271 in light, 0.231 in dark, against 0.204 / 0.154).

  WCAG rather than APCA, against the grain of the accent tokens: APCA's low-contrast clamp scores every step of a ramp this subtle as Lc 0, so it cannot express the difference between these three faces at all. Polarity-blindness — the reason APCA wins for text — costs nothing for a decorative fill whose only job is to separate from the page.

  High contrast used to be _identical_ to the normal tier here, because an unconstrained tone delta had nothing to escalate. The `[1.35, 2.1, 3.2]` HC entries roughly double each step's distance from the page.

  **`NoDataIcon`** is the isometric open crate used for empty tables and empty lists, moved out of `cubejs-enterprise` and onto the shared tokens — the local copy hard-coded `#e5e5ec` / `#b4b4c5` / `#69697c` and re-derived a dark variant in JS on every scheme change.

  It ships as an **illustration component** alongside `CubeLogo`, not as a member of the icon set, because it is not an icon in the two ways that matter: it is a three-tone drawing rather than a `currentColor` glyph (so it ignores `color` — flattening the faces to one tone loses the box), and it is drawn full-bleed rather than inset in a 24×24 grid (so it belongs at `size="8x"` and up, not inline with text). It is still built on `Icon`, so sizing and style props behave exactly as they do for one.

  The token names stay `loading-face-*` so Cube Cloud's theme color map keeps resolving; they now cover both pieces of artwork, and the recipe comment says so.

- [#1326](https://github.com/cube-js/cube-ui-kit/pull/1326) [`aa455803`](https://github.com/cube-js/cube-ui-kit/commit/aa4558037e8deceb34694c735c4931772f15e95b) Thanks [@tenphi](https://github.com/tenphi)! - `ItemAction` / `ItemBadge` now default to the inherited-color `current` flavour and stop mirroring the host row's `type` from context. (A later change in this release moves `current` from the `type` axis to the `theme` axis, so the default is spelled `theme="current"` with `type="clear"` — see "`current` moves from the `type` axis to the `theme` axis". The behaviour described here is unchanged by that move.) `current` derives every color from the inherited `currentcolor`, so one type covers every host type × theme combination that the context mapping used to enumerate — and, because `currentcolor` is inherited rather than resolved once, an action also follows its row through hover, selected and disabled instead of holding a fixed palette. The mapping in `ItemActionProvider` that folded `item` / `outline` / `outline-2` / `header` / `card` onto `clear` is gone.

  `ItemActionContext` stays. It still carries `disableActionsFocus`, `isDisabled`, the `theme`, and `type` — the last only for its _presence_, which drives the `context` mod that collapses an action's side margins. The provider's signature is unchanged, so no call site moved.

  Passing an explicit `theme` opts an action out of the inherited color and into that palette.

  Supporting changes:

  - **Selection reads as a filled chip.** Every other type marks `isSelected` with a brand _hue_ — an accent-tinted fill under an accent label — and `current` has one inherited color to work with, so it cannot. Alpha is the only channel left, and the neutral types' `.09` step read as a slightly dirty background rather than an "on" state, so a selected `ItemAction` / `ItemBadge` looked unselected. Selection now jumps clear of the interaction steps (`.18` in light) instead of continuing them, while hover and press stay subtle so a row full of actions is not busy. The dark scheme takes the same jump, scaled by the tone match described below.
  - **A scheme-aware alpha ramp.** Unlike the brand tokens, `#current` alphas do not adapt to the color scheme: the same tint is not the same step in light and dark. Each step therefore carries a base entry for light and an `@dark` counterpart, the dark one _derived_ — solved so its OKHST tone delta from the surface matches the light step's, which is also what puts the chip on the light step's contrast against the page. The direction is counter-intuitive: the dark alphas come out lower, because near the dark end of the scale a small sRGB move is a large perceptual one. Each step lives in its own custom property rather than inline in `fill`, because both ramps in one state-map would put twelve alpha values where Tasty's `mergeEntriesByValue` pass coalesces equal value strings into one OR-entry at the group's max priority and breaks negation against lower-priority rules.
  - **`ItemAction` regains a focus ring.** `CURRENT_ITEM_STYLES` follows the `*_ITEM_STYLES` convention of leaving focus to the collection that owns the row, which is wrong for a focusable action, so the ring came back on the action itself.
  - **`ItemButton` paints its actions' color.** It renders actions as a sibling of the button rather than inside it — deliberately, so they are not nested in a `<button>` — so `currentcolor` reached them from the page instead of the row: a `danger` row handed its actions neutral text, and a `special` row handed them the page's _dark_ text to tint on a dark purple surface. `ActionsWrapper` now carries the row's resting color, derived from the variant map rather than restating the palette.
  - **One variants map.** `Item`'s inline `theme.type` → styles object is now the exported `ITEM_VARIANTS`, shared with the color projection above so the two cannot drift.

  Every clear and trigger button across the field components now relies on that default instead of pinning a `type` or a validation `theme`: `Select`, `Picker`, `FilterPicker`, `ComboBox`, `SearchComboBox` and `SearchInput` clear buttons, `PasswordInput`'s masking toggle, `ColorInput`'s pipette, `DatePicker`'s calendar button and the ComboBox / SearchComboBox triggers. Each one now takes the color of the field it sits in, so it follows a custom theme rather than staying pinned to `default.clear`.

  Where that changes rendering, it changes it toward matching the field's own text:

  - `Picker` / `FilterPicker` clear buttons are unchanged — their trigger text already carries validation state, so the inherited color equals what the explicit theme produced.
  - `ComboBox` / `SearchComboBox` / `SearchInput` clear buttons and the ComboBox trigger move from the fixed `danger.clear` label to the input's own `#danger-accent-text` when invalid. The trigger previously stayed neutral beside red input text.
  - `PasswordInput`'s toggle now tints with the field instead of always rendering neutral.
  - `Select`'s clear button no longer turns red when the field is invalid. Its trigger keeps **neutral** label text in that state, so the button now matches its own field, and the red border still signals invalidity. `Picker` and `FilterPicker` are also `Item`-based but do tint their trigger text — that inconsistency lives in `Select` and is worth fixing there rather than being masked by a themed clear button.

  `ItemAction` / `ItemBadge` `type` therefore returns to a plain default in the lint registry. The `skip: 'context'` classification it was given existed because the prop resolved through `ItemActionProvider`; it no longer does. `isDisabled` is still context-resolved and still skipped.

- [#1327](https://github.com/cube-js/cube-ui-kit/pull/1327) [`5bebe7d1`](https://github.com/cube-js/cube-ui-kit/commit/5bebe7d10fa2d8abc3d80c71c004f74ba970a7f9) Thanks [@tenphi](https://github.com/tenphi)! - `MenuTrigger` / `DialogTrigger`: an action can now hand focus off to the surface it opens. Closing either overlay used to return focus to its trigger unconditionally — an item or button whose action opened a panel, a dialog or an inline editor lost focus to the trigger a tick later, so consumers had to out-race the overlay by re-focusing on every animation frame over a several-hundred-millisecond window. The restore is now skipped whenever focus already sits outside the closing overlay, so a single `focus()` from the opened surface's mount effect holds.

  Nothing changes when the action moves focus nowhere: focus still inside the overlay (the pressed control keeps it through the exit animation) or dropped to `<body>` returns to the trigger as before. A clicked control outside the overlay also keeps focus now instead of having it yanked to the trigger. For `DialogTrigger` this affects the `modal`, `tray`, `fullscreen`, `fullscreenTakeover` and `panel` types; `popover` already restored through `Dialog`'s own `FocusScope`, which declines to restore when focus moved.

  Both triggers also gain a `shouldRestoreFocus` prop (default `true`) for surfaces that claim focus _later_ than the restore — after an async load or an entry animation — where the trigger would otherwise take focus first and flash. It silences every restore path the trigger owns: `MenuTrigger`'s popover `FocusScope` as well as its manual restore, and for `DialogTrigger` the `Dialog`'s own `FocusScope` (reached through `DialogContext`, so a `Dialog` rendered outside a trigger keeps restoring focus as before).

  `Tabs`: the rename-from-menu flow no longer runs a refocus pass. Picking "Rename" used to re-focus the inline-edit input on an animation frame and again at 50/200/400ms purely to survive the closing menu; the input's own `FocusScope autoFocus` is now enough. Behaviour is unchanged — rename still lands in a live editing session, in every context-menu mode.

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - Add color-valued palette seeds. `accentColor` and `baseColor` accept a real color string — hex, `rgb()`, `hsl()`, `okhsl()`, `okhst()`, `oklch()` — so a brand can be given as the color you have rather than as a hue you had to derive:

  ```ts
  setPaletteConfig({ accentColor: "#2F5BFF", baseColor: "#7A7269" });
  ```

  The two are deliberately asymmetric. `accentColor` contributes hue, saturation and **tone**, and the tone is the point: the brand fill was previously authored as a fixed tone step off white, so every accent hue landed at roughly the same lightness and a yellow brand came out olive. `baseColor` contributes hue and saturation but **not tone**, because the chrome's own lightness ladder is the design — a base color says which way the greys lean and how far, not how dark they are.

  The color is handed to Glaze's `from`, so the **light, normal-contrast** variant reproduces it exactly — the fill, the link and the icon all render the value you passed. Dark and high contrast adapt as every other color does. Two APCA floors apply everywhere, both Lc 45 — one against the page so the button reads as a shape, one against the `#white` label it carries — and both are floors rather than targets: `#7A4DBF` clears them and is emitted untouched, while a light brand darkens only as far as the nearer one requires. They are APCA rather than WCAG deliberately, and the consequence is worth stating: **an emitted fill can sit below WCAG 3:1** (`#0EA5E9` lands at 2.77:1 and is correct there). High contrast escalates the page floor to Lc 60 and stops, because past that the window the two floors share closes and the label disappears off its own fill.

  Because the accent family now carries its own chroma, a brand color no longer raises the palette-level `saturation` to reach it — so it cannot leak into the **status themes**. `#danger-accent-surface` is now identical whatever the brand is. (The neutral chrome is the one deliberate exception: `baseSaturation` takes a 12% share of the brand's own chroma, capped by the seed, so a near-grey brand leaves near-grey chrome. See the base-color changeset.) Status themes also do not inherit the literal itself (`extend()` copies defs, so an inherited `from` would make a danger button the brand color outright); `special` does follow it, being the brand-on-dark CTA.

  `ResolvedPaletteConfig` gains `accentTone`, and `colorSeed()` is exported for reading hue / saturation / tone off a color directly. The shipped palette is unchanged — a config with no color seed resolves bit for bit as before.

  Make `pastel` and `saturation` two explicit paths rather than two knobs that fight. Pastel is one flat chroma ceiling, so a second saturation scale on top of it only undid the evenness it exists for — under `pastel` the seed is now pinned to `100`. Setting a `saturation` therefore **turns pastel off**, since tuning a saturation is the non-pastel path by definition, so `setPaletteConfig({ saturation: 55 })` keeps resolving to 55 exactly as before. An explicit `pastel: true` written next to a saturation wins and the saturation is ignored with a dev warning, but it is kept rather than dropped, so turning pastel back off restores the number.

  Fix the brand fill ramp collapsing in high contrast under a color seed: `accent-surface` and `accent-surface-2` previously solved to the same value there, so the hover step disappeared.

  The `Theme Builder` story gains a **Seeded by** switch that flips the whole palette between numeric seeds and color seeds, and swatches of the two tokens a color seed's tone reaches — `Accent Fill` and `Accent Text` — which is what makes the pastel chroma cap visible rather than mysterious.

- [#1336](https://github.com/cube-js/cube-ui-kit/pull/1336) [`acb9ab59`](https://github.com/cube-js/cube-ui-kit/commit/acb9ab5966499a0b061310b0912de66bac1c1512) Thanks [@tenphi](https://github.com/tenphi)! - Give every palette zone one seed, and let a status theme take a color.

  **BREAKING (`setPaletteConfig` / `<Root palette>` / `renderColorTokens` / `renderPaletteTokens`).** The six flat seed fields collapse into one `PaletteSeed` per zone — a color string, or `{ hue?, saturation? }`:

  | was                                      | is                                                  |
  | ---------------------------------------- | --------------------------------------------------- |
  | `hue`, `saturation`                      | `accent: { hue?, saturation? }`                     |
  | `accentColor`                            | `accent: '#…'`                                      |
  | `baseHue`, `baseSaturation`              | `base: { hue?, saturation? }`                       |
  | `baseColor`                              | `base: '#…'`                                        |
  | `themes.<status>: { hue?, saturation? }` | unchanged, and now also `themes.<status>: '#…'`     |
  | `themes.code: { saturation? }`           | unchanged — it takes no hue and no color, by design |

  ```ts
  setPaletteConfig({
    accent: "#2F5BFF",
    base: "#7A7269",
    themes: { danger: "#b91c1c", success: { hue: 150 } },
  });
  ```

  The union **is** the exclusivity. A zone was always seeded either by a color or by numbers, but the old shape let you write both and needed a precedence rule to settle it (`hue` outranked `accentColor`). Now it cannot be written, so there is no rule to learn — and a patch that switches form replaces rather than merges. The one capability this removes is the hybrid that precedence allowed: `resolvePaletteConfig({ hue: 30 })` over a stored brand color previewed "this brand, rotated, tone intact". A numeric seed now takes the zone over outright.

  `ResolvedPaletteConfig` keeps its flat shape — `hue`, `baseHue`, `saturation`, `baseSaturation`, `accentColor`, `accentTone`, `accentSaturation` — so anything reading the resolved config is unaffected. Its four status entries gain `color` and `colorTone`. `PaletteThemeSeed` is replaced by `PaletteSeed`; `PaletteNumericSeed` and `ResolvedThemeSeed` are new.

  **Status themes can now be seeded by a color**, which is what the union was blocking. `themes.danger: '#b91c1c'` renders that red on `#danger-accent-surface` — reproduced in light at normal contrast, adapting in dark and high contrast — and reaches `#danger-accent-text`, `-text-soft` and `-icon`. It inherits the brand path's softened APCA floors (Lc 45 against the white label, Lc 25 against the page) in place of the white-anchored ladder's `['AA','AAA']`, and the same tone cap, so a pale status color is pulled down rather than shipped as a white `type="primary"` label on white.

  One rule differs from the accent's, deliberately: **a status color's chroma becomes that theme's seed.** An accent color's does not, because all four status themes inherit the accent's saturation and raising it would re-chromatise every one of them; nothing inherits from a status theme, so there is nothing to protect. Moving the seed is also what holds the theme together — its tinted banner surface, border and text ramp are authored as factors of the seed (`0.2`, `0.3`, `0.25`), so leaving it at `100` beside a muted fill would give a fully tinted banner under a washed-out button. Moving it keeps the shipped `1.0 : 0.2 : 0.3 : 0.25` ratio exactly.

  Two consequences worth stating. A muted `saturation` _beside_ an accent color is no longer expressible — a color leaves the inherited seed at its default, so mute the status themes individually if you want that. And the legacy `#danger` / `#success` / `#warning` / `#note` aliases resolve to `#<theme>-accent-surface`, so a status color moves every one of them across a consuming app; that is the point, but it is the blast radius.

  The Theme Builder's **Color** tab now covers all six zones: each status chip opens on a color field with its hue and saturation sliders gone, entering the tab converts the four status themes to the fill each is already emitting rather than to a sample hex, and leaving it pins their hues back. The shipped palette is unchanged — a config with no color seed resolves bit for bit as before.

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - Add `surfaceMode: 'neutral' | 'tinted'` and a separate `baseSaturation` seed.

  A neutral `surface` sits at the extreme of the tone scale — pure white in light — and chroma needs distance from the extreme to exist at all, so on a light page the surface was white whatever saturation the palette carried. `surfaceMode: 'tinted'` moves the whole surface ramp two tones inward, which is the room the base hue needs to land on the page itself:

  ```ts
  setPaletteConfig({ surfaceMode: "tinted", baseSaturation: 25 });
  ```

  Everything below `surface` is positioned relative to it, so the ladder, the borders and the text ramp follow, and the text's `['AA','AAA']` floors re-solve against the new background rather than drifting. The `code-*` family's mirrored surface tracks it too — it exists to be the page.

  The **tinted** surfaces move with it as well. A status theme's `surface`, and a runtime tint's from `getColorTheme()`, is an offset from the page's rather than an absolute tone — and that offset is exactly the two tones `tinted` shifts by, so anchored absolutely they would land on the page's own new tone and a `note` banner would stop reading as a banner. They keep their separation in both schemes, and pick up a little more chroma for being further from the extreme.

  `baseSaturation` is the base zone's own saturation seed, opening the same seam `baseHue` already opens: the chrome is the one family whose job is _not_ to look like the brand. It is on the same 0–100 scale as `saturation`, and **the shipped chrome is `12`**, so the interesting range is the low end; the base colors keep their proportions to one another until the highest of them saturates around `25`.

  - Left unset it is `0.12` — `surface`'s own factor — of whatever the accent zone carries, so an untouched palette resolves exactly as before and a muted `saturation` still mutes the chrome.
  - Unlike `saturation`, writing it does **not** turn `pastel` off: how much hue the chrome carries says nothing about which chroma space the palette is in.

  Both are shipped defaults-off: `surfaceMode` defaults to `'neutral'` — the surface at the end of the tone scale, which is exactly what a neutral one is — and the resolved palette is unchanged token for token.

### Patch Changes

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - A pinned brand color is held to an APCA floor instead of a WCAG ratio, which softens the constraint where it was over-tight.

  Custom color mode only. The shipped palette is untouched — it runs the `null` accent arrangement, whose `['AA','AAA']` floors are unchanged and still snapshotted.

  WCAG 2.x is polarity-blind, so the old `[3, 7]` meant two very different things depending on the scheme. Measured with Glaze's own `apcaContrast` across 12 hues at 30° steps, the fill sitting exactly at the old floor comes out at **Lc 56.2 in light** (55.8–56.5) but only **Lc 23.3 in dark** (22.7–24.4). Hue is not a factor — the spread is under 2 Lc across the whole wheel — polarity is. One number was therefore 2.4× stricter in light than in dark, which is why light brands kept getting crushed while dark ones sailed through, and it left dark-mode fills below APCA's own `non-text` floor of 30.

  - `accent-surface` → `{ apca: [45, 85] }`. Lc 45 is APCA's `large` tier. The base stays `surface`, so with the `bg` polarity Glaze solves `apcaContrast(surface, fill)` — in light, where `surface` is `oklch(1 0 0)`, that is white-on-fill, the pair every `type="primary"` label rides on.
  - `accent-text-soft` → `{ apca: [60, 85] }` and `accent-text` → `{ apca: [75, 92] }`, APCA's `content` and `body` tiers, one step apart so the rest→hover intensify cannot collapse onto one color.

  In light this is a real relaxation: the floor drops from ~WCAG 3.0 to ~WCAG 2.3, giving a brand about 8 tone points more headroom before it is darkened. `#0EA5E9` now renders at 2.77 against the page instead of being pushed to 3.0.

  Two things worth knowing. The high-contrast tier can no longer say "AAA in both schemes": WCAG 7 is Lc 83.5 in light but Lc 54.4 in dark, so no single Lc restates it. `85` is the closest — ~6.1 in light, a shade under AAA, and ~15 in dark. And the tier has to be APCA at all because Glaze rejects a `contrast` pair that switches metric between its normal and high-contrast entries, which is a fair guard rather than something to work around.

  Anchoring the fill to `accent-surface-text` to make "from white" literal in both schemes was tried and rejected: in dark the label root is near-white while the page is not, so the floor stopped constraining the fill against the page and `#111827` came out at WCAG 1.16 against the dark surface — invisible.

  The fill carries **two** floors, not one, because in dark they pull opposite ways and dropping either produces the mirror image of the other's failure.

  Glaze takes one `base` per color, so only the page floor can be expressed as a `contrast`; the label floor is a cap on the seed tone, searched against Glaze's own fixed-mode resolution rather than a reimplementation of the dark tone window. It only ever lowers, so a brand that was already dark enough is emitted unchanged.

  - **Page floor** (`contrast` against `surface`) — the button has to be a visible shape. Without it `#111827` puts the fill at **Lc 0.0 against the dark page**: a blazing white label on a shape that is not there. The border does not stand in for it, being deliberately low-contrast.
  - **Label floor** (the seed cap) — the `#white` that every `type="primary"` item paints has to be readable. Without it `#FFFFFF` clears the page floor in dark at WCAG 14.4 while the label lands on **Lc 0** — the label is exactly its own fill.

  In light the page IS white, so the two collapse into the single measurement Glaze already makes and the cap never fires.

  This also reaches the `special` theme, whose `SPECIAL_PRIMARY_STYLES` paints `#white` on the same brand fill. `#FFD400` is one of the colors the cap moves — white on it untouched is Lc 28 — so the brand's hue carries into the hero button but its tone is capped. The test that asserted the literal survived unchanged now asserts the hue arrived, since exact equality there was a demand that the button's own label be unreadable.

- [#1336](https://github.com/cube-js/cube-ui-kit/pull/1336) [`acb9ab59`](https://github.com/cube-js/cube-ui-kit/commit/acb9ab5966499a0b061310b0912de66bac1c1512) Thanks [@tenphi](https://github.com/tenphi)! - Fix a color-seeded accent fill collapsing to one value across the dark tone range.

  The brand fill answers to two APCA constraints, and they were sized the same. The `#white` label it carries needs Lc 45 — text strength, because it is text. The page it sits on was asked for Lc 45 too, escalating to Lc 60 in high contrast, which is a demand that a filled shape reach text-grade contrast against the background.

  Nothing in the palette meets that. Measured on the emitted tokens, the **shipped** `accent-surface` — the white-anchored ladder every primary button used before color seeds existed — sits at **Lc 25.5** off the dark page and **Lc 19.3** in dark high contrast, where the ladder darkens the fill toward its label. So a color-seeded fill was being held to 1.8x and 3.1x what the design system's own button achieves.

  The two look identical in light, which is how it went unnoticed: there `surface` **is** white, so one measurement is both constraints at once and Lc 45 is right for the pair. In dark the page is near-black, and because a floor can only lighten, the surplus flattened the tone axis: every seed below the floor solved to the same fill. Measured across the axis at one hue, the dark fill was pinned at tone 66 for every seed from 5 to 65 — a brand's whole dark half collapsing onto one lavender — while light passed the same seeds through untouched. In dark high contrast the floor met the label cap and left a window of a single value.

  The page floor is now **Lc 25 in both tiers**, calibrated to the shipped fill rather than to a text threshold. The same sweep now tracks the seed from tone 47 up, and 47 is where the shipped fill sits in dark, so the dark range went from 7.7 tones to ~27 against light's ~45. The pair is written with both entries equal in order to suppress APCA's automatic +15 Lc enhancement in high contrast: that tier is a request for separation over brand, but not for separation from the page — the same fill carries the label, and driving it off the page drives the label off it.

  The white label is unaffected. It never depended on this number: it is guaranteed by the tone cap on the seed, which searches all four variants against pure white. A lower page floor lightens less, so it makes that guarantee safer rather than weaker.

  Light mode is unchanged — a dark brand on a white page measures Lc 100+, so this floor never bound there. Palettes with no color seed are untouched: the white-anchored ladder keeps its `['AA','AAA']` floors.

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - Four fixes to the pinned-brand accent path, from review.

  **An explicit `hue` now rotates the whole accent ramp.** `resolveConfig` ranks a numeric `hue` above the one an `accentColor` carries, but `buildPalette` handed Glaze the original literal — so `accent-surface` kept the color's hue while `-2`, `-3` and `hover` followed the theme's. A primary button changed hue on hover. The seed is now built from the resolved hue, chroma and tone rather than the string, and the regression test asserts on emitted tokens rather than on `getPaletteConfig().hue`, which was already correct while the ramp was split.

  **The white-label floor now holds on the emitted fill.** The ceiling was computed on the bare seed, but what ships is the fill after the page floor has had its turn — and that floor can only lighten, which is what weakens a white label. A 3072-case sweep over hue, chroma, tone, scheme and tier found 720 failures, the worst putting the label at Lc 20.7. Three things fixed it: the ceiling is now a property of the hue/chroma pair rather than of the tone asked for (it previously only searched when the requested tone already failed, so a dark tone probed first let every later light tone escape), it searches to a measured +3 Lc margin so the page floor cannot eat back through 45, and the high-contrast page floor drops from Lc 85 to 60.

  That last one is geometry, not preference. The two floors pull opposite ways in dark: the page wants a lighter fill, the label a darker one. The window they share is `L ∈ [0.605, 0.735]`, and asking 85 of the page empties it outright — 60 is the largest value that keeps it open, with 65 reopening 768 failures. High contrast escalates the fill only as far as its own label can follow.

  **The accent-cap cache is versioned.** It resolves through Glaze's global settings, including the dark tone window, so a caller running `glaze.configure(...)` then `invalidatePaletteTokens()` had changed the answer without changing the seed. Keyed on the palette version now, which is what makes that API mean what it says.

  **Replacing one unparseable color with another registers.** Both resolve to `null`, and the pin signature recorded only whether the field was present, so `setPaletteConfig({ accentColor: 'bad-two' })` after `'bad-one'` returned early — input kept the first string and no subscriber heard. The signature carries the two color values now.

  Documentation across the JSDoc, the Theme Builder tooltip, `Theming.docs.mdx` and the earlier changeset no longer promises WCAG 3:1. The floors are APCA Lc 45, and an emitted fill can legitimately sit under 3:1 — `#0EA5E9` renders at 2.77:1 and is correct there.

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - The accent label cap hands Glaze its probe seed as an `OkhstColor` instead of a formatted string.

  `from` accepts `string | OkhslColor | OkhstColor | RgbColor | OklchColor`, so the seed never needed to become text. Dropping `formatOkhst` removes the writers' scale question from this path entirely — and with it the two decimal places `okhst()` rounds to. `#7A4DBF` round-tripped through a string came back `0.450200` against a true `0.450191`.

  No Glaze change: `OkhstColor` is existing 2.0.0 API.

  One test moves with it. The cap's floor is measured on the emitted token, whose `oklch()` string carries four decimals, so `#FFD400` now reads Lc 44.9925 where it used to read a hair over 45 — the string round-trip had been rounding it up. The assertion takes the same epsilon treatment the high-contrast one already had (`84.9` for an 85 target). The shortfall is 0.0075 Lc, three orders of magnitude below anything visible, and the change is in the direction of accuracy.

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - `ColorInput` and `ColorPicker` keep the `20px` swatch they have always drawn.

  Giving `ColorSwatch` a size of its own changed both of them by accident. `ColorInput` passed the field's size straight through, so a `medium` field's swatch went `20px → 24px` and a `large` one `20px → 28px`; the `ColorPicker` trigger was left to track its button and moved `20px → 24px` the same way. Measured in a real browser against `main`, at every field size.

  Neither was a size anyone asked for. The swatch in a color field reads as a value the field is showing, not as part of the control, so it is now pinned at `20px` in both — identical to `main` at `small`, `medium` and `large`.

  The `size` prop and the automatic fitting are unchanged and remain the right thing for a swatch you place yourself in a `Button` or an `Item`, where the host has the padding that makes it work. A text input hangs its prefix off the border with none of its own, which is why the fields opt out.

  Also corrects the docs, which gave the automatic fit in a `large` control as `32px` where it is `28px`.

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - A manual `contrastLevel` no longer suppresses the high-contrast tier (via `@tenphi/glaze` 1.5.0).

  The level now does one thing: it positions the **normal** colors on the 0–100 slider. The high-contrast tier stays the true high-contrast resolution — identical to what `contrastLevel: 'auto'` emits — at every level, so the two **compose** rather than replace each other: a product's own contrast slider raises the baseline while `<html data-contrast="high">` / `prefers-contrast: more` still escalates on top of it.

  Two consequences for anyone who had set a level:

  - `contrastLevel: 0` now reproduces `'auto'` output exactly, high-contrast tier included. Shipping the slider and defaulting it off therefore costs nothing — previously it silently dropped the tier, so `data-contrast="high"` stopped working the moment a level was set.
  - At `contrastLevel: 100` the normal colors already _are_ the high-contrast ones, so a separate tier would only duplicate them: a single light/dark set is emitted. That is now the only level at which the tier is absent.

  `renderColorTokens()` / `renderPaletteTokens()` follow the same rule — `highContrast: true` returns the genuine escalated variant at any level below 100.

  The shipped palette is unaffected: it runs at `contrastLevel: 'auto'`, and the default-palette snapshot is unchanged.

- [#1332](https://github.com/cube-js/cube-ui-kit/pull/1332) [`ac2ec331`](https://github.com/cube-js/cube-ui-kit/commit/ac2ec331a5d5b5d6b7af4849b0870b41f6637324) Thanks [@tenphi](https://github.com/tenphi)! - Fix the `current` theme fading a disabled label twice.

  `current.item` and `current.clear` already suppressed their own `.4` label fade when the disabled state was inherited from a host that had faded `currentcolor` already, but `current.outline`, `current.outline-2`, `current.primary` and `current.link` stated it as a bare `disabled`. Two of those — `outline` and `primary` — are reachable `Item.Action` types, so an action inside a disabled row (including `Banner`'s outline actions) multiplied the two fades and rendered at `.16` of the row's color, washing out both the label and the alpha chip.

  Every `current` flavour now gates the fade on `disabled & !inherit-disabled & !inside-wrapper`. The second mod closes the other half of the same hole: `ItemButton` renders its actions as siblings of the row inside a wrapper, and the wrapper reproduces the row's disabled color so those siblings inherit a faded `currentcolor`. It previously could not, because the gated key was skipped when deriving the wrapper's colors — so a disabled `ItemButton` on the `current` theme sat next to full-strength actions. The wrapper now reads the gated value, and the row suppresses its own fade under `inside-wrapper`, leaving exactly one `.4` on every path.

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - `@tenphi/glaze` 2.0.0, whose one breaking change is the `format*` scale fix ([tenphi/glaze#93](https://github.com/tenphi/glaze/issues/93), [#94](https://github.com/tenphi/glaze/pull/94)).

  `formatOkhsl` / `formatOkhst` / `formatRgb` / `formatHsl` / `formatOklch` took `s` / `l` / `t` as 0–100 percentages while every producer — `resolve()`, `variantToOkhsl`, `srgbToOkhsl`, `oklabToOkhsl`, `okhslToSrgb` — returns them on 0–1. Composing the two was off by 100× and failed silently, since `0.7` is a legal percentage and the result was a valid CSS string naming a near-black color. Glaze now speaks one scale end to end, and a leftover `* 100` warns instead of shifting the color quietly.

  Every affected call site drops its scaling: `formatColor` in the color field (five notations, whose tests assert exact strings like `okhst(29.23 100% 58.59%)`) and the accent label cap in the palette. Output is unchanged — the palette's four-variant token values are byte-identical before and after, and Glaze's own export methods were compensating internally.

  The tone axis is the exception the release notes call out: `toTone` / `fromTone` still speak the authoring API's 0–100, so a tone is divided by 100 on its way into `formatOkhst` while a saturation read off `resolve()` is passed straight through.

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - `HueSlider` prints its value in degrees.

  A hue is an angle, and the slider already renders its value beside the label — so a caller who wanted the unit had to put it in the label instead, which then repeated the number the slider was showing anyway. It now defaults `formatOptions` to `{ style: 'unit', unit: 'degree', unitDisplay: 'narrow' }`, giving `280°`. Pass your own `formatOptions` to override it.

- [#1314](https://github.com/cube-js/cube-ui-kit/pull/1314) [`781973c9`](https://github.com/cube-js/cube-ui-kit/commit/781973c99eaf5c4598d77bfccefbc4f7db52674c) Thanks [@tenphi](https://github.com/tenphi)! - `RadioGroup` is `border-box`, so an explicit width means the box you can see.

  The `tabs` layout is the one with padding of its own, and it was laid out as `content-box`: `<Radio.Tabs styles={{ width: '100%' }} />` came out `1x` wider than its container and overhung the right edge. The color popover's space switcher (HST / LCH / RGB) was the visible case — it touched the popover border while everything above and below it sat inside the padding.

  Groups without an explicit width are unaffected: they size to `max-content`, which measures the same either way.

- [#1332](https://github.com/cube-js/cube-ui-kit/pull/1332) [`ac2ec331`](https://github.com/cube-js/cube-ui-kit/commit/ac2ec331a5d5b5d6b7af4849b0870b41f6637324) Thanks [@tenphi](https://github.com/tenphi)! - Fix the `selected & disabled` state on the `outline`, `outline-2` and `clear` types across the `default`, `danger`, `success`, `warning` and `note` themes: it was heavier than the enabled state it is supposed to mute.

  The state borrowed `accent-disabled-surface` / `accent-disabled-surface-text` — the pair built for a PRIMARY button, whose enabled state is already an opaque brand fill under a `#white` label, so a mid-tone chip is a step _down_ there. On a non-solid type it is a step _up_: against a 9% brand tint under soft accent text, the `-13` chip read as a filled pill, and its `tone: 'max'` label resolved to literal white in light mode. A disabled segmented control therefore drew more attention than a live one, and the selected option looked like the only enabled one.

  It now keeps the enabled selected chip and fades only the label. The chip is the thing that says "this one is on", so it does not change weight at all when the control goes disabled; the label drops to a new `accent-disabled-text` token — the neutral `disabled-surface-text` geometry (the same `-23` tone delta against `surface`, adaptive, so it reads exactly as disabled as every other disabled label in light, dark and high contrast) carrying brand chroma instead of neutral, at roughly 2× `disabled-surface-text` and comfortably under `accent-text-soft`. Selection survives as a hue on a label of unchanged paleness, which is what CUB-3912 asked for: a disabled segmented control still shows which option is active.

  The chip's tint tracks whatever token that theme's `selected` state uses — `accent-surface` for the outline types and for `default.clear`, `accent-text` for the four status themes' `clear`, which do not share `default`'s token. It is written as `.08` rather than reusing `selected`'s own `.09`, and the difference is deliberately imperceptible. The two entries must not serialize to the same string: Tasty's `mergeEntriesByValue` pass coalesces equal values into one OR-entry at the group's max priority, so a literal reuse would merge `selected` into `selected & disabled` and then negate against `selected & (hovered | focused)` — the "selected-hover stays dark" bug that `SPECIAL_CLEAR_STYLES` documents and escapes the same way.

  No existing token changed value — the palette addition is `accent-disabled-text` and nothing else. `primary` keeps `accent-disabled-surface`, which is correct for a solid fill; the `special` and `current` themes keep their own white-alpha and `currentcolor` registers.

  A unit test pins both halves of the invariant across all fifteen brand-theme x non-solid-type variants: the disabled selected fill must equal the enabled one modulo that alpha, and the label must be the `accent-disabled-text` of its theme.

  The `special` theme gets the same treatment, plus a correction its non-selected disabled state needed on its own. Every disabled label there sat far above the house figure for a dead control: measured against the chip it sits on, `outline` disabled came out at cr 3.24 and `outline` selected + disabled at 4.21 — not only too legible, but the wrong way round, since the selected one out-read the plain one. For scale, `disabled-surface-text` measures ~2.02 against `surface` and this theme's own `primary` disabled pair measures 1.73. The white-alpha labels are now solved for cr ~2.0 against whatever each one sits on: `#white.23` for the plain disabled states across `outline`, `clear`, `item` and `link`, `#white.28` for `outline` selected + disabled on its `.17` chip. `outline` selected + disabled keeps the enabled selected chip like the colored themes (`.17` against its `.18`), and `clear` — whose selected state flips to a solid white pill — keeps that pill and fades its DARK label instead, to `#special-accent-text.45`, cr 1.95 against the pill.

  The `current` theme's `clear` flavour gains the same state, which it was missing entirely: a disabled selected `clear` fell through to the item ramp's bare `transparent` and rendered no chip at all, so it was indistinguishable from an unselected one. It now carries `#current.18` — `current.outline`'s own disabled selected chip, so the two differ by exactly the border. This is the same split the colored themes already make between `*_ITEM_STYLES` and `*_CLEAR_STYLES`.

- [#1328](https://github.com/cube-js/cube-ui-kit/pull/1328) [`cfa6fb6e`](https://github.com/cube-js/cube-ui-kit/commit/cfa6fb6edb665959ad206829a2fa34ffefc7b97c) Thanks [@tenphi](https://github.com/tenphi)! - Update `@tenphi/tasty` to `3.0.2`. A patch release with no public API change — the export surface is byte-for-byte the same set of names as `3.0.1` — so nothing in the UI Kit needed migrating and the full suite passes unchanged.

  Two clarifications in Tasty's docs are worth knowing if you write custom tokens: token names are case-sensitive and should start lowercase (a leading capital folds, so `$Foo` resolves to `--foo`), and `preset` / `transition` take token _names_ rather than values, so a bare `$name` there warns in dev and is ignored. Neither affects this package — no capitalized token name is used anywhere in `src`.

  The tree-shaking size budget goes from 123 kB to 124 kB. Tasty's core grew ~0.56 kB in this release, which put the old budget 31 bytes over; the `All` entry moved by the same amount and stays inside its 501 kB budget.

## 0.163.0

### Minor Changes

- [#1323](https://github.com/cube-js/cube-ui-kit/pull/1323) [`82616524`](https://github.com/cube-js/cube-ui-kit/commit/826165244c923627a036a66af386f5a8478986bb) Thanks [@tenphi](https://github.com/tenphi)! - `Radio` / `Radio.Button`: a button- or tabs-type radio now accepts the full content API of the `Item` it renders, matching `ItemButton`. Newly forwarded: `descriptionPlacement`, `descriptionProps`, `keyboardShortcutProps`, `isLoading`, `loadingSlot`, `highlight`, `highlightCaseSensitive`, `highlightStyles`, `level` and `labelRef`. `description` now has a grid area to land in, so it renders in both `inline` and `block` placement, and container style props (`padding`, `gap`, `fill`, `preset`, …) apply to button-type radios instead of being dropped. A loading button radio is also disabled, so it no longer takes clicks or arrow-key selection — pass an explicit `isDisabled={false}` to opt out.

- [#1319](https://github.com/cube-js/cube-ui-kit/pull/1319) [`2a8d0b4a`](https://github.com/cube-js/cube-ui-kit/commit/2a8d0b4ad6e05b913a7aa6ca0eade56ff5e151ff) Thanks [@tenphi](https://github.com/tenphi)! - Lint ui-kit's own source with the `no-redundant-default-prop` rule it ships, and fix four registry entries that autofixing would have broken.

  The plugin was never applied to this repo. Two things prevented it, and the second was silent: nothing loaded the plugin, and provenance is gated on the import specifier literally matching `@cube-dev/ui-kit`, which no file in `src/` uses — every component import here is relative, across 210 distinct specifiers that share no usable prefix. So even once loaded, the rule reported nothing.

  - New `relativeImports` rule option, which also accepts relative specifiers as ui-kit provenance. It exists for linting this repository and must not be enabled in a consumer project, where a relative import is the consumer's own component. Shadowing still bails either way — resolution requires an `ImportBinding`, so a local `const Badge = tasty({})` is never matched.
  - `configs.recommended` now sets stories and `.docs.mdx` to `warn` instead of `off`. Stories are the code people copy, so redundant props there travel outward and are worth surfacing; a deliberate side-by-side contrast still has a real reason to name a default, so it warns rather than failing a build.

  Four props were classified as plain defaults when they are actually inherited overrides, so the rule would have offered — and `--fix` would have taken — an autofix that changed behaviour. Each is now `skip: 'context'`:

  - `ItemAction` `isDisabled` and `type`. `<Item isDisabled>` renders its `actions` inside `ItemActionProvider`, and `isDisabled = isDisabledProp ?? contextIsDisabled`, so `<ItemAction isDisabled={false}>` is the documented way to keep one action live inside a disabled item. Stripping it silently disabled that action.
  - `ItemBadge` `type` and `theme`, which read the same context and had no conditions on their fixture at all.
  - `Dialog` `isDismissable`, resolved as `contextProps.isDismissable` with no literal fallback while `DialogContainer` and `DialogTrigger` default that context value to `true`, so a nested `<Dialog isDismissable={false}>` is an override. Three call sites in shipped source relied on it.

  The cause is general: a prop resolved as `prop ?? context ?? literal` probes as a plain default in a bare tree, because the literal wins when nothing supplies the context. Only `ItemAction`'s `theme` was classified correctly, and only because it happened to be the one prop with a matching condition. The fixtures now supply a differing value for each such prop, so the prover derives these skips itself and the sync guard re-proves them on every test run rather than trusting a hand-written note. A repo-wide audit for the pattern found no other affected component.

### Patch Changes

- [#1323](https://github.com/cube-js/cube-ui-kit/pull/1323) [`82616524`](https://github.com/cube-js/cube-ui-kit/commit/826165244c923627a036a66af386f5a8478986bb) Thanks [@tenphi](https://github.com/tenphi)! - `Item` themes: a disabled item now keeps showing whether it is selected. The `disabled` entry in every `outline`, `outline-2` and `clear` variant used to override `selected` outright, so a disabled segmented control — `RadioGroup type="button"` most visibly — rendered every option identically with no sign of which one was active. Each of those variants gains a `selected & disabled` state that paints the brand-tinted `accent-disabled-surface` chip and its paired label instead of the neutral one, across all six themes (`special` and `current` stay in their own white-alpha / `currentcolor` registers). `type="item"` rows are unchanged — they already keep brand identity in their disabled label and pair selection with a checkmark.

- [#1322](https://github.com/cube-js/cube-ui-kit/pull/1322) [`b56c0073`](https://github.com/cube-js/cube-ui-kit/commit/b56c0073e6eeb622f458cb017cf8c202c9e638d9) Thanks [@tenphi](https://github.com/tenphi)! - Make `no-redundant-default-prop` fire on compound aliases such as `<Radio.Group>`, which it silently ignored.

  The registry is keyed on the name each render fixture carries — the flat `RadioGroup` — while the rule resolves a JSX tag to its dotted path, `Radio.Group`. The lookup missed, so the entry only ever fired on the form nobody writes: every example in `RadioGroup.docs.mdx` uses `<Radio.Group>` / `<Radio.Tabs>`, and two genuinely redundant props in `RadioGroup.stories.tsx` went unreported. `Button.Split`, `Item.Action`, `Menu.Trigger` and `Input` had the same gap.

  `DefaultsRegistry` now carries an `aliases` map from alias path to canonical key, generated by walking the package exports and recording every path whose value **is the same object** as a covered component. Fixtures still name one export each; the 27 alias paths are derived, so adding a fixture needs no alias bookkeeping.

  Identity, not name shape, is what makes this safe. `Radio.Group` is `RadioGroup` itself and cannot behave differently, but `Radio.ButtonGroup` is `tasty(RadioGroup, { type: 'button' })` and `Radio.Tabs` is `tasty(RadioGroup, { type: 'tabs' })` — different objects with a different effective `type` default. A rule that normalised the dotted path by concatenating it would hand those two RadioGroup's entry and offer to strip a `type` that is not their default; identity skips them. Each alias is re-checked against the live exports on every test run, so a refactor that turns an alias into a wrapper fails instead of shipping a wrong entry.

  This is a missed-cleanup fix, not a correctness one — the rule was silent, never wrong. Unrelated to `VerifiedDefault.aliases`, which lists alternate spellings of a prop _value_ and stays hand-curated.

- [#1319](https://github.com/cube-js/cube-ui-kit/pull/1319) [`2a8d0b4a`](https://github.com/cube-js/cube-ui-kit/commit/2a8d0b4ad6e05b913a7aa6ca0eade56ff5e151ff) Thanks [@tenphi](https://github.com/tenphi)! - Fix `RadioGroup`'s documented `size` default, which was wrong in a way the lint rule acted on.

  `RadioGroup.docs.mdx` contradicted both itself and the implementation: the `## Properties` bullet said `(default: xsmall)` while its own prose said `medium`, and `Radio.tsx` resolves `size ?? contextSize ?? 'medium'`. The default is `medium`.

  That annotation is what seeds the `no-redundant-default-prop` registry, so the shipped rule claimed `<RadioGroup size="xsmall">` was redundant and offered to delete it — which silently resized the radios to `medium`. The prover could not catch the drift because `size` only reaches the DOM through the radios and a plain `type="radio"` radio renders identically at every size, so any documented value verified. The fixture now probes under `type="button"` and `type="tabs"` as well, which is what makes a wrong `size` value fail: restoring `xsmall` under the new conditions correctly downgrades the prop to `skip: 'conditional'` instead of passing as a verified default.

  Also corrects the tabs-mode size mapping table. It claimed `xlarge` maps to `large` and listed `xsmall` as passing through, but `Radio.tsx` maps only `large`, funnelling every other size through `RADIO_SIZE_MAP.medium` — so `xsmall`, `small`, `medium` and `xlarge` all collapse to `xsmall`.

## 0.162.0

### Minor Changes

- [#1317](https://github.com/cube-js/cube-ui-kit/pull/1317) [`1394b033`](https://github.com/cube-js/cube-ui-kit/commit/1394b033603366f4e5ebf372e8585462944276df) Thanks [@tenphi](https://github.com/tenphi)! - Calendar: pick a month or a year from a list instead of paging with arrows.

  - `Calendar` / `RangeCalendar` (and therefore `DatePicker`, `DateRangePicker`
    and `DateRangeSeparatedPicker`) now render the header month and year as
    buttons that open a month list and a year list. Opt out with
    `hasMonthYearNavigation={false}`.
  - `MonthPicker` and `QuarterPicker` gained the same year list behind the year in
    their header.
  - The period panels are now proper ARIA grids with full keyboard support: arrow
    keys roll over into the neighbouring year or decade, `PageUp`/`PageDown` page
    by year or decade, `Home`/`End` jump to the first or last selectable period,
    and `Escape` steps back one panel instead of closing the popover.
  - Day and period cells mark the cell containing today with a `current` modifier,
    and periods are disabled only when the whole period falls outside
    `minValue`/`maxValue`.
  - `PeriodPicker` no longer duplicates the field's label props onto its value
    text, describes its trigger with the selected value, honours `isReadOnly`, and
    truncates overlong custom `formatValue` output. Its placeholders and the new
    calendar labels are translated in all twelve locales.
  - `Calendar` passed its ref through without attaching it to the DOM; it now does.
  - `Popover` (every `DialogTrigger type="popover"`, so also `Select`-style
    fields, menus and the date pickers) only became keyboard-dismissable once its
    enter animation had settled, because it registered with React Aria's
    visible-overlay stack on the transition's `isOpen` rather than the trigger's.
    `Escape` pressed in the first frames after opening did nothing; it now closes
    the popover immediately.

## 0.161.0

### Minor Changes

- [#1315](https://github.com/cube-js/cube-ui-kit/pull/1315) [`d4c9691e`](https://github.com/cube-js/cube-ui-kit/commit/d4c9691ed41ecd0e3bc587a59c96356b78247a0a) Thanks [@tenphi](https://github.com/tenphi)! - Add `@cube-dev/ui-kit/probe` — DOM-pure helpers for tooling that inspects what a render produced.

  Answering "what HTML and CSS did this component tree actually generate?" is a recurring need for agents and dev tooling, and the pieces to do it correctly were either unreachable or easy to get subtly wrong.

  - `canonicalizeIds` / `canonicalizeClassNames` / `canonicalize` — normalise React and react-aria element IDs and tasty class-name hashes so two renders can be compared byte-for-byte. These already existed in `src/eslint-plugin/probe.tsx`, which is not part of the `./eslint-plugin` entry, so nothing outside this repo could import them. They now live in `src/probe/` and are re-exported from their old home.
  - `captureCss` / `splitRules` / `diffRules` — read the CSS a subtree caused, by capturing the empty harness, mounting, capturing again and subtracting. Scoping `getCSSTextForNode` to an inner wrapper is the obvious approach and is wrong: `<Root>` is the `PortalProvider` target, so Dialog / Menu / Tooltip / Select popups mount as its _siblings_ and drop out of the result entirely.
  - `captureCss` also collects the rules the CSS engine refused instead of suppressing them. jsdom _discards_ `@container style()` and `@property` rules rather than degrading them, so a jsdom-derived dump is incomplete — not merely unresolved — for components that use them, and a caller needs to be told.

  The entry is deliberately DOM-pure: it operates on an already-rendered node, so it adds no test-renderer dependency and carries no opinion about the provider stack, which is the part that genuinely differs per consumer.

  Also fixes the jsdom test setup's tasty warning filter, which matched `[tasty]` against tasty's `[Tasty]` and so had never suppressed anything.

## 0.160.0

### Minor Changes

- [#1313](https://github.com/cube-js/cube-ui-kit/pull/1313) [`773cb5b0`](https://github.com/cube-js/cube-ui-kit/commit/773cb5b090caeb2c7099f788b5ab3dd5aabba12f) Thanks [@tenphi](https://github.com/tenphi)! - Add a `current` type to `Item` (plus `Item.Action`, and by inheritance `ItemButton`) and to `Button`. Fill, border and label are derived from the inherited text color, so the element adopts the color of whatever container it sits in — alerts, banners, dark overlays, tooltips — with no `theme` to pick. The label stays fully opaque, and the type is theme-agnostic.

  The two components take the shape their neutral types take: on `Item` it matches the `item` type (no border, nothing painted at rest, the fill stepping in on hover/pressed/selected), while on `Button` it is a standalone chip (a resting `#current.03` fill inside a `#current.08` border).

### Patch Changes

- [#1310](https://github.com/cube-js/cube-ui-kit/pull/1310) [`264dca74`](https://github.com/cube-js/cube-ui-kit/commit/264dca74787640b449f9b30b493af5e35284212a) Thanks [@tenphi](https://github.com/tenphi)! - Fix `Disclosure` trigger corners in the `card` shape: the trigger now matches the card's inner radius while collapsed and rounds only its top corners while expanded, and the change is animated. The animation follows `transitionDuration` so the corners stay in step with the panel.

  Fix `Disclosure` overflowing a flex or grid parent. The root now opts out of the automatic minimum size, so wide panel content (a code block, a table) is clipped by the panel rather than stretching the whole disclosure past its parent — `width="max 100%"` is no longer needed at the call site. Growing to fill a row flex parent remains the caller's decision via `flexGrow`.

- [#1311](https://github.com/cube-js/cube-ui-kit/pull/1311) [`aa3fd0b8`](https://github.com/cube-js/cube-ui-kit/commit/aa3fd0b8ad0ec5eed7c3e516cb6a4c8fca4e7a36) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: a marquee (lasso) drag no longer selects text under it. Dragging a band across widgets used to paint a native text selection and leave stray highlighted text behind once the band was gone. The board carries a `marquee` modifier (`data-marquee`) for the length of the gesture.

- [#1311](https://github.com/cube-js/cube-ui-kit/pull/1311) [`aa3fd0b8`](https://github.com/cube-js/cube-ui-kit/commit/aa3fd0b8ad0ec5eed7c3e516cb6a4c8fca4e7a36) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: widgets a marquee (lasso) currently covers now preview the selection while the pointer is still down, instead of only lighting up on release. They carry a new `pre-selected` modifier (`data-pre-selected`) — the selected edge with its ring dimmed — which is restylable exactly like `selected` and is never set on a widget that is already selected.

- [#1311](https://github.com/cube-js/cube-ui-kit/pull/1311) [`aa3fd0b8`](https://github.com/cube-js/cube-ui-kit/commit/aa3fd0b8ad0ec5eed7c3e516cb6a4c8fca4e7a36) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: a multi-widget selection now moves as one rigid block for the whole drag, and displaces the widgets standing wherever it lands instead of being pushed around by them. Previously, dragging a group **up** could leave it where it was while only some of the widgets above it slid down, and members with different neighbours above them ended up on different rows — letting an unrelated widget (a full-width divider, for example) land between them. Dragging a group **sideways** was worse: the group itself sank below the widgets it was supposed to move aside, which made those widgets look pinned in place. Members keep their exact offsets until the drag ends, at which point the board compacts as usual.

## 0.159.0

### Minor Changes

- [#1305](https://github.com/cube-js/cube-ui-kit/pull/1305) [`74630ba1`](https://github.com/cube-js/cube-ui-kit/commit/74630ba166fa4e052a41964bb4fe08731f2c05a1) Thanks [@tenphi](https://github.com/tenphi)! - **DataTable**: column reordering. `isColumnReorderable` lets a user drag a header
  sideways or move the focused column with `Alt`+`←` / `→`; clicking still sorts
  and the resize handle still resizes. `columnOrder` / `defaultColumnOrder` /
  `onColumnOrderChange` work with or without dragging, so a column manager
  elsewhere in the page can drive the order on its own, and `storageKey` now
  persists the order alongside the widths.

  Structural and pinned columns stay put — `pin` is already the ordering authority
  for a pinned column — and a single column opts out with `isReorderable: false`.
  A stale order is safe: unknown keys are ignored, and a column missing from the
  list lands after the neighbour it had in `columns` rather than at the end.

- [#1305](https://github.com/cube-js/cube-ui-kit/pull/1305) [`74630ba1`](https://github.com/cube-js/cube-ui-kit/commit/74630ba166fa4e052a41964bb4fe08731f2c05a1) Thanks [@tenphi](https://github.com/tenphi)! - **DataTable**: `rowSize` sets the row height to a named step — `small` 28px,
  `medium` 32px, `large` 40px. It moves the rows only: the header keeps answering
  to `size`, so a denser body no longer means reaching for `size` and dragging the
  header down with it.

  Unset, the height comes from `size` exactly as before, so nothing changes for
  existing tables. `rowHeight` still wins when an exact pixel value is needed.

- [#1305](https://github.com/cube-js/cube-ui-kit/pull/1305) [`74630ba1`](https://github.com/cube-js/cube-ui-kit/commit/74630ba166fa4e052a41964bb4fe08731f2c05a1) Thanks [@tenphi](https://github.com/tenphi)! - **DataTable, ItemTable**: add a built-in column menu. A column exposes one
  through `header.menu`, opened from a `⋮` trigger in the header, by right-click,
  or with Shift+F10 — `columnContextMenu` picks which of those surfaces are live.
  The pressed key comes back through `header.onMenuAction` and then
  `onColumnMenuAction(action, columnKey)`, as written and without React's `.# @cube-dev/ui-kit
  prefix, so the menu's contents stay entirely the consumer's.

  Sorting is the one thing the table knows how to do itself, so the reserved keys
  `sort-asc`, `sort-desc` and `clear-sort` are labelled, disabled when they would
  do nothing, and applied before the consumer hears about them. `columnSortMenu()`
  returns those items ready to drop into `header.menu`.

  Also fixes `isMenuEmpty` so an empty fragment counts as an empty menu, which is
  the shape a conditionally-assembled `rowMenu` or `header.menu` produces — such a
  menu now renders no trigger instead of one that opens nothing.

- [#1305](https://github.com/cube-js/cube-ui-kit/pull/1305) [`74630ba1`](https://github.com/cube-js/cube-ui-kit/commit/74630ba166fa4e052a41964bb4fe08731f2c05a1) Thanks [@tenphi](https://github.com/tenphi)! - **DataTable, ItemTable**: per-column adaptive colors. `column.color` takes a
  palette theme name (`'success'`), any CSS color, a `{ hue, saturation }` seed, or
  a `{ fill, text }` pair for full manual control. Everything but the last is
  _derived_: only the hue and saturation are kept, and the tone ramp plus an
  `AA`/`AAA` text floor are re-solved per color scheme — so a tinted column stays
  readable in light, dark and high contrast without the caller checking.
  `column.colorScope` narrows it to any of `header` / `body` / `totals`.

  Row banding survives inside a tinted column: the tint carries its own band one
  tone step away, so the stripe still reads down the column instead of being
  painted over.

  **New**: `useColorTheme(config)` / `getColorTheme(config)` build an adaptive
  mini-theme from a hue at runtime and name it by a hash of its config, so every
  component asking for the same color shares one global token injection. Also
  exports `colorThemeSeed(color)` for the hue/saturation of a color.

- [#1305](https://github.com/cube-js/cube-ui-kit/pull/1305) [`74630ba1`](https://github.com/cube-js/cube-ui-kit/commit/74630ba166fa4e052a41964bb4fe08731f2c05a1) Thanks [@tenphi](https://github.com/tenphi)! - **DataTable, ItemTable**: the sort indicator is now Tabler's narrow arrow rather
  than a chevron — `ArrowNarrowUpIcon` for ascending, `ArrowNarrowDownIcon` for
  descending. Both are also exported for use elsewhere.

  The descending state renders the real down arrow instead of flipping the up one
  with a transform, so the glyph is always the one Tabler drew.

### Patch Changes

- [#1305](https://github.com/cube-js/cube-ui-kit/pull/1305) [`74630ba1`](https://github.com/cube-js/cube-ui-kit/commit/74630ba166fa4e052a41964bb4fe08731f2c05a1) Thanks [@tenphi](https://github.com/tenphi)! - **DataTable, ItemTable**: a sortable header now previews its sort arrow. Hovering
  or keyboard-focusing a sortable column fades the arrow in at 40%, pointing the
  way a press would sort it; pressing it makes the arrow solid, and it stays solid
  once the pointer leaves. Previously a sortable column looked identical to a
  non-sortable one until it was already sorted.

  The arrow keeps its slot throughout, so nothing shifts, and a non-sortable column
  still has no arrow.

- [#1305](https://github.com/cube-js/cube-ui-kit/pull/1305) [`74630ba1`](https://github.com/cube-js/cube-ui-kit/commit/74630ba166fa4e052a41964bb4fe08731f2c05a1) Thanks [@tenphi](https://github.com/tenphi)! - **ItemTable, DataTable**: stories no longer turn sorting on behind your back.

  Both shared story fixtures marked every column `isSortable: true`, so all 15
  `DataTable` stories and every `ItemTable` story rendered clickable headers with
  hover affordances — including `Default`, which is where people go to learn what
  the component does without configuration. Sorting is opt in per column, so those
  stories were showing the opposite of the default.

  The fixtures are now plain, and the stories that are actually about sorting use
  an explicit `SORTABLE_COLUMNS`.

- [#1305](https://github.com/cube-js/cube-ui-kit/pull/1305) [`74630ba1`](https://github.com/cube-js/cube-ui-kit/commit/74630ba166fa4e052a41964bb4fe08731f2c05a1) Thanks [@tenphi](https://github.com/tenphi)! - **ItemTable, DataTable**: correct the `isSortable` documentation. It read
  `@default true`, which was never what the code did — `TableView` requires
  `isSortable === true` before a header becomes a control at all, so sorting is
  opt in per column and a table with no sortable column has inert headers.

  Adds the pattern most lists actually want, which had no story: a fixed order the
  user cannot change, via `sortMode="client"` with a `sort` and no sortable
  column. `sortMode` has to be explicit there — left to default it resolves to
  `'off'` when nothing is sortable, and a `sort` prop alone sorts nothing.

  Also documents `ItemTable`'s column-menu props, and adds a `DataTable` story for
  the query-results layout: pagination off, footer slots in its place, and a
  tighter `.5x` footer.

- [#1305](https://github.com/cube-js/cube-ui-kit/pull/1305) [`74630ba1`](https://github.com/cube-js/cube-ui-kit/commit/74630ba166fa4e052a41964bb4fe08731f2c05a1) Thanks [@tenphi](https://github.com/tenphi)! - **DataTable, ItemTable**: resizing a column no longer moves its neighbours.

  A column with no explicit width is `flex: 1` and shares the leftover space.
  Resizing made only the dragged column fixed, leaving every other one in the flex
  pool to re-split a leftover that had just changed — so dragging one divider
  resized all of them, including columns to the _left_ of the handle. Dragging a
  column by +8px measurably took 3px off each of the other three.

  Every column is now frozen at its current width when a drag starts, so the drag
  changes exactly one. Columns after it are pushed along and the table grows or
  shrinks, rather than the neighbours absorbing the difference.

- [#1308](https://github.com/cube-js/cube-ui-kit/pull/1308) [`82306d62`](https://github.com/cube-js/cube-ui-kit/commit/82306d62cf6c5264566a11fd4b03ab34978070a4) Thanks [@tenphi](https://github.com/tenphi)! - `Item`, `Button`: show the tooltip while the element is disabled, and stop putting the native
  `disabled` attribute on elements that cannot carry it.

  A tooltip on a disabled control is usually where the reason for being unavailable is written, but
  browsers do not dispatch mouse events on elements carrying the native `disabled` attribute, so the
  hover that opens the tooltip never arrived. What a disabled `Button` did instead was rely on a
  quirk: Chromium still delivers _pointer_ events to a natively disabled control, so the tooltip
  opened there and nowhere else — not on a fallback to mouse events, and not under test. `Item` had
  it worse, since it also set the attribute on whatever it rendered — a `div` or an `li` in most
  cases, where it is invalid markup that only got in the way. When such an element has a tooltip that
  can open, the disabled state now reaches the DOM as
  `aria-disabled="true"` instead, and the element is kept inert by hand: activation handlers are
  dropped and clicks (including the ones Enter and Space produce) do nothing, so `onPress` / `onClick`
  stay silent and a `submit` button no longer submits its form. Such an element stays in the tab
  order, so keyboard users can focus it and read the tooltip too.

  Nothing changes for a disabled element without a tooltip: a `Button`, `ItemButton`, or `Item`
  rendered as a form control keeps the native attribute. A disabled `Item` that is not a form control
  does become inert, though — until now the attribute it carried did nothing there, so handlers passed
  to it still ran.

  Three related fixes come with it: a `Button` rendered as a link (`to`) is now announced as disabled
  through `aria-disabled` — it previously had no accessible disabled state at all, only an invalid
  `disabled` attribute on the anchor; `Item` now treats a `disabled` prop as an alias of `isDisabled`
  rather than letting it overwrite what the component decided; and `ItemTable`'s `disabledTooltip` for
  a bulk action reaches the user, which it could not while the button was natively disabled.

## 0.158.0

### Minor Changes

- [#1229](https://github.com/cube-js/cube-ui-kit/pull/1229) [`c80f22b3`](https://github.com/cube-js/cube-ui-kit/commit/c80f22b3a33698cf4a67f7545145caa5f89a0a88) Thanks [@tenphi](https://github.com/tenphi)! - Make the pastel palette the default: the app seed moves to saturation 100 with
  `pastel: true`, producing a softer, more even spread across hues.

  Both are `PaletteConfig` defaults rather than a rewritten recipe, so anything that
  already tunes the palette at runtime keeps working and can opt back out with
  `{ saturation: 80, pastel: false }`.

  The `code-*` syntax family is unaffected. It answers to its own seed, which now
  reads a separate `DEFAULT_CODE_SATURATION` (still 80) instead of sharing
  `DEFAULT_SATURATION`; sharing it would have pulled syntax colors to 100 as a side
  effect of moving the app seed. `pastel` was already held off the code theme.

## 0.157.3

### Patch Changes

- [#1304](https://github.com/cube-js/cube-ui-kit/pull/1304) [`79cef50c`](https://github.com/cube-js/cube-ui-kit/commit/79cef50cbf3dd2b30e24de28b917a3b328b3f770) Thanks [@tenphi](https://github.com/tenphi)! - `no-redundant-default-prop`: cover the defaults components set as styles.

  `<Space gap="1x">` restates what `Space` already does, and the rule did not notice. Two
  independent gaps had to line up for that, and both are fixed here — the registry grows from
  401 proven defaults to 441.

  **The docs parser only read one of the two default sections.** A component's tasty style
  defaults are documented under `### Style Defaults` as `` - `gap` — `1x` ``, not as a
  `## Properties` bullet with a `(default: …)` annotation, so all 30 components with such a
  section contributed nothing. Those styles are defaults in every sense that matters here:
  ui-kit components forward style props, so passing one restates the component's own value.
  Bullets carrying a conditional note — `` `flow` — `row` (switches to `column` when
`direction="vertical"`) `` — are skipped rather than probed, since the note is an explicit
  statement that the value depends on something the probe may not vary.

  **The probe compared class names it should have ignored.** Tasty derives its class hash from
  the _input_ style object rather than the CSS it produces, so `gap: true` (what `Space` sets)
  and `gap: '1x'` (what the prop passes) emit byte-identical rules under different class names.
  The differential render therefore reported a genuine redundancy as "differs", and the prop
  was recorded as unverified instead of becoming a candidate. Class names are now canonicalised
  the same way React's generated IDs already were: positional placeholders assigned in order of
  first appearance, so an extra, missing or reordered class still compares unequal and only the
  arbitrary hash is normalised away.

  Every new entry is a style prop, so all of them are optional — this cannot repeat the
  `ResizablePanel.direction` problem, where the rule removed a prop that was typed required.

- [#1304](https://github.com/cube-js/cube-ui-kit/pull/1304) [`79cef50c`](https://github.com/cube-js/cube-ui-kit/commit/79cef50cbf3dd2b30e24de28b917a3b328b3f770) Thanks [@tenphi](https://github.com/tenphi)! - Ship `tasty.config.ts` to consumers, and stop `no-redundant-default-prop` breaking `ResizablePanel` call sites.

  `tasty.config.ts` was missing from the package's `files` list, so it never reached the tarball and
  `extends: '@cube-dev/ui-kit'` in a consumer's own tasty config silently resolved to nothing. The
  ESLint plugin's token-existence rules then reported every real token (`#border`, `#surface`,
  `#dark`) as unknown — around 660 phantom findings in one downstream app alone. The config also now
  declares `importSources`, since consumers import `tasty` from this package rather than from
  `@tenphi/tasty` and the plugin only inspects calls it can trace to a tracked import. It unions with
  the parent config's list, so this package's own `@tenphi/tasty` imports stay covered.

  `CubeResizablePanelProps.direction` is now optional. It was typed required even though both
  `ResizablePanel` and `Handler` destructure it as `direction = 'right'`, so the defaults registry
  recorded that runtime default and the rule removed explicit `direction="right"` from consumer call
  sites, which then failed to typecheck. The type now agrees with the implementation and the rule's
  advice is actionable.

  The lint fixture is why this was not caught here: it rendered
  `<ResizablePanel direction="right" {...props} />`, hardcoding the prop purely to satisfy the
  required type. The probe proves a default by rendering with and without the prop, so a hardcoded
  value sits in both renders, they match, and the prop is recorded as defaulted whether it is or not.

  A new `fixture-hygiene` test now fails on that shape anywhere in the fixture list. It caught two
  more: `FilterPicker` hardcoded `selectionMode="single"` and `GridProvider` hardcoded `columns={2}`.
  Both happened to be correct, but neither was proven. All three render bare now, and the registry
  output is unchanged — so those defaults are proven rather than assumed.

## 0.157.2

### Patch Changes

- [#1302](https://github.com/cube-js/cube-ui-kit/pull/1302) [`a850f19c`](https://github.com/cube-js/cube-ui-kit/commit/a850f19cf757fd0c2a3c0ddfc55e9631b7456c89) Thanks [@tenphi](https://github.com/tenphi)! - `DisplayTransition`: finish the collapse when the flow is interrupted one frame before it starts,
  so `Disclosure` can no longer render an open panel under a collapsed header.

  Hiding is a two-step flow: the main effect sets the internal `exit-pending` phase, and the
  `[phase]` effect then schedules the double-rAF that advances it to `exit` and on to `unmounted`.
  Anything that re-ran the main effect while `exit-pending` was still on screen cancelled that rAF
  — and because `phase` had not changed, the `[phase]` effect never re-ran to replace it. The
  component was stranded in `exit-pending`, which reports as `entered`: the content stayed at full
  height indefinitely while `isShown` was already `false`, recovering only on the next toggle. The
  pending exit is now re-armed by whoever cancels it, mirroring how the enter flow already behaved.

  `Disclosure` is the one consumer that changes `transitionDuration` at runtime, so it is where this
  surfaced: a caller that disables the animation on the same event that collapses the panel — for
  example `transitionDuration={isBusy ? 0 : undefined}` — hit it whenever the two landed in separate
  renders. The trigger read as collapsed while the panel below it stayed fully expanded.

  Also adds a browser test tier for `DisplayTransition` and `Disclosure`. The
  `duration === undefined` path, which times the exit off the element's own `transitionend` and is
  what most consumers use, could not be tested under jsdom — with no layout, transition events never
  fire and the fallback timer always won — and `Disclosure`'s `height: 0 → max-content` animation has
  no measurable height there either.

## 0.157.1

### Patch Changes

- [#1299](https://github.com/cube-js/cube-ui-kit/pull/1299) [`53164987`](https://github.com/cube-js/cube-ui-kit/commit/531649877a058a8d07a0f4f4d6ffc520f1ed62d9) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: keep a multi-select group contiguous when compaction reorders it, and add `extraRows`.

  Dragging a selected group past other widgets on a compacting board could split it — the widgets
  it passed were packed _between_ the group's members, because compaction sorts every item by
  `(y, x)` and packs each one independently. The group is now compacted as a single consecutive
  run, with the displaced widgets landing past it. Gravity still wins: the block is never held in
  mid-air, and the result is unchanged for every layout that was already correct.

  The new `extraRows` prop keeps N empty grid rows below the content. A board hugs its content, so
  once the grid fills up there is no empty space left to start a marquee selection in — and none to
  drop a widget past the end of the board either. `extraRows` reserves a band for both; grid lines
  paint over it so it reads as board rather than page background.

## 0.157.0

### Minor Changes

- [#1296](https://github.com/cube-js/cube-ui-kit/pull/1296) [`4fc58aec`](https://github.com/cube-js/cube-ui-kit/commit/4fc58aecc896f39a3caecd673f35650d8f4ce391) Thanks [@tenphi](https://github.com/tenphi)! - Keep the caret in place in `TextInput`, `TextArea`, `PasswordInput` and `SearchInput` when the
  controlled value comes back late.

  A controlled `<input>` renders whatever string its parent hands it. If the parent hands back the
  pre-keystroke string — because its state arrives through a store that publishes a render late, a
  debounce, or a deferred update — React writes that stale string into the DOM node, and a native
  `value` assignment collapses the selection. Typing in the middle of a field threw the caret to the
  end. The text still landed a render later, so it read as a caret bug rather than a data-flow one.

  These four fields now hold the typed text locally until the parent catches up. `onChange` still
  fires once per keystroke with the full value, so nothing downstream changes: no debouncing, no
  commit-on-blur, no coalesced calls. An incoming `value` is adopted whenever it is a genuine change
  from the parent — an undo, a reset, a transformed string, another record — and on blur the parent's
  value takes over again.

  Components that already own their typed text are untouched: `NumberInput`, `ComboBox`,
  `SearchComboBox`, `FilterListBox`, `CommandMenu`, `CommandTextArea`, `ColorPicker` and
  `InlineInput`.

  Two additions to the public API:

  - `useBufferedValue(value, onChange, options)` — the hook behind it, exported for controls that
    own their own input. It is generic, and `options.getKey` lets non-string values (an array of
    colour stops rebuilt on every emit) be matched by signature rather than identity.
  - `isBuffered` on the four fields — set it to `false` for a caller that must see the field snap
    back to its own `value` the instant it declines a keystroke.

  ```tsx
  // A parent whose state arrives a render late no longer fights the caret.
  <TextInput value={spec.title} onChange={(title) => updateSpec({ title })} />
  ```

- [#1293](https://github.com/cube-js/cube-ui-kit/pull/1293) [`6696d7fe`](https://github.com/cube-js/cube-ui-kit/commit/6696d7feb6cccdb2cab9fc4c7cdaae7ab0da9d6d) Thanks [@tenphi](https://github.com/tenphi)! - **Breaking:** rename `ColorPicker` to `ColorInput`, and give the `ColorPicker` name to a new trigger-only component.

  The component released in 0.156.0 as `ColorPicker` is a text field — a swatch, an editable color string, and a popover trigger. That is an input, and it is now called `ColorInput`. Its API is unchanged: rename the import and the `CubeColorPickerProps` type (now `CubeColorInputProps`), and everything else works as before.

  ```diff
  -import { ColorPicker } from '@cube-dev/ui-kit';
  -<ColorPicker label="Brand" format="oklch" formatMode="derive" />
  +import { ColorInput } from '@cube-dev/ui-kit';
  +<ColorInput label="Brand" format="oklch" formatMode="derive" />
  ```

  Note that this is a silent break rather than a type error: `<ColorPicker value onChange label />` still compiles, but now renders a button instead of a text field.

  `ColorPicker` is now a swatch button that opens the same popover, matching what `Picker` means elsewhere in the kit — a trigger plus an overlay, with no text entry. It shows the color as a swatch and spells it out beside it; `children` replaces that label, and `children={null}` leaves the swatch on its own for toolbars and dense tables. It has no `formatMode`, since there is no text to reconcile.

  ```jsx
  <ColorPicker label="Series color" value={color} onChange={setColor} />
  <ColorPicker aria-label="Series color" value={color} onChange={setColor}>{null}</ColorPicker>
  ```

  The color model, the three editing spaces and the popover are shared by both, so `format`, `defaultSpace`, and every notation they read behave identically. `COLOR_FORMATS`, `COLOR_SPACES`, `ColorPickerFormat` and `ColorPickerSpace` keep their names.

- [#1293](https://github.com/cube-js/cube-ui-kit/pull/1293) [`6696d7fe`](https://github.com/cube-js/cube-ui-kit/commit/6696d7feb6cccdb2cab9fc4c7cdaae7ab0da9d6d) Thanks [@tenphi](https://github.com/tenphi)! - Add `ColorSwatchGroup` — a grid of color swatches, one of which can be selected. It is the palette half of choosing a color, where `ColorPicker` is the freeform half.

  Colors go in as data rather than as children, so the API reads like `Picker` rather than `RadioGroup`, though a radio group is what it is underneath: one tab stop, arrow keys between swatches.

  ```jsx
  <ColorSwatchGroup
    label="Brand color"
    colors={["#7a4dbf", "#26fcb2", { color: "#ff0000", label: "Danger" }]}
    columns={4}
    value={color}
    onChange={setColor}
  />
  ```

  Swatches are keyed by their canonical hex, so the same color written two ways collapses into one entry — equivalent colors would otherwise make selection ambiguous. That same matching decides which swatch a value selects, so `value` need not use the notation the swatch was written in.

  `allowCustom` appends a `ColorPicker` for colors outside the set, showing the current color whenever it is not one of the swatches.

  `ColorSwatch` is exported too, for showing a color without a control around it. It takes direct style props, so `<ColorSwatch color="#7a4dbf" radius="round" />` works. `ColorSwatchGroup` and `ColorPicker` both accept the outer and block style props, so `radius`, `border`, `padding` and `shadow` apply directly.

  The selected swatch is marked the way React Aria marks it: two rings drawn _inside_ the swatch, one in `#surface-text` and one in `#surface`. A single ring in one color vanishes against a swatch of that color — an accent ring on an accent-colored swatch — while two tones that flip with the color scheme contrast against anything, and drawing them inset keeps the swatch's footprint fixed.

  `ColorPicker` gains `swatches` and `swatchColumns`, which put a palette under the editor in its popover. The group drops `allowCustom` there — the escape hatch is itself a `ColorPicker`, so offering it inside one would nest popovers without end. That is enforced through context rather than documented, so the recursion cannot be written by hand either.

- [#1289](https://github.com/cube-js/cube-ui-kit/pull/1289) [`c7c85799`](https://github.com/cube-js/cube-ui-kit/commit/c7c8579958fc683f8b69b0c2b10f71953efdcd1c) Thanks [@tenphi](https://github.com/tenphi)! - Remove `FileTabs`. Use `Tabs` instead.

  `FileTabs` was an editor-style tab bar with close buttons and dirty-state dots.
  Its `FileTabProps` has carried `@deprecated consider using <Tabs /> instead`
  since before the Glaze migration. Cube Cloud — the component's only known
  consumer — moved `FilesEditor` onto `Tabs` in October 2025 and has had no
  reference to it since.

  Removed from the public API: the `FileTabs` component (with its
  `FileTabs.TabPane` subcomponent) and the `CubeFileTabProps` type.

  ```diff
  -<FileTabs defaultActiveKey="1" onTabClose={(key) => removeTab(key)}>
  -  <FileTabs.TabPane id="1" title="index.ts" />
  -  <FileTabs.TabPane id="2" title="styles.css" />
  -</FileTabs>
  +<Tabs defaultActiveKey="1" onDelete={(key) => removeTab(key)}>
  +  <Tabs.Panel key="1" title="index.ts" />
  +  <Tabs.Panel key="2" title="styles.css" />
  +</Tabs>
  ```

  The close button is the main behaviour to port: on `Tabs` it is `onDelete`, and
  passing it is what makes the buttons appear (`onTabClose` on `FileTabs`).
  `Tabs` has no built-in equivalent of `isDirty` — render the unsaved indicator
  into the tab's `title` or `actions`, which is what Cube Cloud's `FilesEditor`
  does.

- [#1295](https://github.com/cube-js/cube-ui-kit/pull/1295) [`0bc4113d`](https://github.com/cube-js/cube-ui-kit/commit/0bc4113dde86bba41b6fdc57190f3511b8a8d4f3) Thanks [@tenphi](https://github.com/tenphi)! - Add the `c3` typography preset.

  `c3` extends the uppercase caption scale one step below `c2`: 11px / 16px line
  height, 600 weight, `0.02em` tracking, uppercase. It is the size used for table
  column headers, where `c2` is a touch heavy against 14px body text.

  The caption scale now reads `c1` (14px) → `c2` (12px) → `c3` (11px).

- [#1295](https://github.com/cube-js/cube-ui-kit/pull/1295) [`0bc4113d`](https://github.com/cube-js/cube-ui-kit/commit/0bc4113dde86bba41b6fdc57190f3511b8a8d4f3) Thanks [@tenphi](https://github.com/tenphi)! - Add `ItemTable`, `DataTable` and `Pagination`.

  Two tables over one shared engine, replacing the ag-grid wrappers Cube Cloud
  carries today. They keep the same names, so migration is mechanical, and drop
  the `Omit<AgGridReactProps, …>` intersection that made every ag-grid option
  public API.

  **`ItemTable`** — lists of records that get acted on. Sorting, row selection
  with a bulk action bar, row links and a row menu, a toolbar with client or
  server search, client/server pagination or infinite scroll, column resize and
  pinning, row reordering and drop-onto-row, virtualization, and per-row visuals
  through `getRowProps`.

  **`DataTable`** — query results. The same engine with an analytical grid's
  defaults rather than a list's: `t4` type, `small` density, banded rows,
  resizable columns and column rules, all on by default. What is genuinely
  different is multi-column sorting whose array order is the precedence, pinned
  totals that sit outside sorting and paging, continuous row numbers, and
  rectangular cell selection with `⌘/Ctrl+C` copying the block as TSV and as an
  HTML table so spreadsheets keep the cell boundaries.

  **`Pagination`** and `usePagination`, which the kit did not have. `type="numbers"`
  is the default deliberately: Cloud's builds a `Select` of every page, which is a
  thousand collection items per render at 100k rows.

  Neither table knows anything about Cube. Measures, dimensions, pivots and
  drill-downs arrive as ordinary columns, `render` output and
  `column.header.menu` content, which is what keeps Cloud's column-header menu in
  Cloud.

  Built on a native `<table>`: sticky pinned columns need a cell's containing
  block to be the scrollport, and a grid item's is its own grid area — which is
  why a div-and-CSS-grid design cannot have them without ag-grid-style flex lanes.
  Header and body then agree through `<colgroup>` with nothing to sync.

  Some behaviour worth knowing without reading the source:

  - A refresh fades the table, header included, and sweeps a band of lower
    opacity across it rather than covering the rows with a spinner — the previous
    result stays readable, which is the point of keeping it on screen.
  - A sort slides rows to their new positions over 120ms, so a row can be followed
    to where it went. Only a reorder animates: if the rows keep their relative
    order the table never moves, however much the layout shifts underneath them —
    so mounting, resizing and filtering are all silent.
  - Infinite scroll starts fetching a screen before the end and holds the scroll
    height with a batch-sized run of skeleton rows, so scrolling is not
    interrupted and nothing lurches when the rows land.
  - Both animations respect `prefers-reduced-motion`.
  - Selection survives sorting and paging: it is keyed, and a cell range is stored
    as two corners re-resolved against the current order.

  `DraggableCollection` gains `onItemDrop`, `shouldAcceptItemDrop` and
  `renderPreview`, so a drag preview can be a React node instead of markup written
  into `innerHTML`.

- [#1291](https://github.com/cube-js/cube-ui-kit/pull/1291) [`90e86d48`](https://github.com/cube-js/cube-ui-kit/commit/90e86d483825bb2ba64da9cb5c258f14a10efa74) Thanks [@tenphi](https://github.com/tenphi)! - Export `IconSwitch` (and its `CubeIconSwitchProps` type) from the package root.

  `IconSwitch` cross-fades between icons when its children change — the animated
  icon swap used inside buttons and items. It already had a stories file and a
  published docs page under `Helpers/IconSwitch`, and `src/components/helpers/index.ts`
  exported it, but that barrel is not re-exported from `src/index.ts` — only
  `DisplayTransition` was pulled through. So the component was publicly documented
  while being impossible to import.

  ```tsx
  import { IconSwitch } from "@cube-dev/ui-kit";

  <IconSwitch>{isLoading ? <LoaderIcon /> : <CheckIcon />}</IconSwitch>;
  ```

### Patch Changes

- [#1297](https://github.com/cube-js/cube-ui-kit/pull/1297) [`39c49438`](https://github.com/cube-js/cube-ui-kit/commit/39c494383cf55a0e9201489b7deb01712a67f63a) Thanks [@tenphi](https://github.com/tenphi)! - Declare `isBuffered` on the four fields that implement it rather than on the shared
  `CubeTextInputBaseProps`.

  `TextInput`, `TextArea`, `PasswordInput` and `SearchInput` buffer their value; `NumberInput` and
  `CommandTextArea` are built on the same base type but keep their own text and never read the prop.
  Declaring it on the base put it in their declared surface too. It now comes from a
  `CubeBufferedValueProps` mixin, exported alongside the base props, so a field built on that base in
  future doesn't inherit a flag it ignores.

  Type-level only — no runtime change, and no behaviour change for the four fields.

- [#1298](https://github.com/cube-js/cube-ui-kit/pull/1298) [`e2c583dc`](https://github.com/cube-js/cube-ui-kit/commit/e2c583dc02d74fc265299920eaef170e985a0b41) Thanks [@solarrust](https://github.com/solarrust)! - Fixed `Picker` and `FilterPicker` with `disallowEmptySelection` in single selection mode: re-selecting the already-selected item (by click or Enter) now closes the popover without firing `onSelectionChange`, matching the react-aria Select behavior. Previously the popover stayed open and no event fired at all.

  Without `disallowEmptySelection` the behavior is unchanged: re-selecting the current item still deselects it and fires `onSelectionChange(null)`.

  `ListBox` and `FilterListBox` now expose the `allowDuplicateSelectionEvents` prop (React Stately pass-through) that the fix is built on.

- [#1295](https://github.com/cube-js/cube-ui-kit/pull/1295) [`0bc4113d`](https://github.com/cube-js/cube-ui-kit/commit/0bc4113dde86bba41b6fdc57190f3511b8a8d4f3) Thanks [@tenphi](https://github.com/tenphi)! - Fix `useContextMenu` opening its popover far from the pointer.

  The hook positions an invisible anchor at the click coordinates, but rendered it
  wherever the consumer placed `rendered` — so those coordinates resolved against
  whichever positioned ancestor happened to enclose it, and the menu opened one
  ancestor-origin away from the click. `Tree` showed this too.

  The anchor now sits in a zero-size `position: fixed` host portalled to `body`.
  `fixed` makes the containing block's origin the viewport, and the portal keeps
  it clear of transformed ancestors, which capture `fixed` — a virtualized row is
  usually translated, so the fixed host alone would still be anchored to the row.
  Coordinates are now computed in viewport space to match.

## 0.156.0

### Minor Changes

- [#1287](https://github.com/cube-js/cube-ui-kit/pull/1287) [`946f6b85`](https://github.com/cube-js/cube-ui-kit/commit/946f6b8570acd63d97d9e9ba8ebf91459e315e48) Thanks [@tenphi](https://github.com/tenphi)! - Add `ColorPicker` — a form-attachable color input. The field shows the current color as a swatch, accepts hex, `rgb()`, `hsl()`, `okhsl()`, `okhst()` and `oklch()` text, and opens a popover where the color can be tuned on three axes: HST (OKHST hue/saturation/tone), LCH (OKLCH lightness/chroma/hue) or RGB. Every conversion runs through Glaze, so the value is always a real, in-gamut color.

  `formatMode` controls how the text relates to the value: `forced` (default) rewrites the text in `format`, `derive` keeps the notation the user typed but normalizes the value, and `free` passes the text through verbatim after verifying it parses. Also adds a `PipetteIcon`.

- [#1286](https://github.com/cube-js/cube-ui-kit/pull/1286) [`272a9e9b`](https://github.com/cube-js/cube-ui-kit/commit/272a9e9bc424b8b09be268640ff81be016540c9a) Thanks [@tenphi](https://github.com/tenphi)! - Add widget selection and rigid group movement to `Board`.

  Set `selectionMode="single" | "multiple"` and read the selection with
  `selectedKeys` / `defaultSelectedKeys` / `onSelectionChange` (keys are layout item
  ids, always returned in layout order).

  Pressing a widget selects it on pointer-down and arms a drag of the selection —
  selecting and grabbing are one gesture, so move the pointer and it drags, stay
  still and it was only a selection. <kbd>Shift</kbd> (or <kbd>Cmd</kbd>/
  <kbd>Ctrl</kbd>) toggles membership, dragging from empty canvas lassos
  (`allowMarqueeSelection`), <kbd>Space</kbd> toggles the focused widget, and
  <kbd>Escape</kbd> clears.

  Selection behaves like focus: it tracks what the user is working with and moves on
  as soon as they touch something else — pressing another widget makes that the
  selection, and pressing an interactive control inside a widget or moving focus off
  the board drops it entirely.

  With `"multiple"`, dragging any selected widget moves the whole selection as a
  rigid block that reflows by the board's own rules — the same compaction a single
  widget gets, so a group can never be parked in empty space on a `vertical` board
  and the widgets around it close the gap in the same frame. Every widget travels by the same delta, the group clamps against the
  grid edge as a unit instead of collapsing into it, a frame that cannot be placed
  is rejected outright rather than partially applied, and the move commits through a
  single `onLayoutChange`. Arrow keys move the group too. `BoardInteractionInfo`
  gains `items`, `oldItems` and `placeholders` describing the whole gesture; the
  existing `item` / `oldItem` / `placeholder` fields are unchanged, and a board with
  no selection behaves exactly as before.

  The `selectionCancel` selector (board- or widget-level, defaulting to the exported
  `BOARD_SELECTION_CANCEL`) marks interactive descendants; `[data-no-select]` opts
  out a custom control. On a selectable board it also gates dragging, which fixes a
  long-standing trap: `useMove`'s pointer-down calls `preventDefault()`, so without
  a `dragCancel` an `input` inside a widget could not be focused or typed into.
  Selected widgets are drawn with a `#primary-border` border and a `#primary` ring —
  an edge treatment rather than a fill, since selection reads as a focus-like state;
  `outline` stays reserved for the real focus ring. Widgets get a `selected`
  modifier you can restyle through `widgetProps.styles`.

  `onWidgetsDelete` reports a <kbd>Delete</kbd>/<kbd>Backspace</kbd> press with a
  non-empty selection. Board never mutates the layout itself, so removal stays
  yours to implement and to make undoable.

  Accessibility: widget hosts are now `role="group"` with an accessible name from
  the new `Board.Widget` `aria-label` prop (falling back to `qa`, then the layout
  id). `aria-roledescription` is now localized rather than hardcoded English — it
  was previously also invalid, sitting on a role-less element. Selected widgets are
  described as "Selected", and selection changes are announced through a polite live
  region.

  Widget hosts also expose `data-board-widget-id` and `data-selected`.

### Patch Changes

- [#1284](https://github.com/cube-js/cube-ui-kit/pull/1284) [`fc517477`](https://github.com/cube-js/cube-ui-kit/commit/fc5174777e4d330d5d4be98cf5547daa038dc9f0) Thanks [@tenphi](https://github.com/tenphi)! - Fix the types of `FilterListBox.Item` and `CommandMenu.Item`. Both were declared as React Stately's bare `Item`, so `Item` props such as `icon`, `rightIcon`, `description`, `hotkeys` and `actions` were rejected by TypeScript even though they worked at runtime. They now use `CollectionItem`, matching `ListBox.Item`, `Menu.Item` and the other collection components.

## 0.155.0

### Minor Changes

- [#1275](https://github.com/cube-js/cube-ui-kit/pull/1275) [`2bfe3a80`](https://github.com/cube-js/cube-ui-kit/commit/2bfe3a80f3febeebdaa7f01fe8ae73ac0c3ca5fb) Thanks [@tenphi](https://github.com/tenphi)! - Remove the `block` prop from `Text` and the `inline` prop from `Title`. Use `display` instead:

  ```diff
  - <Text block>…</Text>
  + <Text display="block">…</Text>

  - <Title inline>…</Title>
  + <Title display="inline">…</Title>
  ```

  Both were inherited from Tasty's `BaseProps` until v3 dropped them, at which point the UI Kit re-declared them locally. `display` already covers the use case on every Tasty component, so a bespoke boolean per component is redundant.

  `inline` on `Title` was already inert — it was destructured and discarded, and `TitleElement` hardcodes `display: 'block'`. Removing it changes nothing at runtime.

  `block` on `Text` was real: it drove a `block` mod feeding the `'ellipsis | block'` display branch. That branch is now just `ellipsis`, so `<Text ellipsis>` still renders as a block. Note that passing `display` replaces the whole default state map, so `<Text ellipsis display="inline">` will not force block — the explicit value wins, which is the intent.

  Proper `isBlock` / `isInline` props may follow later where they earn their place; this is deliberately not that.

- [#1275](https://github.com/cube-js/cube-ui-kit/pull/1275) [`2bfe3a80`](https://github.com/cube-js/cube-ui-kit/commit/2bfe3a80f3febeebdaa7f01fe8ae73ac0c3ca5fb) Thanks [@tenphi](https://github.com/tenphi)! - Upgrade to Tasty v3 (`@tenphi/tasty` `^3.0.0`) and `@tenphi/eslint-plugin-tasty` `^1.0.0`, applying the required migration.

  - `getCssTextForNode` -> `getCSSTextForNode` (test helpers and the ESLint-plugin probe).
  - `Props` is no longer exported by Tasty — it was never a Tasty concept, just `Record<string, any>`. Declared locally in `src/props.ts` and still re-exported from the package root, so the UI Kit's own public API is unchanged.

  One style value needed changing: `Styles.stories.tsx` had `inset: '2x bottom 4x left'`, the positional form v3 removed, now `inset: '2x bottom, 4x left'`. Verified against the v3 runtime that the comma form reproduces what v2 rendered (`auto auto 16px 32px`) — the old form now drops the `4x` and renders `auto auto 16px 16px`.

  Also adds 12 color tokens to `tasty.config.ts` that were declared in `src/tasty-augment.d.ts` but missing from the config the ESLint plugin reads, so they were reported as unknown.

  The ESLint plugin's v1 lints Storybook `args.styles` and `styles={{…}}` JSX props for the first time. That is how the `inset` violation above was found — story files had been silently unchecked.

  Both size budgets are raised: `All` from 460 kB to 462 kB (it went over by 161 B) and tree-shaking from 118 kB to 123 kB. Tasty v3 costs +3.77 kB on that entry — its new dev diagnostics ship in every bundle, since `isDevEnv()` is evaluated at runtime so one build serves both modes — and the entry only had ~370 B of headroom.

## 0.154.1

### Patch Changes

- [#1281](https://github.com/cube-js/cube-ui-kit/pull/1281) [`64896a7e`](https://github.com/cube-js/cube-ui-kit/commit/64896a7eb9ee46244b7b0955344adc59e13fff0e) Thanks [@tenphi](https://github.com/tenphi)! - Fix `setPaletteConfig({ pastel: true })` washing out the `code-*` syntax tokens. `pastel` was threaded into every theme including the standalone code one, and it lowers the chroma ceiling hard enough to take `code-keyword` from ~0.19 to ~0.07 — every syntax hue collapsing toward the same grey, which is the difference between readable syntax highlighting and mud.

  The code theme is now built with `pastel` pinned off whatever the palette does, so the emitted `code-*` values are a function of `themes.code.saturation` alone — the same isolation its fixed hues and non-inheriting saturation already gave it. To soften a code block, lower that seed instead:

  ```ts
  setPaletteConfig({ pastel: true, themes: { code: { saturation: 50 } } });
  ```

  The mirrored `surface` the code theme anchors its `['AA','AAA']` floors to goes non-pastel with it. That costs nothing measurable: `surface` sits at saturation factor 0.12, where the pastel ceiling moves chroma only and leaves the tone the floors are actually solved against bit-identical — pinned by a new spec.

  Default output is unchanged; `pastel` ships off.

  The Theme Builder presets now re-seed the **status hues** alongside the brand, which they should have from the start: moving `hue` alone left the shipped statuses behind, and `Forest` at 150° landed 7° off the shipped `success` (156.9°) — a success banner and the brand accent resolving to the same green. Every preset now keeps ≥38° between any two of its five hues, and `Slate` demonstrates `pastel` (plus its own `themes.code.saturation`, since pastel no longer reaches the syntax palette).

## 0.154.0

### Minor Changes

- [#1279](https://github.com/cube-js/cube-ui-kit/pull/1279) [`296e8ae8`](https://github.com/cube-js/cube-ui-kit/commit/296e8ae8c16e7b162b37ec680028d575bb8d018a) Thanks [@tenphi](https://github.com/tenphi)! - Add period pickers — `WeekPicker`, `MonthPicker`, `QuarterPicker`, and `YearPicker` — mirroring Ant Design's `DatePicker picker="week|month|quarter|year"` feature. Each selects a whole calendar period rather than a specific day and is exposed as its own component, all sharing one internal `PeriodPicker` base.

  The value is always a single `CalendarDate` (from `@internationalized/date`) snapped to the start of the period: week → first day of the week (locale-aware), month → the 1st, quarter → the 1st of the quarter's first month, year → January 1st. The field renders a compact label (`2026-W33`, `2026-08`, `2026-Q3`, `2026`), overridable via the `formatValue` prop.

  ```tsx
  import { MonthPicker, QuarterPicker, WeekPicker, YearPicker } from '@cube-dev/ui-kit';

  <MonthPicker onChange={onChange} />
  <QuarterPicker onChange={onChange} minValue={min} maxValue={max} />
  ```

  Built on the existing DatePicker chrome (`DateInputBase` + `DialogTrigger`/`Dialog`), so they inherit field labeling, validation, sizes, and the mobile tray. React Aria has no month/quarter/year/week panels, so those are custom, while the week panel reuses the React Aria day grid with an added week-number column and full-week highlight (behind a new, additive `pickerMode` on the internal `Calendar`/`CalendarGrid`, leaving existing `DatePicker`/`RangeCalendar` behavior unchanged).

## 0.153.0

### Minor Changes

- [#1277](https://github.com/cube-js/cube-ui-kit/pull/1277) [`1de5e56f`](https://github.com/cube-js/cube-ui-kit/commit/1de5e56f179a9fda4ff9dffbfb5c3c5aaee0d41f) Thanks [@tenphi](https://github.com/tenphi)! - Make the color palette tunable at runtime.

  ```ts
  setPaletteConfig({
    hue: 210, // accent hue — the brand
    baseHue: 60, // neutral chrome hue; inherits `hue` when unset
    saturation: 72,
    themes: { danger: { hue: 12 }, code: { saturation: 60 } },
    pastel: false,
    contrastLevel: "auto",
  });
  ```

  Hue is split into two zones: `hue` drives the **accent** zone (the `accent-*` family, `primary` / `purple` / `special`, plus `focus`, the loading faces and the disabled chip) and `baseHue` drives the **base** zone (the neutral chrome — `surface` and its ladder, the `surface-text*` ramp, `border`, `placeholder`). `baseHue` inherits `hue`, so the chrome keeps its faint brand tint unless you decouple it. Only the `default` theme is affected; a colored theme's tinted `surface` deliberately follows its own hue, because a danger banner should read as red.

  Saturation is deliberately _not_ split: it is one seed per theme, and each color's `saturation` is a 0–1 factor of it, so moving it rescales the palette while keeping the designed proportions between a subtle surface tint and a saturated accent.

  Each status theme (`success` / `danger` / `warning` / `note`) re-seeds hue and saturation independently. `pastel` and `contrastLevel` are global.

  `setPaletteConfig()` **replaces**, like `useState` — the config you pass is the config, resolved against the shipped defaults. Nothing accumulates, so removing a customization means removing it from the object, re-applying the same config twice does the same thing as once, and `<Root palette>` can un-set a field by no longer passing it. To change one field of the config already in place, pass an updater; it receives the config as written, sparse, so spreading it preserves what inherits:

  ```ts
  setPaletteConfig((config) => ({ ...config, hue: 235 }));
  ```

  New exports: `setPaletteConfig`, `getPaletteConfig`, `getPaletteConfigInput`, `resolvePaletteConfig`, `resetPaletteConfig`, `subscribePaletteConfig`, `invalidatePaletteTokens`, `usePaletteConfig`, `usePaletteVersion`, `getPalette`, `DEFAULT_PALETTE_CONFIG`, and the types `PaletteConfig` / `ResolvedPaletteConfig` / `PaletteThemeSeed` / `PaletteCodeSeed` / `PaletteThemeName`, plus `getCodeTheme`. `<Root>` gains an equivalent `palette` prop, applied during render so the first paint is already correct.

  **Inherited vs pinned.** Unset fields inherit, so `baseHue` tracks `hue` and `themes.<status>.saturation` tracks `saturation` until something writes them — they are not linked, they just have no value of their own yet. Writing the field pins it; leaving it out unpins it. `getPaletteConfig()` resolves everything and so cannot tell you which is which; `getPaletteConfigInput()` returns the sparse config as set, for settings UIs that need to show an inherited value as inherited — and it is what a `setPaletteConfig` updater is handed.

  **Region previews.** `renderColorTokens({ …config, scheme, highContrast })` resolves the palette for one config and one scheme into flat literal values, ready to apply to a subtree through a tasty `tokens` prop:

  ```tsx
  <Block
    tokens={renderColorTokens({ hue: 210, scheme: "dark" })}
    fill="#surface"
  >
    …renders in that theme, inside a light page…
  </Block>
  ```

  The document palette emits state maps (`@dark` / `@hc`), so a page can only ever show one scheme at a time; collapsing it to a chosen scheme is what lets several themes coexist — a theme picker, or a dark panel in a light page. Config fields layer over the current config — the one place that differs from `setPaletteConfig` — so `{ scheme: 'dark' }` previews the active theme in dark. A preview means "the theme in use, but in dark", so the fields it does not mention come from the live palette rather than from the defaults. `resolvePaletteConfig()` layers the same way. Nothing is applied globally. Aliases, shadow tokens and scrollbar colors ride along by reference so they re-resolve against the region rather than freezing to the outer theme. `renderPaletteTokens` is the same without those, and `resolvePaletteConfig` resolves a partial without applying it.

  A mounted `<Root>` re-injects the token block automatically when the config changes — no component re-render is involved, since every color compiles to a CSS custom property.

  **This refactor changes no colors.** Turning the palette into a function of its seeds is output-neutral: with no config set, every token resolves exactly as it did, and a new snapshot test (156 tokens × 4 scheme variants) enforces it. The surface-ladder and themed-border retune in this release is the only intentional color movement.

  Notes:

  - The palette is process-global (Glaze's own config is, and the tokens live in a single `body` rule), so `<Root palette>` is a convenience wrapper over `setPaletteConfig()`, not a per-tree scope. Under SSR, apply it in code that runs on both server and client — per-request palettes are not supported.
  - The `code-*` syntax family is now its own Glaze theme with its own seed, so neither the brand hue nor the palette saturation reaches it. Every `code-*` hue is absolute (a re-seeded brand can no longer collide string literals with `#code-number` at 156°), and the saturation is fixed at `80` rather than inheriting `saturation`, so muting the palette cannot wash out a code block. Tune it with `themes.code.saturation`; the tokens stay adaptive, keeping their `['AA','AAA']` floor against the real surface in every scheme. Resolved values at the default config are unchanged.
  - A numeric `contrastLevel` removes the high-contrast tier entirely, so `<html data-contrast="high">` and `prefers-contrast: more` stop having an effect while one is set. `pastel: true` changes every resolved color by design. Both are documented in the new `Getting Started/Theming` page.

### Patch Changes

- [#1277](https://github.com/cube-js/cube-ui-kit/pull/1277) [`1de5e56f`](https://github.com/cube-js/cube-ui-kit/commit/1de5e56f179a9fda4ff9dffbfb5c3c5aaee0d41f) Thanks [@tenphi](https://github.com/tenphi)! - Update `@tenphi/glaze` 1.2.0 → 1.3.0. **Resolved colors are unchanged**: every token was dumped in all four scheme variants (`''`, `@dark`, `@hc`, `@dark & @hc`) and diffed against 1.2.0 — byte-identical.

  1.3.0 adds the `contrastLevel` config field (a manual 0–100 contrast level replacing the two-tier high-contrast model, where levels 0 and 100 reproduce the normal and high-contrast output exactly), the `resolveContrastForLevel()` export, and the `preferInitial` contrast-solver option. Nothing existing changed behavior.

  A new snapshot spec (`src/tokens/palette.test.ts`) pins the resolved palette — 156 tokens across four scheme variants — so a future Glaze bump or seed retune cannot move colors silently.

- [#1277](https://github.com/cube-js/cube-ui-kit/pull/1277) [`1de5e56f`](https://github.com/cube-js/cube-ui-kit/commit/1de5e56f179a9fda4ff9dffbfb5c3c5aaee0d41f) Thanks [@tenphi](https://github.com/tenphi)! - Update `@tenphi/tasty` 2.11.0 → 2.11.2, which fixes global-style hook behavior. `useGlobalStyles` now keys its injection slots per root instead of in one module-level map, and the SSR / RSC collectors treat an `id`-keyed entry as replaceable rather than deduplicating it by content.

  That matters for the runtime-tunable palette: `<Root>` injects the token block as `useGlobalStyles('body', …, { id: 'cube-ui-kit-tokens' })`, so re-seeding the palette now replaces the previous block correctly on the server and in shadow roots, not just on the client.

  The bump adds ~400 B to the tree-shaken `Button` entry, so its `size-limit` budget moved 118 kB → 119 kB.

- [#1277](https://github.com/cube-js/cube-ui-kit/pull/1277) [`1de5e56f`](https://github.com/cube-js/cube-ui-kit/commit/1de5e56f179a9fda4ff9dffbfb5c3c5aaee0d41f) Thanks [@tenphi](https://github.com/tenphi)! - Add an optional `scheme` prop to `CubeLogo` / `CubeFullLogo`.

  The mark is two drawings swapped by the `@dark` state, which is resolved against the document. `scheme="light" | "dark"` pins one of them for cases where the background is known but the document scheme does not describe it — a fixed-dark panel in a light app, an exported image, or a region themed through `tokens` (which overrides token _values_, and so cannot reach a state). Omitting it keeps today's behaviour: the CSS swap, with no re-render and correct SSR.

- [#1277](https://github.com/cube-js/cube-ui-kit/pull/1277) [`1de5e56f`](https://github.com/cube-js/cube-ui-kit/commit/1de5e56f179a9fda4ff9dffbfb5c3c5aaee0d41f) Thanks [@tenphi](https://github.com/tenphi)! - Retune the surface ladder, the themed borders and the radio mark.

  - `#surface-2`, `#surface-3` and `#surface-4` gain wider high-contrast tone pairs (`['-2','-4']`, `['-4','-8']`, `['-6','-12']`), so nested panels stay distinguishable when a user asks for more contrast. The tinted `<theme>-surface` widens the same way.
  - `#border` deepens in high contrast too (`['-10','-30']`).
  - The tinted `<theme>-border` used by OUTLINE-variant items drops from `saturation: 0.5` to `0.3` and takes the same wider HC pair, so a themed border reads as a border rather than a second accent.
  - The checked `Radio` mark moves from `#primary` to `#primary-text`, matching the `#danger-text` / `#success-text` its own invalid and valid states already used. `#primary` is a fixed brand fill that barely moves between schemes; `#primary-text` is contrast-solved against the surface, so the dot lightens in dark (L 0.54 → 0.76) and in high contrast instead of staying a mid-tone purple.
  - `Alert` borders now use `#<theme>-border` instead of a 20%-alpha accent fill, which is what makes the themed borders consistent between alerts and outline items. The `special` alert border moves to `#primary-border` for the same reason.

  Scope, measured across all 156 tokens in all four scheme variants: **68 tokens moved** — 68 in `@dark & @hc` and 62 in `@hc`. Only **six** move in the normal and dark schemes, and they are exactly the themed borders (`#primary-border`, `#purple-border`, `#success-border`, `#danger-border`, `#warning-border`, `#note-border`), from the saturation change. Everything else is high-contrast only. No token was added or removed, and the `code-*` family does not move at all.

- [#1277](https://github.com/cube-js/cube-ui-kit/pull/1277) [`1de5e56f`](https://github.com/cube-js/cube-ui-kit/commit/1de5e56f179a9fda4ff9dffbfb5c3c5aaee0d41f) Thanks [@tenphi](https://github.com/tenphi)! - Fix `onChange` on `Switch` and `Checkbox` not typechecking in controlled mode.

  `CubeSwitchProps` / `CubeCheckboxProps` were missing `onChange`, `isSelected` and `defaultSelected` entirely, so every controlled call site needed a `@ts-expect-error`. Root cause: `tsconfig.json` sets `preserveSymlinks: true`, so TypeScript resolves `react-aria`'s type re-exports from the symlink path and never finds the `@react-aria/*` subpackages (they are not direct dependencies); `skipLibCheck` then hides the failure and every `Aria*Props` silently becomes `any`. Extending an `any` base contributes no members, which is why exactly these props vanished.

  The selection contract is now declared explicitly as `ToggleSelectionProps` (`src/shared/form.ts`) and mixed into both components, restoring real type checking — a wrong handler signature now fails again. Four `@ts-expect-error` suppressions were removed (`Disclosure` and `Tree` internals plus the theming stories), and `Checkbox` no longer types its non-DOM `onChange` onto the `<label>` element it spreads props onto.

  `Radio` deliberately keeps no `onChange`: in React Aria a single radio has none — selection is owned by `Radio.Group`.

  Removing `preserveSymlinks` is the real fix, but it surfaces ~320 previously-hidden type errors across ~60 files, so it needs its own migration. The cause is documented in `AGENTS.md` and `tsconfig.json` so the next person does not re-diagnose it.

## 0.152.0

### Minor Changes

- [#1273](https://github.com/cube-js/cube-ui-kit/pull/1273) [`21367384`](https://github.com/cube-js/cube-ui-kit/commit/21367384906d0a0dcac35402627c76be30c18832) Thanks [@tenphi](https://github.com/tenphi)! - Add an ESLint plugin at `@cube-dev/ui-kit/eslint-plugin` with a new autofixable rule, `no-redundant-default-prop`, that flags props explicitly set to the value the component already defaults to (`<Button type="outline">`, `<Select size="medium">`).

  The rule only reports components it can prove were imported from `@cube-dev/ui-kit`, so a local or third-party component sharing a name with a ui-kit export is never touched. Use the `packages` option to opt in an internal barrel that re-exports ui-kit.

  ```js
  // eslint.config.js
  import uiKit from "@cube-dev/ui-kit/eslint-plugin";

  export default [...uiKit.configs.recommended];
  ```

  The defaults it checks against are pregenerated by rendering each component twice — with and without the prop — and comparing markup and tasty CSS, so props whose default is conditional, context-derived, or reflected onto the DOM are excluded rather than incorrectly flagged. 72 components and 346 defaults are covered.

  Also corrects six documented defaults that had drifted from the implementation:

  - `Dialog` `size`: `S` → `M`
  - `Switch` `size`: `large` → `medium`
  - `Tabs` `size`: `'small'` → `'medium'`
  - `DialogContainer` `isDismissable`: `false` → `true`
  - `RadioGroup` `orientation`: `auto` was not a valid value; the default is derived from `type`
  - `DatePicker` `useLocale`: documented as `false`, but leaving it unset is a third mode distinct from `false` — unset applies the kit's own segment order, `false` forces `en-US`

## 0.151.0

### Minor Changes

- [#1270](https://github.com/cube-js/cube-ui-kit/pull/1270) [`65bf3bc1`](https://github.com/cube-js/cube-ui-kit/commit/65bf3bc1272d8cda386eb712cf682fc94e469f3e) Thanks [@tenphi](https://github.com/tenphi)! - **Breaking:** remove `CloudLogo`. It shipped the previous brand artwork with hard-coded hexes (`#ff6492`, `#141446`, `#7a77ff`, `#a14474`) and the retired "Cube Cloud" wordmark, so it could neither adapt to a colour scheme nor be recoloured.

  Replaced by two `Icon`-based marks:

  - **`CubeLogo`** — the square cube mark. `size` drives both axes, like any other icon.
  - **`CubeFullLogo`** — mark plus wordmark on one canvas. `size` sets the **height only**; the width follows the artwork's `98 / 28` ratio via `aspect-ratio`, so the wordmark is never squashed. Do not set an explicit `width`.

  Both draw every path with `currentColor`, so they inherit the surrounding text colour or take an explicit `color`, and both fall back to `$icon-size` when no `size` is given.

  The mark is two different drawings rather than one recoloured — the dark variant is filled differently to hold its weight on a dark surface — and the `@dark` state swaps them in CSS. That costs no re-render, needs no scheme prop, and is correct during SSR. Both paths are always present in the DOM, so assert on `[data-element="LightMark"]` / `[data-element="DarkMark"]` rather than a single `path`.

  Migrating: `<CloudLogo to="/" />` became a logo _inside_ an interactive element rather than being one itself, since the old component was a `Button`. Wrap it yourself and keep the accessible name on the control:

  ```jsx
  <Button aria-label="Cube home" to="/">
    <CubeFullLogo aria-hidden />
  </Button>
  ```

## 0.150.0

### Minor Changes

- [#1267](https://github.com/cube-js/cube-ui-kit/pull/1267) [`f9d7ebdc`](https://github.com/cube-js/cube-ui-kit/commit/f9d7ebdc1cb15df73eb3cbbd4fe1db45f2c1f319) Thanks [@tenphi](https://github.com/tenphi)! - Add `s2`, `s3`, and `s4` monospace typography presets for code and snippet text (sized to match `t2`–`t4`, using `--font-mono`). `PrismCode` and `CopySnippet` now use `s3` by default.

- [#1267](https://github.com/cube-js/cube-ui-kit/pull/1267) [`f9d7ebdc`](https://github.com/cube-js/cube-ui-kit/commit/f9d7ebdc1cb15df73eb3cbbd4fe1db45f2c1f319) Thanks [@tenphi](https://github.com/tenphi)! - Update `@tenphi/glaze` 0.13.0 → 1.2.0 and migrate the palette from the `lightness` axis to the contrast-shaped `tone` axis.

  **This changes resolved colors.** Glaze 1.x removed `lightness` as a color-def input, so the upgrade and the axis migration are the same change — all 54 palette declarations are re-authored against `tone`. Because `tone` is contrast-shaped rather than lightness-shaped, tokens do not land on their previous values. Measured per-channel RGB delta against the previous release, across every token in all four scheme variants: core surfaces/text mean ~13 (max 51), accent mean ~13 (max 48). Seed hue and saturation are unchanged, so hue relationships and relative ramps are preserved — the shift is in tone placement, not in the palette's structure.

  Also newly available from Glaze 1.2.0: `tone: 'max'` / `'min'` on colors that declare a `base` (the extreme is no longer re-mapped through the dark tone window, which used to compress the base-to-extreme span and lower contrast in dark), and `darkHue` / `darkSaturation` for seeding the dark schemes independently of the flat `darkDesaturation` haircut.

- [#1267](https://github.com/cube-js/cube-ui-kit/pull/1267) [`f9d7ebdc`](https://github.com/cube-js/cube-ui-kit/commit/f9d7ebdc1cb15df73eb3cbbd4fe1db45f2c1f319) Thanks [@tenphi](https://github.com/tenphi)! - Defer Glaze color token resolution until first access (`getPaletteTokens` / `getColorTokens` / `getTokens`) so host apps can call `glaze.configure(...)` after importing the kit and still affect UI Kit tokens. Existing `PALETTE_TOKENS` / `COLOR_TOKENS` / `TOKENS` exports remain as lazy proxies.

### Patch Changes

- [#1267](https://github.com/cube-js/cube-ui-kit/pull/1267) [`f9d7ebdc`](https://github.com/cube-js/cube-ui-kit/commit/f9d7ebdc1cb15df73eb3cbbd4fe1db45f2c1f319) Thanks [@tenphi](https://github.com/tenphi)! - Fix primary (and other solid accent) disabled button labels — `#*-accent-disabled-surface-text` rides the extreme away from its disabled chip (`tone: 'max'`), so the label stays deliberately faint (~cr 1.7, reading as disabled rather than as live text) while keeping a consistent separation from the chip in light, dark, and high-contrast schemes.

  Previously this was a contrast-driven relative step (`lightness: '+1'` with `contrast: 1.51`). Authoring it as an extreme is only viable from `@tenphi/glaze` 1.2.0, which no longer re-maps a based extreme through the dark tone window — that compressed the base-to-extreme span and lowered the dark label's contrast.

- [#1267](https://github.com/cube-js/cube-ui-kit/pull/1267) [`f9d7ebdc`](https://github.com/cube-js/cube-ui-kit/commit/f9d7ebdc1cb15df73eb3cbbd4fe1db45f2c1f319) Thanks [@tenphi](https://github.com/tenphi)! - Keep `#pink` resolving. The legacy alias was dropped while `tasty.config.ts`, `Usage.docs.mdx` and the `pink` key in the Tasty token augmentation all still advertised it, so consumer styles using it would have silently stopped resolving with types still reporting the token as valid. Restored as the same scheme-static literal.

  Fix `CopySnippet`'s `serif` variant rendering monospace. Moving the code element to the `s3` / `t3` presets lost the font family: `s3` carries `fontFamily: var(--font-mono)` but `t3` sets no family at all, so `serif` fell back to the `<code>` element's UA monospace default. The family is explicit again — monospace by default, the design system's default stack under `serif`.

- [#1267](https://github.com/cube-js/cube-ui-kit/pull/1267) [`f9d7ebdc`](https://github.com/cube-js/cube-ui-kit/commit/f9d7ebdc1cb15df73eb3cbbd4fe1db45f2c1f319) Thanks [@tenphi](https://github.com/tenphi)! - Ensure HTML syntax highlighting works in `PrismCode` and `CopySnippet`, including JavaScript inside `<script>` tags. Differentiate tag names, attributes, values, and punctuation so markup is not a single color wash.

- [#1267](https://github.com/cube-js/cube-ui-kit/pull/1267) [`f9d7ebdc`](https://github.com/cube-js/cube-ui-kit/commit/f9d7ebdc1cb15df73eb3cbbd4fe1db45f2c1f319) Thanks [@tenphi](https://github.com/tenphi)! - Selected outline/clear Item labels now use the softer `#primary-accent-text-soft` at rest and intensify to `#primary-accent-text` on hover (mirroring links). Both brand-text tokens are solved for AA against the selected fill, keeping labels readable and saturated.

## 0.149.2

### Patch Changes

- [#1261](https://github.com/cube-js/cube-ui-kit/pull/1261) [`ce4664ac`](https://github.com/cube-js/cube-ui-kit/commit/ce4664ac7ed71c487cb1e89ab85ab00f26e5b24e) Thanks [@solarrust](https://github.com/solarrust)! - `DialogTrigger`'s `mobileType` now defaults to the same value as `type` instead of silently converting `type="popover"` to a full-screen modal under the 700px breakpoint. That auto-conversion was never an intentional per-consumer choice — `FilterPicker` and `Picker` both inherited it by omission, giving them an unrequested full-screen modal (with a close button) on narrow viewports like the Excel/Google Sheets add-in task pane. Consumers that want a different mobile presentation (e.g. `DatePicker`'s `mobileType="tray"`) are unaffected, since they already set it explicitly.

  `FilterPicker` additionally no longer shows a close button in its popover at all (`isDismissable={false}` on its own Dialog) — it read as a duplicate of the existing "Clear" action in the header.

## 0.149.1

### Patch Changes

- [#1264](https://github.com/cube-js/cube-ui-kit/pull/1264) [`351a1758`](https://github.com/cube-js/cube-ui-kit/commit/351a1758b7dd27d81680aeb0fb59f2292e4b339b) Thanks [@tenphi](https://github.com/tenphi)! - Release-pipeline maintenance, no runtime changes: the `Build & canary release` check is no longer reported twice by two different workflows, and the Version Packages PR no longer publishes a redundant canary or leaves a stale `pr_*` dist-tag behind.

## 0.149.0

### Minor Changes

- [#1257](https://github.com/cube-js/cube-ui-kit/pull/1257) [`ad7190c7`](https://github.com/cube-js/cube-ui-kit/commit/ad7190c7be84654799aad1c9b72c2f4447ccbcee) Thanks [@tenphi](https://github.com/tenphi)! - Added the `InfoBadge` component — an informational icon with a tooltip. It renders as a plain `ItemBadge` by default and upgrades to an `ItemAction` link/button as soon as `to` or `onPress` is provided, so the same icon can point at the docs. The badge contains its own press events (including `preventDefault` on click), which lets it sit inside a bigger click target — a field `<label>`, a switch row, a table header — without activating it. When interactive, the tooltip gets a localized `Click to learn more.` suffix, which `tooltipSuffix` overrides or removes.

  `size` is `small` | `medium` | `large` (default `medium`). Every size contributes exactly one line to the text around it, so the badge stays vertically aligned with adjacent text — in a field label, a table header, or mid-paragraph — whichever size you pick.

  The info icon that fields render for their `tooltip` prop is now an `InfoBadge`, so clicking it no longer activates the field it labels.

  `tooltip={{ title }}` on `ItemAction` and `ItemBadge` now accepts any `ReactNode` as the title. Rich titles are no longer used as the `aria-label` (previously they were stringified into it) — pass `aria-label` for those.

  `ItemAction` and `ItemBadge` now treat an explicit `aria-label` as higher priority than the accessible name inferred from a string `tooltip`. Previously `ItemAction` let the tooltip win, so an `aria-label` passed alongside a string tooltip was silently dropped.

### Patch Changes

- [#1260](https://github.com/cube-js/cube-ui-kit/pull/1260) [`07914318`](https://github.com/cube-js/cube-ui-kit/commit/0791431810ae3c9f663ccbf457fdc3c6c7cfe4fa) Thanks [@tenphi](https://github.com/tenphi)! - Update `@tenphi/tasty` to 2.11.0 and `@tenphi/eslint-plugin-tasty` to 0.11.2, and reformat the styles the new lint rules cover. No public API or rendering change — every rewrite was verified to emit identical CSS, and Chromatic reports all 905 stories unchanged.

## 0.148.0

### Minor Changes

- [#1255](https://github.com/cube-js/cube-ui-kit/pull/1255) [`c5a1eee4`](https://github.com/cube-js/cube-ui-kit/commit/c5a1eee476071df152ac6b5e0f122bebc15aad4f) Thanks [@tenphi](https://github.com/tenphi)! - Align the API of all form input components around `isInvalid` / `isValid`.

  - Every input component now accepts `isInvalid` and `isValid` booleans instead of `validationState`. `Form`, `DialogForm` and the legacy `Field` accept them too.
  - `validationState` still works but is deprecated. It is normalized into `isInvalid` / `isValid` at the edge and logs a deprecation warning in development.
  - Explicit validation props now take precedence over the state derived from the form. Previously form-derived state could override an explicitly passed prop.
  - `useFieldProps` is now the single entry point for input components — it applies `useProviderProps` and `useFormProps` internally. Calling them explicitly is still supported but no longer necessary.
  - `TextInputBase` became purely presentational, which removes a duplicate field registration in the text input family. As a result `SearchInput` no longer registers with a surrounding `Form` — like `SearchComboBox`, it is a standalone control rather than a form field. Use `TextInput` or `ComboBox` when you need a form-attached field.
  - Fixed `DateInput` never rendering the valid state. It forwarded only the invalid state to its input chrome, so neither an explicit valid prop nor a form-derived valid state (`showValid`) produced the valid styling or the check icon.
  - Every input component now renders the valid state, not just the invalid one. `Checkbox`, `Switch` and `Radio` gained valid fill and border styling (`Switch` also gained the matching invalid fill when checked), `Picker` and `FilterPicker` gained the validation suffix icon that `Select` already had, and `FileInput`, `Slider`, `RangeSlider` and `TextInputMapper` render validation state at all for the first time — they previously accepted `isInvalid` / `isValid` and ignored them.
  - New exports for building input components: `resolveValidationProps`, `useValidationProps`, `getValidationMods`, `getValidationTheme`, `getValidationIcon`, `hasValidationIndicator` and `<ValidationIndicator>`.
  - Removed the unused `extractFieldWrapperProps` helper.

## 0.147.3

### Patch Changes

- [#1251](https://github.com/cube-js/cube-ui-kit/pull/1251) [`b8388790`](https://github.com/cube-js/cube-ui-kit/commit/b83887900ad95737181268cf113d29165fa760cd) Thanks [@tenphi](https://github.com/tenphi)! - Ensure HTML syntax highlighting works in `PrismCode` and `CopySnippet`, including JavaScript inside `<script>` tags. Differentiate tag names, attributes, values, and punctuation so markup is not a single color wash.

## 0.147.2

### Patch Changes

- [#1249](https://github.com/cube-js/cube-ui-kit/pull/1249) [`e695981e`](https://github.com/cube-js/cube-ui-kit/commit/e695981e518a59205ef8d9b9768dcbf9804ada4e) Thanks [@tenphi](https://github.com/tenphi)! - Fix Disclosure content panel occasionally measuring to 0 height when expanding (content-visibility: auto interacted badly with the height 0 → max-content transition).

## 0.147.1

### Patch Changes

- [#1247](https://github.com/cube-js/cube-ui-kit/pull/1247) [`2c071cc1`](https://github.com/cube-js/cube-ui-kit/commit/2c071cc104f8be599e89a1d6f597beecc0021dcf) Thanks [@tenphi](https://github.com/tenphi)! - Clarify when to use selection, search, command, and menu components.

## 0.147.0

### Minor Changes

- [#1245](https://github.com/cube-js/cube-ui-kit/pull/1245) [`e1f53628`](https://github.com/cube-js/cube-ui-kit/commit/e1f5362810d152b9e1427397d1b43704b083286f) Thanks [@tenphi](https://github.com/tenphi)! - Add `SearchComboBox` — a search-styled combobox for "search and act" flows. It fires `onSelect`/`onSubmit` and clears the input after each action, supports external (server-side) filtering with `filter={false}`, delays the loading indicator (via `loadingDelay`, default 1s) to avoid flicker on fast responses, and accepts a custom `emptyLabel`.

### Patch Changes

- [#1245](https://github.com/cube-js/cube-ui-kit/pull/1245) [`e1f53628`](https://github.com/cube-js/cube-ui-kit/commit/e1f5362810d152b9e1427397d1b43704b083286f) Thanks [@tenphi](https://github.com/tenphi)! - Fix ComboBox clear button requiring two clicks to clear the value while the options popover is open. The clear button now dismisses the popover and clears the value in a single click.

- [#1245](https://github.com/cube-js/cube-ui-kit/pull/1245) [`e1f53628`](https://github.com/cube-js/cube-ui-kit/commit/e1f5362810d152b9e1427397d1b43704b083286f) Thanks [@tenphi](https://github.com/tenphi)! - Fix ComboBox loading icon alignment so it occupies the same square slot as the left icon.

## 0.146.1

### Patch Changes

- [#1243](https://github.com/cube-js/cube-ui-kit/pull/1243) [`d7c67aee`](https://github.com/cube-js/cube-ui-kit/commit/d7c67aee9e0e8f7f4008e5a857f1ed65f4ad5747) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: stop arrow keys from moving a widget when focus is inside nested controls (e.g. `input` / `textarea`). Keyboard moves only run when the widget host itself is focused.

## 0.146.0

### Minor Changes

- [#1232](https://github.com/cube-js/cube-ui-kit/pull/1232) [`76e1f991`](https://github.com/cube-js/cube-ui-kit/commit/76e1f991e7490bb8c0131ce302e1d479e2511b4b) Thanks [@tenphi](https://github.com/tenphi)! - Add built-in i18n: a default i18next instance (read via `getI18n()`), request-local instances from `createUIKitI18n(locale)`, 12 locale bundles, an `I18nProvider` wired into `Root`, locale-aware formatters (`useFormatter` and `createFormatter(locale)`), and translated defaults across UI Kit components. Re-export `i18next` and `react-i18next` so hosts import a single copy from `@cube-dev/ui-kit`.

## 0.145.4

### Patch Changes

- [#1240](https://github.com/cube-js/cube-ui-kit/pull/1240) [`6f0cbd7d`](https://github.com/cube-js/cube-ui-kit/commit/6f0cbd7d25f5663d59c31cccfc0039f184de1376) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: fix drags creating overlapping widgets in non-compacting modes (`compact={null}` or `preventCollision`). Moving a widget so it pushed a neighbour could stack that neighbour on top of another widget. Both keyboard and pointer moves now reject any step whose resulting layout has overlapping widgets — keyboard scans further for a clear slot, pointer keeps the widget at its last valid arrangement — so the two inputs behave consistently and neither ever stacks widgets (unless `allowOverlap` is set). Widgets still push/swap neighbours whenever the move resolves without an overlap.

## 0.145.3

### Patch Changes

- [#1238](https://github.com/cube-js/cube-ui-kit/pull/1238) [`18befae9`](https://github.com/cube-js/cube-ui-kit/commit/18befae913ab33a34054a880125ae2aae0691994) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: improve keyboard and focus behavior for draggable widgets. Clicking an eligible drag zone now focuses the widget; keyboard focus shows an adaptive focus ring (`:focus-visible`). Arrow-key moves respect layout constraints, scan past blocked cells to the next valid slot, and reflow neighbours without overlap where the board mode allows. Widget position transitions now include `width` and `height`.

## 0.145.2

### Patch Changes

- [#1236](https://github.com/cube-js/cube-ui-kit/pull/1236) [`cf45199b`](https://github.com/cube-js/cube-ui-kit/commit/cf45199b23d6f4b385607448fe9feb779adb0588) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: a board now becomes the drop target when the dragged widget's center enters it, instead of only once its top-left corner is inside. Empty boards open (expand to preview the drop) as soon as the widget's center touches them. The landing/placeholder stays anchored to the grabbed point, so it keeps tracking the floating widget.

- [#1236](https://github.com/cube-js/cube-ui-kit/pull/1236) [`cf45199b`](https://github.com/cube-js/cube-ui-kit/commit/cf45199b23d6f4b385607448fe9feb779adb0588) Thanks [@tenphi](https://github.com/tenphi)! - `Board`: widgets no longer animate (`inset` transition) on initial render. The board now waits for widgets to paint at their first measured positions before activating position transitions, so they settle into place instead of sliding in from their default spot. Transitions still apply to subsequent reflows (drag/resize of neighbours, compaction, aligned-column changes).

## 0.145.1

### Patch Changes

- [`75485638`](https://github.com/cube-js/cube-ui-kit/commit/75485638fa25b93f07ae1c14c96ab03d377188f0) Thanks [@tenphi](https://github.com/tenphi)! - Lowered the `engines.node` requirement from `>=24.0.0` to `>=22.0.0` so the package installs cleanly into projects on Node 22 (e.g. Cube Cloud, which runs Node 22.14). No runtime code changes; CI non-publish jobs now run on Node 22 too. The npm publish jobs remain on Node 24 because OIDC trusted publishing requires npm ≥ 11.5.1+, which Node 24 ships natively (Node 22 ships npm 10.x).

## 0.145.0

### Minor Changes

- [#1233](https://github.com/cube-js/cube-ui-kit/pull/1233) [`3a2d553e`](https://github.com/cube-js/cube-ui-kit/commit/3a2d553e970062080a04d1120cca77192981d4cb) Thanks [@tenphi](https://github.com/tenphi)! - Enhance `Board` with widget defaults, card styling, and aligned nested-board improvements:

  - Add `widgetProps` on `Board` to set default props for every hosted widget (e.g. `widgetProps={{ isCard: true }}`).
  - Add `isCard` on `Board.Widget` for optional card borders; widgets are filled (`#surface-2`) and rounded by default.
  - Add per-widget `minW`/`maxW`/`minH`/`maxH` bounds on `Board.Widget` (used when layout items omit them).
  - Accept container style props directly on `Board.Widget` (merged into `styles`).
  - Aligned nested boards (`isAligned`) now use the parent's row height verbatim (no shrinking to fit) and default `containerPadding` to `[0, 0]` so columns line up with the ancestor grid.
  - Nested boards inherit an ancestor's `showGridLines` while dragging when they do not set their own.

## 0.144.0

### Minor Changes

- [#1228](https://github.com/cube-js/cube-ui-kit/pull/1228) [`e5a3b853`](https://github.com/cube-js/cube-ui-kit/commit/e5a3b853a01d3b063242043606d9f11803b326e4) Thanks [@tenphi](https://github.com/tenphi)! - Add new `Board` component: a draggable and resizable widget grid for dashboards with layout compaction, cross-board dragging via `Board.Provider`, nested boards, and keyboard accessibility via React Aria.

## 0.143.1

### Patch Changes

- [#1226](https://github.com/cube-js/cube-ui-kit/pull/1226) [`8c2a36e8`](https://github.com/cube-js/cube-ui-kit/commit/8c2a36e803c50ea7153b2ab88c9fdec2d94ab262) Thanks [@solarrust](https://github.com/solarrust)! - Fix `Layout.Header` title and breadcrumb text clipping by using normal line height instead of the tight heading preset.

## 0.143.0

### Minor Changes

- [`2528e514`](https://github.com/cube-js/cube-ui-kit/commit/2528e51491afdb563e7ab4b1a2da4f85d5dfd318) Thanks [@tenphi](https://github.com/tenphi)! - Add new `CommandTextArea` component: a textarea-based command input with token-triggered autocomplete, virtual focus management, and form system integration.

### Patch Changes

- [#1222](https://github.com/cube-js/cube-ui-kit/pull/1222) [`4232aad3`](https://github.com/cube-js/cube-ui-kit/commit/4232aad3d7910632e6c99e5ab985b572c5272824) Thanks [@tenphi](https://github.com/tenphi)! - Fix several `CommandTextArea` issues and a related `ComboBox` filtering regression:

  - **Stale virtual focus / commit**: As the typed token narrows, virtual focus now moves to the first still-visible option when the previously highlighted option is filtered out, and `Enter`/`Tab` can no longer commit a hidden command (e.g. typing `/` then `h` no longer inserts `/clear`). Visible options are derived from the component's own filtered collection instead of the ListBox state ref, which can lag by one render.
  - **Conditional Hook**: `listStateRef` no longer calls `useRef` conditionally, preventing the Hook-order changes that could occur when the optional `listStateRef` prop was added or removed.
  - **Stale caret after external value updates**: When the textarea value changes from outside (controlled updates, form reset, or a seeded `defaultValue`), the caret is now resynced from the DOM selection so trigger parsing uses a valid index.
  - **`defaultValue` ignored**: An uncontrolled `CommandTextArea` now seeds its text (and trigger parsing) from `defaultValue`.
  - **`ComboBox` filtering**: `ComboBox` again filters on `textValue` only, as documented. The shared `filterCollectionNodes` helper now matches plain-text `children`/`description` only when a component opts in via `matchExtraFields` (used by `CommandTextArea`).

- [#1224](https://github.com/cube-js/cube-ui-kit/pull/1224) [`5acb166c`](https://github.com/cube-js/cube-ui-kit/commit/5acb166c961d394043f83d254ac4625127a41d85) Thanks [@tenphi](https://github.com/tenphi)! - Fix Notification rendering a duplicate "Dismiss" button when a custom `NotificationAction` with `isDismiss` is provided. Replaced the render-phase ref-mutation detection with deterministic static inspection of the `actions` tree, so the auto-appended "Dismiss" is reliably suppressed regardless of render order or concurrent rendering timing.

## 0.142.10

### Patch Changes

- [#1220](https://github.com/cube-js/cube-ui-kit/pull/1220) [`916384db`](https://github.com/cube-js/cube-ui-kit/commit/916384db2715be63e7d07342da28ca74b6d9f88e) Thanks [@tenphi](https://github.com/tenphi)! - Fix checkbox click area regressions in checkable ListBox and Tree.

  - **ListBox:** The `IconSwitch` slot now stretches to fill its parent grid cell, restoring the full-cell click target for checkable multiple-selection options.
  - **Tree:** The checkbox wrapper now stretches to the full row height and toggles on click across the entire wrapper area (not just the inner checkbox box).

- [#1215](https://github.com/cube-js/cube-ui-kit/pull/1215) [`03c1c58e`](https://github.com/cube-js/cube-ui-kit/commit/03c1c58eb7c41e9d628057b3e7cc0b654105491b) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty to the latest version.

## 0.142.9

### Patch Changes

- [#1217](https://github.com/cube-js/cube-ui-kit/pull/1217) [`6d690d93`](https://github.com/cube-js/cube-ui-kit/commit/6d690d937ec80a70ffe3ffb1e956a9dba7033497) Thanks [@tenphi](https://github.com/tenphi)! - Fix LayoutHeader inner layout.

## 0.142.8

### Patch Changes

- [#1212](https://github.com/cube-js/cube-ui-kit/pull/1212) [`fc4d6cca`](https://github.com/cube-js/cube-ui-kit/commit/fc4d6ccac63c54b71fdc8441f606a4e1b18a7c31) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty to the latest version.

- [#1213](https://github.com/cube-js/cube-ui-kit/pull/1213) [`cc725703`](https://github.com/cube-js/cube-ui-kit/commit/cc7257038d6ad302d793bea1fd035803e36b4260) Thanks [@tenphi](https://github.com/tenphi)! - Fix default typography values to fallback to the existing t3 preset.

## 0.142.7

### Patch Changes

- [#1209](https://github.com/cube-js/cube-ui-kit/pull/1209) [`a56c4e04`](https://github.com/cube-js/cube-ui-kit/commit/a56c4e043bc63c3426a1dde9857c6c592357a70b) Thanks [@tenphi](https://github.com/tenphi)! - Fix Disclosure.Content collapsing to 0px height when content-visibility skips the panel.

## 0.142.6

### Patch Changes

- [#1207](https://github.com/cube-js/cube-ui-kit/pull/1207) [`bea79e74`](https://github.com/cube-js/cube-ui-kit/commit/bea79e749d42b4feb1d4e2d158920b1752583730) Thanks [@tenphi](https://github.com/tenphi)! - One more fix to Calendar popover.

## 0.142.5

### Patch Changes

- [#1206](https://github.com/cube-js/cube-ui-kit/pull/1206) [`68b25b38`](https://github.com/cube-js/cube-ui-kit/commit/68b25b383e46f6cce952efbf06c0f38ba719fe8c) Thanks [@tenphi](https://github.com/tenphi)! - Update glaze to the latest version.

- [#1204](https://github.com/cube-js/cube-ui-kit/pull/1204) [`1bfb2cb7`](https://github.com/cube-js/cube-ui-kit/commit/1bfb2cb7376ebfaa47482b1566712d7aaa31f0a5) Thanks [@tenphi](https://github.com/tenphi)! - Prevent the parent popover closing for calendar buttons.

## 0.142.4

### Patch Changes

- [`c70c2004`](https://github.com/cube-js/cube-ui-kit/commit/c70c2004076c7abf8aa5a9bacb76de744fadd2a7) Thanks [@tenphi](https://github.com/tenphi)! - Improve InlineInput focus management.

## 0.142.3

### Patch Changes

- [#1199](https://github.com/cube-js/cube-ui-kit/pull/1199) [`310031c3`](https://github.com/cube-js/cube-ui-kit/commit/310031c3e43899eba0230b542e158790eb2ceb82) Thanks [@tenphi](https://github.com/tenphi)! - Improve border styling for buttons.

- [#1200](https://github.com/cube-js/cube-ui-kit/pull/1200) [`dc847c41`](https://github.com/cube-js/cube-ui-kit/commit/dc847c41a8a58e0efbc618b1f06e9c6b163eaa23) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty to the latest version.

- [#1197](https://github.com/cube-js/cube-ui-kit/pull/1197) [`146e5cff`](https://github.com/cube-js/cube-ui-kit/commit/146e5cff4bff6a5490c2238a0bd9c4a03bad0317) Thanks [@tenphi](https://github.com/tenphi)! - Fix the input autofill text and caret color.

## 0.142.2

### Patch Changes

- [#1194](https://github.com/cube-js/cube-ui-kit/pull/1194) [`7f721bf8`](https://github.com/cube-js/cube-ui-kit/commit/7f721bf8aba4505df5c386b2496e7472f860cf2d) Thanks [@tenphi](https://github.com/tenphi)! - Prevent Disclosure.Trigger closing the parent popover.

- [#1195](https://github.com/cube-js/cube-ui-kit/pull/1195) [`a84ac7f4`](https://github.com/cube-js/cube-ui-kit/commit/a84ac7f4dcb734bc2de4bc5308fc3b2c04456f6d) Thanks [@tenphi](https://github.com/tenphi)! - Fix submenu trigger behavior inside menus triggered by useAnchoredMenu and useContextMenu.

## 0.142.1

### Patch Changes

- [#1192](https://github.com/cube-js/cube-ui-kit/pull/1192) [`33d633ef`](https://github.com/cube-js/cube-ui-kit/commit/33d633efc2c958c8e4bbfde77dfb8c76f769db13) Thanks [@tenphi](https://github.com/tenphi)! - **Fix:** A `DialogTrigger type="popover"` no longer swallows the outside click
  that opens another popover. Previously, while a popover Dialog was open, a
  single click on a sibling popover trigger was consumed and that trigger's
  popover would not open. The popover branch now uses the same
  `shouldCloseOnInteractOutside` predicate as `Select`, `ComboBox`, and
  `MenuTrigger`, letting clicks on other popover triggers (and
  `data-popover-dismiss` controls) through so `usePopoverSync` can hand off
  between popovers correctly.

## 0.142.0

### Minor Changes

- [#1188](https://github.com/cube-js/cube-ui-kit/pull/1188) [`dd3419ce`](https://github.com/cube-js/cube-ui-kit/commit/dd3419ce0a91e9f747c1ed78175e94c557b8c810) Thanks [@tenphi](https://github.com/tenphi)! - **Breaking:** Refs forwarded to `Modal`, `Tray`, `Dialog`, `Form`, `MenuTrigger`, `Menu`, `CommandMenu`, `RadioGroup`, `CheckboxGroup`, and `Label` now resolve to the underlying DOM element directly. The previous `@react-spectrum/utils` `{ UNSAFE_getDOMNode() }` wrapper (`DOMRefValue`) has been removed. Migrate by reading `ref.current` instead of calling `ref.current?.UNSAFE_getDOMNode()` on these components.

  Internally, these components now use `useObjectRef` from `@react-aria/utils` in place of `useDOMRef` from `@react-spectrum/utils`. Refs into focusable wrappers like `Button` (which still use `useFocusableRef`) are unaffected and continue to expose `UNSAFE_getDOMNode()` plus `focus()`.

- [#1188](https://github.com/cube-js/cube-ui-kit/pull/1188) [`dd3419ce`](https://github.com/cube-js/cube-ui-kit/commit/dd3419ce0a91e9f747c1ed78175e94c557b8c810) Thanks [@tenphi](https://github.com/tenphi)! - **New:** Pressing a `Button` or `ItemButton` inside an open popover now
  **dismisses that popover by default**. This covers every overlay that uses
  `usePopoverSync` — `FilterPicker`, `Picker`, `ComboBox`, `Select`,
  `MenuTrigger`, `SubMenuTrigger`, `DialogTrigger type="popover"`,
  `use-anchored-menu`, and `use-context-menu`. Modal/tray/fullscreen Dialogs
  are **not** affected — a Button inside a modal Dialog still does not
  auto-close it.

  The dismiss event is dispatched through the EventBus and deferred via
  `setTimeout(0)`, so synchronous `onPress` handlers (and any React state
  updates they trigger) flush BEFORE the popover closes. This makes the
  common "open a hoisted modal from a popover footer" flow work without
  flicker: the modal mounts first, then the popover closes.

  ### Opt-outs

  - **Automatic** — Buttons that act as popover triggers (`MenuTrigger`
    children, `DialogTrigger type="popover"` children, picker trigger
    ItemButtons) already carry `data-popover-trigger` and skip the dismiss.
    Modal-type `DialogTrigger` children stay unmarked so they correctly
    dismiss the parent popover and let the modal take over.
  - **Manual** — Add `data-popover-keep` to a Button (toggle case) or any
    ancestor element (subtree case):

    ```jsx
    <Button data-popover-keep onPress={() => setMode((m) => !m)}>
      Toggle
    </Button>

    <div data-popover-keep>{/* every Button inside opts out */}</div>
    ```

  - **Custom non-Cube triggers** — call the newly exported
    `useDismissParentPopover()` to wire the same behaviour into your own
    interactive controls.

  ### Migration

  Existing Buttons / ItemButtons inside popovers that were expected to **keep
  the popover open** on press (toggles, inline editors, mode switches, etc.)
  need `data-popover-keep`. Popover triggers wrapped by `MenuTrigger`,
  `DialogTrigger type="popover"`, `FilterPicker`, `Picker`, `ComboBox`, or
  `Select` need no change — they're auto-skipped.

  ### Internals

  - `usePopoverSync` gained a `dismissOnInnerButtonPress` option (default
    `true`). `DialogTrigger` passes `false` for modal/tray/fullscreen types
    so buttons inside those dialogs don't subscribe to the new dismiss
    event. The `popover:dismiss-ancestor` EventBus event carries the
    originating DOM element so each popover host can do a `container.contains()`
    check before closing.
  - `usePopoverSync` gained a `closeOnPeerOpen` option (default `true`).
    `DialogTrigger` passes `false` for modal/tray/fullscreen/panel types so
    a peer popover opening (e.g. via `useDialogContainer` or
    `useAnchoredMenu`) cannot bypass the dialog's `isDismissable` /
    `onClose` handling and call `state.close()` directly. The host still
    EMITS `popover:open`, so opening a modal correctly dismisses peer
    popovers — only the listener side is gated.
  - `DialogTrigger` now applies `data-popover-trigger` to its child press
    responder **only when `type === 'popover'`**. This is the critical
    correctness piece for the original bug — when a `DialogTrigger type="modal"`
    lives inside a `FilterPicker` footer, pressing its trigger now correctly
    dismisses the FilterPicker, and the modal takes over.
  - `EventBusProvider` is now a no-op when nested inside another
    `EventBusProvider`. The internal `Provider` from `provider.tsx` wraps
    overlay content with its own `EventBusProvider`, which used to silently
    shadow the global `<Root>` bus and prevent cross-overlay events from
    reaching the host.
  - `usePopoverSync`'s nested-popover guard now walks the **logical**
    popover chain via a module-level registry of open overlays, rather than
    relying solely on a direct `container.contains(triggerEl)` DOM check.
    Popover content is portaled to a shared overlay root, so a grandchild
    popover's trigger lives in a sibling portal — not inside its
    grandparent's DOM. Without the chain walk, opening a third+ level
    `SubMenuTrigger` (or any equivalent nested popover) closed every
    ancestor.

### Patch Changes

- [#1189](https://github.com/cube-js/cube-ui-kit/pull/1189) [`cb9c0635`](https://github.com/cube-js/cube-ui-kit/commit/cb9c0635e6b060e473b38faab7fdef2c4cdad496) Thanks [@solarrust](https://github.com/solarrust)! - `ListBox`: fix missing bottom spacing for the last item in `isReorderable` mode.

## 0.141.0

### Minor Changes

- [#1186](https://github.com/cube-js/cube-ui-kit/pull/1186) [`e0afa6be`](https://github.com/cube-js/cube-ui-kit/commit/e0afa6be9ae9a706329342980b3caf8271f7fbf8) Thanks [@tenphi](https://github.com/tenphi)! - **Tabs**: `Tab`'s `title` prop is now optional, enabling icon-only tabs via the `icon` / `rightIcon` slots. When `title` is omitted, supply an `aria-label` (and typically a `tooltip`) so the tab retains an accessible name. Added a `VerticalIconOnly` story demonstrating this with `placement="left"` and `tabListPadding="1x"`.

## 0.140.1

### Patch Changes

- [#1184](https://github.com/cube-js/cube-ui-kit/pull/1184) [`c44ee3bb`](https://github.com/cube-js/cube-ui-kit/commit/c44ee3bb075d7b9ebbe8105cd3c5d005e2505bf8) Thanks [@tenphi](https://github.com/tenphi)! - `Tabs`: when there are no panels (no `Tab` content, no `Tabs.Panel` children, no `renderPanel`), the outer wrapper no longer grows or shrinks within its parent flex container — it now locks to the tab bar's intrinsic size, matching the pre-wrapper behavior of a panel-less `<Tabs>`. With panels, the wrapper still participates in parent flex layouts as before.

## 0.140.0

### Minor Changes

- [#1181](https://github.com/cube-js/cube-ui-kit/pull/1181) [`1c2b901e`](https://github.com/cube-js/cube-ui-kit/commit/1c2b901e329c39b61f9d5dd9d1aba31d1a55912e) Thanks [@tenphi](https://github.com/tenphi)! - `Tabs`: add `placement` prop (`'top' | 'bottom' | 'left' | 'right'`, default `'top'`) for vertical and bottom tab strips. The selection indicator, scrolling, fade gradients, scroll arrows, drag-and-drop reorder visuals, `TabPicker` popover placement, and per-type visuals (radius, file-style shadow, dividers) all adapt automatically to the chosen axis.

  The root `<TabsElement>` is now a flex wrapper holding the tab bar and the panels; the tab bar is available as the new `Bar` sub-element (use the `barStyles` prop or `styles={{ Bar: { ... } }}` to target it). DOM order stays "bar then panels" — visual order is controlled internally with `flex-direction` / `*-reverse`.

  `FilterPicker`: add a `placement?: Placement` prop (default `'bottom start'`) forwarded to its `DialogTrigger`, so consumers can position the popover (used by `TabPicker` to render above / to the side of the strip based on the parent `Tabs` placement).

  Breaking notes:

  - `styles` prop on `Tabs` now targets the new outer flex wrapper. Use `barStyles` or the `Bar` sub-element selector to style the tab strip itself.
  - Fade modifiers and CSS custom properties were renamed for axis neutrality: `fade-left` / `fade-right` → `fade-start` / `fade-end`; `--tabs-fade-left-color` / `--tabs-fade-right-color` → `--tabs-fade-start-color` / `--tabs-fade-end-color`. No back-compat aliases.
  - The horizontal scrollbar sub-element `ScrollbarH` was renamed to the axis-neutral `Scrollbar` (it now drives the horizontal scrollbar for `top` / `bottom` placements and the vertical scrollbar for `left` / `right`).
  - `type="narrow"` is coerced to `type="default"` when `placement` is `'left'` or `'right'` — its denser horizontal padding has no meaning in a vertical strip. For `default` / `narrow` types laid out vertically, the gap between tabs collapses to `1bw` so the strip reads as a single column.
  - `tabListPadding` now controls all four sides of the tab list in vertical placements (`left` / `right`); horizontal placements still receive it only on the start/end edges as before. Default values: `1x` for horizontal `default` / `narrow`, `.5x` for vertical `default` / `narrow`.

### Patch Changes

- [#1182](https://github.com/cube-js/cube-ui-kit/pull/1182) [`9c2cd134`](https://github.com/cube-js/cube-ui-kit/commit/9c2cd134a7d71d254b9b6ac063dc459c52d70cd3) Thanks [@tenphi](https://github.com/tenphi)! - Fix clear button styling on `FilterPicker`, `Picker`, and `Select` so it inherits the trigger `type` and `theme` (including `special` and validation error state) instead of defaulting to neutral action colors.

## 0.139.0

### Minor Changes

- [#1179](https://github.com/cube-js/cube-ui-kit/pull/1179) [`658f0b94`](https://github.com/cube-js/cube-ui-kit/commit/658f0b947ab942ba69db64fbdc9991c695d28425) Thanks [@tenphi](https://github.com/tenphi)! - Added a new `outline-2` type. It mirrors `outline` but paints over `#surface-3` instead of `#surface-2`, so the component stays visually distinct when placed inside a `#surface-2` container. The matching theme constants (`DEFAULT_OUTLINE_2_STYLES`, `DANGER_OUTLINE_2_STYLES`, `SUCCESS_OUTLINE_2_STYLES`, `WARNING_OUTLINE_2_STYLES`, `NOTE_OUTLINE_2_STYLES`) are exported from `data/item-themes`. `outline-2` is wired into `Button`, `Item` (and every component that goes through `Item` — `ItemButton`, `ItemAction`, `ItemBadge`, `Select`, `FilterPicker`, `Picker`, `Menu`, etc.). The `special` theme intentionally has no `outline-2` variant (it paints over `#special-surface`); pairing `theme="special"` with `type="outline-2"` falls back to `outline`.

- [#1179](https://github.com/cube-js/cube-ui-kit/pull/1179) [`658f0b94`](https://github.com/cube-js/cube-ui-kit/commit/658f0b947ab942ba69db64fbdc9991c695d28425) Thanks [@tenphi](https://github.com/tenphi)! - **Breaking:** Removed the `neutral` and `secondary` values from the `type` prop on `Button`, `ButtonSplit`, `Item`, `ItemAction`, `ItemBadge`, and `ItemButton`, and from `buttonType` on `RadioGroup`. Their visuals are now expressed through the existing `clear` and `outline` types combined with `isSelected`:

  - `type="neutral"` → `type="clear"`
  - `type="clear"` (selected look) → `type="clear" isSelected`
  - `type="secondary"` → `type="outline" isSelected`

  Default `type` for `ItemAction`, `ItemBadge`, and `ItemButton` changed from `neutral` to `clear`. `ItemBadge` now accepts the full `'primary' | 'outline' | 'clear' | 'link'` union and supports `isSelected`.

- [#1179](https://github.com/cube-js/cube-ui-kit/pull/1179) [`658f0b94`](https://github.com/cube-js/cube-ui-kit/commit/658f0b947ab942ba69db64fbdc9991c695d28425) Thanks [@tenphi](https://github.com/tenphi)! - `RadioGroup` with `type="button"` now groups its buttons like `ButtonSplit`: zero gap, shared corner radius (only the first/last items keep their outer-side radius), overlapping borders, and the selected button is lifted via `z-index` so its brand-tinted border is visible from all four sides. Hover / focus-visible bump higher still so they always read on top.

  Outline-style selected borders no longer use the alpha-blended `#<theme>-text.15` (which doubled up at every overlap into a darker stripe) — they now use the new opaque `#<theme>-border` token. The token comes from the existing neutral `border` ramp re-resolved per colored theme at `saturation: 0.5`, giving each theme a subtly hue-tinted border with no extra palette bookkeeping. This affects `DEFAULT_OUTLINE_STYLES`, `DANGER_OUTLINE_STYLES`, `SUCCESS_OUTLINE_STYLES`, `WARNING_OUTLINE_STYLES`, and `NOTE_OUTLINE_STYLES`.

- [#1179](https://github.com/cube-js/cube-ui-kit/pull/1179) [`658f0b94`](https://github.com/cube-js/cube-ui-kit/commit/658f0b947ab942ba69db64fbdc9991c695d28425) Thanks [@tenphi](https://github.com/tenphi)! - **Breaking:** Renamed the special `icon` string from `'checkbox'` to `'checkmark'` on `Item`, `ItemAction`, and `ItemBadge` since the rendered glyph is a checkmark, not a checkbox. Replace `icon="checkbox"` with `icon="checkmark"`. The associated `checkbox` style modifier was renamed to `checkmark` accordingly.

### Patch Changes

- [#1179](https://github.com/cube-js/cube-ui-kit/pull/1179) [`658f0b94`](https://github.com/cube-js/cube-ui-kit/commit/658f0b947ab942ba69db64fbdc9991c695d28425) Thanks [@tenphi](https://github.com/tenphi)! - Fixed `special` theme `outline` and `clear` fills resolving to the wrong layer for `selected & hovered`, `selected & focused` and `selected & hovered & pressed` states. Two state entries within the same `fill` map shared the same `#white.X` value (`hovered` ↔ `disabled` for outline; `'hovered | focused'` ↔ `'selected & disabled'` for clear). Tasty's `mergeEntriesByValue` pass coalesced them into a single high-priority OR-condition entry that then negated against the lower-priority `'selected & (hovered | focused)'` rule, making it resolve to `FALSE` for selected-hover/focus. Each alpha step now uses a unique value string, restoring the intended monotonic-contrast progression. See `src/data/Claude.md` for the underlying pitfall.

- [#1179](https://github.com/cube-js/cube-ui-kit/pull/1179) [`658f0b94`](https://github.com/cube-js/cube-ui-kit/commit/658f0b947ab942ba69db64fbdc9991c695d28425) Thanks [@tenphi](https://github.com/tenphi)! - Fixed `ItemAction` and `ItemBadge` rendering without variant styles when nested inside an `Item` / `ItemButton` with `type="outline-2"`. `ItemActionContext` now collapses `'outline-2'` to `'clear'` for child actions, matching the existing behavior for `'outline'` / `'item'` / `'header'` / `'card'`.

- [#1179](https://github.com/cube-js/cube-ui-kit/pull/1179) [`658f0b94`](https://github.com/cube-js/cube-ui-kit/commit/658f0b947ab942ba69db64fbdc9991c695d28425) Thanks [@tenphi](https://github.com/tenphi)! - Internal: migrated every color reference in `src/data/item-themes.ts` to use Glaze palette tokens directly, removing all dependencies on the legacy alias layer in `src/tokens/colors.ts` (e.g. `#dark` → `#surface-text`, `#dark-02` → `#surface-text-soft`, `#primary-text` → `#primary-accent-text`, `#primary-hover` → `#primary-accent-surface-hover`, `#primary` brand fill → `#primary-accent-surface`, `#light` → `#surface-3`, `#clear` → `transparent`, and the matching `danger` / `success` / `warning` / `note` ramps). Resolved values are unchanged — every alias was a direct re-export of the same Glaze token — so component visuals are identical. The legacy aliases in `colors.ts` are still exported for backwards compatibility with consumer code.

- [#1179](https://github.com/cube-js/cube-ui-kit/pull/1179) [`658f0b94`](https://github.com/cube-js/cube-ui-kit/commit/658f0b947ab942ba69db64fbdc9991c695d28425) Thanks [@tenphi](https://github.com/tenphi)! - Unified the `primary`-type fill ramp across all themes. `DANGER`, `SUCCESS`, `WARNING`, `NOTE` and `SPECIAL` now follow the same monotonically-darkening `accent-surface` → `-2` → `-3` (default → hover → pressed) ramp already used by the default theme, so contrast against the app background increases consistently with each interaction step in both light and dark schemes. Previously the colored themes used a `default` → `-hover` → `default` shape (no press feedback) and the special theme used a separate `accent-fill` / `accent-fill-hover` / `accent-fill` ramp.

  The special theme palette was renamed for consistency: `accent-fill` → `accent-surface`, `accent-fill-text` → `accent-surface-text`, `accent-fill-hover` → `accent-surface-hover`, plus new `accent-surface-2` and `accent-surface-3` steps. The legacy `accent-surface-hover` token is retained for the `#primary-hover` / `#<theme>-hover` color aliases consumed by external code.

  **Breaking (special theme tokens only):** `#special-accent-fill`, `#special-accent-fill-text`, and `#special-accent-fill-hover` were renamed to `#special-accent-surface`, `#special-accent-surface-text`, and `#special-accent-surface-hover` respectively. External consumers referencing these by name should update their references.

- [#1179](https://github.com/cube-js/cube-ui-kit/pull/1179) [`658f0b94`](https://github.com/cube-js/cube-ui-kit/commit/658f0b947ab942ba69db64fbdc9991c695d28425) Thanks [@tenphi](https://github.com/tenphi)! - Fixed keyboard focus ring on `RadioGroup`:

  - Classic `RadioGroup` (default `type="radio"`) — removed the redundant per-item wrapper outline; the inner radio circle already shows a `focused`-mod ring, and the duplicate wrapper ring driven by `:focus-within` also fired on mouse clicks.
  - Button / Tabs `RadioGroup` (`type="button"` / `type="tabs"`) — added a keyboard-only focus ring on the group container itself (none was rendered before, since the per-item `Item` themes only swap the border color on focus). Implemented via React Aria's `useFocusRing({ within: true })` reading `isFocusVisible` (not `isFocused`), so mouse clicks don't trigger it.

- [#1179](https://github.com/cube-js/cube-ui-kit/pull/1179) [`658f0b94`](https://github.com/cube-js/cube-ui-kit/commit/658f0b947ab942ba69db64fbdc9991c695d28425) Thanks [@tenphi](https://github.com/tenphi)! - `RadioGroup` with `type="tabs"`: the selected tab no longer looks active when the group is disabled. The selected-tab override now dims fill (`#surface` → `#surface.6`) and text (`#dark` → `#dark.3`) and drops `$item-shadow` for the `tabs & selected & disabled` state.

- [#1179](https://github.com/cube-js/cube-ui-kit/pull/1179) [`658f0b94`](https://github.com/cube-js/cube-ui-kit/commit/658f0b947ab942ba69db64fbdc9991c695d28425) Thanks [@tenphi](https://github.com/tenphi)! - Fixed a brief surface-color flash that appeared when toggling `isSelected` on `outline` / `outline-2` buttons (most visible inside `RadioGroup type="button"`) and when toggling `isDisabled` on `primary` buttons (e.g. on form submit). The flash came from a CSS-transition layer-count mismatch: tasty's `fill` renders single-color values as `background-color` only and two-color values as `background-color` + `--tasty-second-fill-color` + `background-image: linear-gradient(...)`. When a state with two layers transitioned to a state with one (or vice-versa), the gradient overlay snapped on/off instantly while `background-color` interpolated, exposing the base layer mid-transition.

  Every `fill` state map in `src/data/item-themes.ts` now uses the same two-layer shape across non-selected, selected, and disabled states, with the same opaque base color (`#surface`, `#surface-2`, `#surface-3`, or `#special-surface` per variant). Only the overlay tint changes between states, so `background-color`, `--tasty-second-fill-color`, and `background-image` all interpolate smoothly. Visuals are essentially unchanged — the brand-tinted overlays now composite over the variant's own base instead of the body surface, producing a sub-1-OKHSL-point lightness shift that's imperceptible in side-by-side comparisons.

## 0.138.6

### Patch Changes

- [#1177](https://github.com/cube-js/cube-ui-kit/pull/1177) [`bf362325`](https://github.com/cube-js/cube-ui-kit/commit/bf3623250190e80c856a4a4aaf9eb914acf561e7) Thanks [@tenphi](https://github.com/tenphi)! - Use `#surface-2` instead of `#surface` as the base fill for outline item actions and buttons across default, danger, success, warning, and note themes.

  This gives outline controls a slightly elevated background on surface-level containers.

## 0.138.5

### Patch Changes

- [#1176](https://github.com/cube-js/cube-ui-kit/pull/1176) [`80a44921`](https://github.com/cube-js/cube-ui-kit/commit/80a449217e1b44350a50e05990ab1b0c3c7e524c) Thanks [@tenphi](https://github.com/tenphi)! - `Tabs`: keep the inline rename input mounted when triggered from the tab menu. Previously the Menu popover's `<FocusScope restoreFocus>` would yank focus back to the trigger as soon as the menu started closing, fire `InlineInput`'s `submitOnBlur`, and unmount the input the user just opened — so clicking "Rename" appeared to do nothing.

  `InlineInput` now ignores blurs that happen within ~500ms of a programmatic `startEditing()` call (cleared on the first user keystroke). `TabButton` also retries focusing the input across the menu's exit transition as a belt-and-suspenders defense.

- [#1174](https://github.com/cube-js/cube-ui-kit/pull/1174) [`6aa0a511`](https://github.com/cube-js/cube-ui-kit/commit/6aa0a511f37131d26b38c702603c13c264e9d7b0) Thanks [@tenphi](https://github.com/tenphi)! - Add a new `#surface-4` neutral token and use it as the container background for radio-style tabs.

  This updates both `Tabs` and `RadioGroup` tabs mode to the new surface depth and registers the token in type and editor token metadata.

## 0.138.4

### Patch Changes

- [#1171](https://github.com/cube-js/cube-ui-kit/pull/1171) [`5a28ef76`](https://github.com/cube-js/cube-ui-kit/commit/5a28ef76505638619c212e930dc65beb335de2e0) Thanks [@tenphi](https://github.com/tenphi)! - Fix high-contrast scheme rendering of disabled brand-tinted chips on PRIMARY-style buttons. The `#<theme>-accent-disabled-surface` tokens (`primary`, `success`, `danger`, `warning`, `note`, `special`) had an inverted contrast pair (`[1.4, 1.3]` — first value > second), which made the chip slightly _less_ contrasty in high-contrast mode than in regular mode — opposite to the HC scheme's intent and inconsistent with every other contrast pair in `palette.ts`. Corrected to `[1.4, 1.5]`. Light and dark modes are unchanged; only the high-contrast scheme bumps from cr ≈ 1.3 to cr ≈ 1.5 against `#surface`.

- [#1171](https://github.com/cube-js/cube-ui-kit/pull/1171) [`5a28ef76`](https://github.com/cube-js/cube-ui-kit/commit/5a28ef76505638619c212e930dc65beb335de2e0) Thanks [@tenphi](https://github.com/tenphi)! - **Special theme**: `special`-variant components (`Button`, `ItemAction`, `ItemButton`, etc.) now render consistently across light, dark, and high-contrast schemes. Previously, dark mode inverted the brand-purple pressed/focused border (`#purple-text`, `mode: 'auto'`) and the PRIMARY disabled chip (`#primary-disabled`, scheme-adaptive neutral) — both visibly different from the light-mode design.

  The fix is a new standalone `specialTheme` in `src/tokens/palette.ts` (not extended from `defaultTheme`) whose tokens are all `mode: 'fixed'`, so the resolved OKHSL is identical in every scheme. It emits `#special-surface`, `#special-accent-fill`, `#special-accent-fill-hover`, `#special-accent-fill-text`, `#special-accent-text`, `#special-accent-disabled-surface`, and `#special-accent-disabled-surface-text`. The PRIMARY disabled state now uses a brand-tinted chip (`#special-accent-disabled-surface`) instead of a neutral grey, and OUTLINE's disabled fill no longer mirrors the `pressed` state. The legacy `#fixed-dark` and `#fixed-primary-text` aliases keep working — they now resolve to `#special-surface` and `#special-accent-text` respectively. Validation borders (`#danger-text` / `#success-text`) intentionally stay scheme-adaptive.

## 0.138.3

### Patch Changes

- [#1169](https://github.com/cube-js/cube-ui-kit/pull/1169) [`5434b4ef`](https://github.com/cube-js/cube-ui-kit/commit/5434b4ef8c16ed40e5fe4810e2f2ccfecb4bea3e) Thanks [@tenphi](https://github.com/tenphi)! - **Menu sub-menus**: a single outside click now closes the entire menu hierarchy. Previously, with one or more nested `Menu.SubMenuTrigger`s open, only the deepest sub-menu closed on the first outside click — the parent menu and intermediate sub-menus stayed open until additional clicks. React Aria's `useOverlay` invokes `onClose` only for the topmost overlay in its `visibleOverlays` stack, so the fix lives in `SubMenuTrigger`: the nested `Popover` now receives a `shouldCloseOnInteractOutside` predicate (mirroring `MenuTrigger`'s) that schedules the parent's `onClose` via `setTimeout(0)`. The existing `parentContext.isClosing` cascade then collapses every level. `usePopoverSync`'s peer-coordination semantics (closing siblings when one popover opens) are unchanged. Existing close paths — Escape, `DismissButton`, item selection — are untouched and continue to behave as before.

## 0.138.2

### Patch Changes

- [`3ae5eb54`](https://github.com/cube-js/cube-ui-kit/commit/3ae5eb54e53b45f49082316175efb6b4141688a0) Thanks [@tenphi](https://github.com/tenphi)! - Replace native HTML elements (`div`, `span`, `p`, `h1`–`h6`, `ul`/`li`, `strong`, `b`, `em`, `code`, `kbd`, `input`, `button`, `a`) with UI Kit components and replace hardcoded colors/pixel values with design tokens and Tasty units across all Storybook stories.

## 0.138.1

### Patch Changes

- [#1165](https://github.com/cube-js/cube-ui-kit/pull/1165) [`f1bfd1f7`](https://github.com/cube-js/cube-ui-kit/commit/f1bfd1f7a6b08862e4a6d0acd001800f7e8ba897) Thanks [@tenphi](https://github.com/tenphi)! - `ListBox`: fix checkbox colors in `isCheckable` mode so the unchecked background adapts to dark mode and the selected state uses the proper accent surface color, matching `Checkbox`.

## 0.138.0

### Minor Changes

- [#1145](https://github.com/cube-js/cube-ui-kit/pull/1145) [`20424549`](https://github.com/cube-js/cube-ui-kit/commit/204245492f151d254e109665d16ecb783a33f3cd) Thanks [@tenphi](https://github.com/tenphi)! - **Color system**: migrate to `@tenphi/glaze` and add built-in dark + high-contrast schemes.

  The color palette is now generated by [Glaze](https://github.com/tenphi/glaze) (OKHSL-based, contrast-aware) and emits three variants per token — light, dark, and high-contrast — wired through tasty's state aliases (`@dark`, `@hc`). Schemes activate from `data-schema="dark" | "light"` and `data-contrast="more" | "less"` on `<html>`, with `prefers-color-scheme` / `prefers-contrast` media-query fallbacks, so apps that opt in get adaptive theming with no per-component changes.

  - **New surface tokens**: `#surface`, `#surface-2`, `#surface-3` for backgrounds; `#surface-text`, `#surface-text-soft`, `#surface-text-soft-2`, `#surface-2-text`, `#surface-2-text-soft`, `#surface-3-text`, `#surface-3-text-soft` for text. The darkest text tokens are anchored at the bottom of Glaze's lightness window so they match the legacy `#dark` (OKHSL L≈12) in light mode and invert cleanly in dark/HC.
  - **New per-theme accent tokens**: `#primary-accent-surface`, `#primary-accent-text`, `#primary-accent-text-soft`, `#primary-accent-icon`, `#primary-accent-surface-hover`, `#primary-accent-surface-2/3`, plus matching `success-*` / `danger-*` / `warning-*` / `note-*` (and `purple-*` as a primary alias). Used by buttons, banners, tags, etc. The `*-text-soft` variants (`#primary-text-soft`, `#danger-text-soft`, …) are adaptive (mode auto) at AA-floor contrast (cr 4.5/7) — the right anchor for a less-prominent foreground that still meets AA in BOTH light and dark schemes (used as the LINK base color, with `*-text` taking over on hover).
  - **Other new tokens**: `#border`, `#focus`, `#placeholder`, `#disabled`, `#disabled-surface`, `#disabled-surface-text`, `#overlay`, `#shadow-sm` / `#shadow-md` / `#shadow-lg`, and `#surface-inverse` (fixed-mode "always dark" surface for tooltips and other elements that intentionally don't invert). `#disabled-surface` and `#disabled-surface-text` are adaptive contrast-driven tokens (cr ≈ 1.4 / 2.0 vs `#surface`) so the disabled state has perceptually identical "washed-out" look in light, dark, and HC schemes — replacing legacy `#dark.04` / `#dark-04` / `#white.6` patterns that became too contrasty in dark mode.
  - **PrismCode theme**: a new `#code-*` palette (`code-comment`, `code-punctuation`, `code-keyword`, `code-string`, `code-number`, `code-function`, `code-attribute`) with WCAG AA contrast against `#surface` in every scheme; diff insertion / deletion reuse `#success-*` / `#danger-*`.
  - **Backward compatibility**: every legacy color token (`#dark`, `#dark-01`…`#dark-05`, `#text`, `#minor`, `#shadow`, `#light`, `#dark-bg`, `#primary`, `#primary-text`, `#primary-bg`, `#primary-icon`, `#primary-hover`, `#primary-desaturated`, `#primary-disabled`, `#purple-01`…`#purple-04`, the full `#danger-*` / `#success-*` / `#warning-*` / `#note-*` families, `#disabled-surface-text`, `#disabled-surface`, `#focus`, `#pink`, `#clear`) keeps working and now adapts to dark/HC for free via the underlying Glaze tokens.
  - **Removed**: `#white` and `#black` as explicit token definitions — they are tasty built-ins and resolve automatically. The Storybook _Playground_ story was removed (use the dedicated playground).
  - **Storybook helpers**: `withDarkScheme()` and `withHighContrast()` decorators in `src/stories/decorators/withColorScheme.tsx` for previewing components in alternate schemes.
  - **Dependencies**: adds `@tenphi/glaze`; updates `@tenphi/tasty` to a build that emits `data-schema` / `data-contrast` predefined states; updates Storybook to `10.3.6`.

  Existing apps and components keep rendering identically in light mode (legacy aliases preserve current colors). To opt into dark mode, set `<html data-schema="dark">` (or rely on the user's system preference). Apps using hardcoded `#white` as a "page background" should switch to `#surface` so the body adapts with the scheme.

## 0.137.1

### Patch Changes

- [#1160](https://github.com/cube-js/cube-ui-kit/pull/1160) [`17d67406`](https://github.com/cube-js/cube-ui-kit/commit/17d67406ae519bba3dfee38cb5db42f77bf84f72) Thanks [@tenphi](https://github.com/tenphi)! - **InlineInput**: improved keyboard accessibility and stability.

  - New prop `keyboardActivation?: boolean` (default `true`). When enabled, the display element is keyboard-focusable (`tabIndex=0`, `role="button"`, `aria-roledescription="editable text"`) and responds to `Enter`, `F2`, and `Space` to enter edit mode. Hosts that already own keyboard activation (e.g. editable tabs whose `<button>` listens for `F2`) can pass `keyboardActivation={false}` to avoid creating a nested tab stop.
  - A keyboard focus ring (`#primary` token, rounded) appears on the display element when it receives keyboard focus (`useFocusRing`'s `isFocusVisible`). It is suppressed automatically while editing (focus is on the inner input) and when `keyboardActivation={false}` (so the host's focus ring is the one users see — as in `Tabs`). New `focused` modifier exposed on the root for consumers.
  - The display element now mirrors `isDisabled` / `isReadOnly` via `aria-disabled` / `aria-readonly`, and `aria-label` / `aria-labelledby` are forwarded to it when focusable.
  - Pointer activators (`onClick` / `onDoubleClick`) are now wired only when the chosen `editTrigger` actually needs them, instead of being always-on no-ops.
  - Internal fixes: `stopEditing()` reads the synchronous `isEditingRef` instead of a potentially stale render closure, and the ref mirror is updated via `useLayoutEffect` so torn-away concurrent renders cannot leak a stale value across commits.

  **Tabs**: editable tabs continue to be driven by `F2` / context-menu rename at the tab-button level; `InlineInput` now receives `keyboardActivation={false}` from `TabButton` so the inline title does not introduce an extra tab stop or a duplicate focus ring inside the tab.

  **Layout fix**: the InlineInput root is now `inline-flex` (with `align-items: baseline`) instead of `inline-block`, and the truncation moved to a new inner `Display` sub-element. CSS 2.1 §10.8.1 forces an `inline-block` with `overflow: hidden` to use its bottom margin edge as the baseline, which visibly shifted text upward inside surrounding line boxes (most noticeable inside Tabs' centered `Item.Label`). `inline-flex` derives its baseline from the first flex item's content baseline, restoring proper alignment with neighbouring text. Truncation, ellipsis, and the overflow auto-tooltip continue to work; only the host responsibility for clipping moves to the inner block, which doesn't perturb the parent baseline.

- [#1160](https://github.com/cube-js/cube-ui-kit/pull/1160) [`17d67406`](https://github.com/cube-js/cube-ui-kit/commit/17d67406ae519bba3dfee38cb5db42f77bf84f72) Thanks [@tenphi](https://github.com/tenphi)! - **InlineInput / Tabs**: truncate long values with an ellipsis and surface a tooltip with the full value when truncated.

  - **`InlineInput`** now renders as `display: inline-block` with `text-overflow: ellipsis` / `white-space: nowrap` / `overflow: hidden` capped at `max-width: 100%` in display mode. The truncation rules are relaxed while editing (`overflow: visible`, `white-space: normal`) so the auto-sizing input is never visually clipped.
  - New props `tooltip?: AutoTooltipValue` (default `true`) and `tooltipPlacement?: OverlayProps['placement']` (default `'top'`). `tooltip={true}` shows the full value as a tooltip when the text is truncated; `tooltip="..."` always shows a custom tooltip; `tooltip={false}` opts out. The tooltip is automatically suppressed while editing and when `renderDisplay` is used.
  - **`Tabs`**: editable tabs now route `<Tab tooltip>` through `InlineInput` (single tooltip owner) — `Item`'s own tooltip is disabled for editable tabs to avoid double-wrapping. Long editable tab titles now also truncate with an ellipsis and reveal the full title on hover/focus, with no extra configuration. Non-editable tabs are unchanged.

## 0.137.0

### Minor Changes

- [#1158](https://github.com/cube-js/cube-ui-kit/pull/1158) [`8088e59c`](https://github.com/cube-js/cube-ui-kit/commit/8088e59cb08bada245dc4273717badbb2febb015) Thanks [@tenphi](https://github.com/tenphi)! - **InlineInput**: new top-level component for inline-editable text, plus internal refactor of `Tabs` to use it.

  - `InlineInput` is a reusable inline-editing primitive. It inherits typography/color from its parent so it drops into headings, paragraphs, tab titles, table cells, etc. without style customization. Value and `isEditing` can each be controlled or uncontrolled.
  - Activation modes via `editTrigger`: `'dblclick'` (default), `'click'`, or `'none'` (programmatic only). The imperative ref exposes `startEditing()`, `stopEditing(submit?)`, `focus()`, and `getValue()` and works regardless of `editTrigger`.
  - Deterministic focus flow: focus is taken via `FocusScope autoFocus restoreFocus={false}`, blur is detected via `useFocusWithin` (not a manual `onBlur` + RAF guard). Tests / Playwright can drive `dblclick → type → blur` without waiting on frames.
  - Optimistic display: when controlled and the parent updates `value` asynchronously, the just-committed value is shown immediately to avoid flicker.
  - Async save with auto-rollback: `onSubmit` may return a `Promise`. On rejection the component reverts its optimistic value back to the actual `value` prop. A token guard prevents stale rejections from clobbering newer commits.

  `Tabs` now uses `InlineInput` internally for editable tab titles (no behaviour change for consumers — F2, double-click, "rename" menu, blur-to-submit, escape-to-cancel all work as before). The internal `EditableTitle` component and its `chainRaf` / multi-RAF focus dance are gone, which removes the race conditions that previously made the editing flow hard to drive deterministically.

## 0.136.1

### Patch Changes

- [#1156](https://github.com/cube-js/cube-ui-kit/pull/1156) [`0af1eff8`](https://github.com/cube-js/cube-ui-kit/commit/0af1eff8c6e88f75a965552ce1815d87be856eaf) Thanks [@tenphi](https://github.com/tenphi)! - Fix focus management for popover-based components (`Menu`, `Select`, `FilterPicker`, `Picker`) opening inside a contained `Dialog`.

  Previously, when a popover-based component opened inside an outer popover/modal `Dialog` (whose `FocusScope` contains focus), focus would land on the popover `<section>` itself or stay on the trigger button instead of moving to the appropriate element inside the popover (search input, first option, first menu item).

  Three independent fixes:

  - **`Dialog`** — now re-promotes focus to a priority element (`input[data-autofocus]`, `button[type="submit"]`, `button[data-type="primary"]`) when the dialog `<section>` itself is the active element. This recovers from a race between React's native `autoFocus` (mutation phase) and react-aria's focus-scope tree registration (layout phase). Fixes `FilterPicker`/`Picker` search inputs.
  - **`Menu` (`MenuTrigger`)** — its popover content is now wrapped in a `<FocusScope restoreFocus>` so the menu items register as a child scope of any outer contained `FocusScope`. Without this, the outer scope rejects focus moving into the menu items (in a portal, with no registered child scope) and yanks focus back to the menu trigger.
  - **`Select`** — its inner `<FocusScope>` now also has `autoFocus`. Select's listbox subtree is mounted unconditionally, so react-aria's `useSelectableCollection` autoFocus is consumed once on mount when the listbox isn't yet in the DOM. The `FocusScope` `autoFocus` runs each time the popover opens (the inner tree unmounts between opens) and explicitly focuses the listbox. The listbox `<ul>` also gets `outline: 0` so it never displays the browser's native focus ring (only the focused option does).

- [#1155](https://github.com/cube-js/cube-ui-kit/pull/1155) [`22041efb`](https://github.com/cube-js/cube-ui-kit/commit/22041efbd310b5cc2996cd549c75b37e746c72b6) Thanks [@solarrust](https://github.com/solarrust)! - ListBox: show drag handle on hover when item has a custom icon; remove danger theme from TabPicker close action

## 0.136.0

### Minor Changes

- [#1150](https://github.com/cube-js/cube-ui-kit/pull/1150) [`ad7624bb`](https://github.com/cube-js/cube-ui-kit/commit/ad7624bbf203e5bff36dbbf78e1dcbcd57cd0fae) Thanks [@tenphi](https://github.com/tenphi)! - **Menu / Tray**: gate mobile tray rendering behind a `mobileType` opt-in and let `Tray` accept `shouldCloseOnInteractOutside`.

  - `Tray` now accepts a `shouldCloseOnInteractOutside?: (element: Element) => boolean` prop and forwards it to React Aria's `useOverlay`. Without it, the underlying `useOverlay` unconditionally calls `stopPropagation` / `preventDefault` on outside pointer/click events whenever the tray is the topmost overlay, which can swallow clicks on sibling triggers (e.g. a second `MenuTrigger`). The new prop matches the existing API on `Popover`.
  - `MenuTrigger` no longer auto-swaps its `Popover` for a `Tray` on mobile screens. The previous behaviour relied on `useIsMobileDevice()` (which returns `true` in jsdom-style environments where `window.screen.width` is `0`), so the mobile branch could activate unintentionally. Opt in explicitly with `mobileType="tray"` (defaults to `'popover'`), mirroring the established `mobileType` API on `DialogTrigger`.
  - `MenuTrigger` now passes the same `shouldCloseOnInteractOutside` callback to both the `Popover` and `Tray` branches, so sibling-trigger clicks aren't swallowed in either overlay variant.

  This is a behavioural change for apps that intentionally relied on the implicit mobile tray. To restore the previous look, pass `mobileType="tray"` to the relevant `MenuTrigger`s.

### Patch Changes

- [#1150](https://github.com/cube-js/cube-ui-kit/pull/1150) [`ad7624bb`](https://github.com/cube-js/cube-ui-kit/commit/ad7624bbf203e5bff36dbbf78e1dcbcd57cd0fae) Thanks [@tenphi](https://github.com/tenphi)! - **Popover dismiss for plain Button / ItemButton**: a single click on a `Button` or `ItemButton` rendered outside an open popover now closes the popover AND fires the button's `onPress` in the same click. Previously the first click was always swallowed by `useOverlay`'s `shouldCloseOnInteractOutside` (which `stopPropagation`s outside clicks), so users had to click twice.

  - `Button` and `ItemButton` now mark their root with `data-popover-dismiss`.
  - `MenuTrigger`, `Select`, `ComboBox`, `FilterPicker`, and `Picker` recognize `[data-popover-dismiss]` outside-click targets and schedule their close via `setTimeout(0)` so the close lands AFTER the click event finishes (i.e. after the button's `onPress` runs). The predicate returns `false` so the click is not stopped.

  `Button`/`ItemButton` used as a popover trigger (wrapped by `PressResponder`/`MenuTrigger`) keep their existing trigger behaviour — the trigger branch matches first, the dismiss branch is never reached.

## 0.135.1

### Patch Changes

- [`a7917a28`](https://github.com/cube-js/cube-ui-kit/commit/a7917a28c44e9932ebf483fe38132dc5b7f25bef) Thanks [@tenphi](https://github.com/tenphi)! - Simplified the `input-autofill` recipe's `@autofill` alias to `:-webkit-autofill | :autofill`. Coverage is unchanged in practice (the dropped Chromium-internal pseudo-classes were redundant on top of `:-webkit-autofill`), and the resulting selector list avoids the `:is()` wrapper, fixing rendering in environments where `:is()` interacted poorly with the autofill rule.

## 0.135.0

### Minor Changes

- [#1148](https://github.com/cube-js/cube-ui-kit/pull/1148) [`ce0c49e4`](https://github.com/cube-js/cube-ui-kit/commit/ce0c49e41eed505c333fce737b8c6fe07a6a8718) Thanks [@tenphi](https://github.com/tenphi)! - `Layout.Center` now accepts an `isGoldenRatio` prop. When enabled, the content is positioned slightly above the geometric center using the golden ratio (~38.2% empty space above, ~61.8% below) for a more aesthetically pleasing placement. The behavior only applies while the content fits inside the container; otherwise default centering and scrolling are preserved.

### Patch Changes

- [#1149](https://github.com/cube-js/cube-ui-kit/pull/1149) [`e5f47ee8`](https://github.com/cube-js/cube-ui-kit/commit/e5f47ee87dbbb8d96707d1ba1e86332e972893f6) Thanks [@tenphi](https://github.com/tenphi)! - `TextInput` and other inputs that consume the `input-autofill` recipe now correctly suppress Chrome's autofill background and `appearance: menulist-button` when a suggestion is selected or previewed. The `@autofill` alias was extended (via `:is()` so unsupported pseudo-classes are gracefully ignored in Firefox / Safari instead of invalidating the whole rule) to cover `:autofill`, `:-internal-autofill-selected`, and `:-internal-autofill-previewed` in addition to `:-webkit-autofill`, and the inset background now uses the `#surface` token instead of a hard-coded white.

- [#1148](https://github.com/cube-js/cube-ui-kit/pull/1148) [`ce0c49e4`](https://github.com/cube-js/cube-ui-kit/commit/ce0c49e41eed505c333fce737b8c6fe07a6a8718) Thanks [@tenphi](https://github.com/tenphi)! - `Result` now sets a default `width: max 80ch` and centers itself horizontally (`margin: 0 auto`) in non-compact mode, capping the component at a comfortable reading width (~80 characters) on wide screens. Pass a `width` or `margin` prop to override.

- [#1146](https://github.com/cube-js/cube-ui-kit/pull/1146) [`ee4eeb13`](https://github.com/cube-js/cube-ui-kit/commit/ee4eeb1309d132ca9c32f77ca05c426a58fc6a01) Thanks [@tenphi](https://github.com/tenphi)! - `Result` now applies `text-wrap: balance` to the title and subtitle so multi-line headings break into more even-length lines.

- [#1148](https://github.com/cube-js/cube-ui-kit/pull/1148) [`ce0c49e4`](https://github.com/cube-js/cube-ui-kit/commit/ce0c49e41eed505c333fce737b8c6fe07a6a8718) Thanks [@tenphi](https://github.com/tenphi)! - Sub-element pseudo selectors now use Tasty’s `&::…` form (e.g. placeholders, track fill `::before`) so styles resolve reliably on `TextInput`, `CommandMenu` search input, and `Slider`.

## 0.134.0

### Minor Changes

- [#1143](https://github.com/cube-js/cube-ui-kit/pull/1143) [`1838eeeb`](https://github.com/cube-js/cube-ui-kit/commit/1838eeeb73b31579ace649b807e66cd3ee466667) Thanks [@tenphi](https://github.com/tenphi)! - `Tree` now drives all "scroll into view" through the internal virtualizer instead of `querySelector` + `scrollIntoView`. Two changes:

  - **Fix:** keyboard navigation now keeps the focused row visible even when the target lies outside the virtualizer's current overscan window. Previously the row's DOM node was queried before it was mounted, so `scrollIntoView` silently no-oped and the focus indicator could leave the viewport.
  - **New behavior:** a controlled `selectedKeys` change scrolls the first selected key into view. This lets parent components (e.g. file-tree consumers opening a file from outside the tree) bring the row into view without owning virtualizer math themselves. The effect retries once parents are expanded, so off-screen targets land correctly even when expansion is staged in a separate render.

## 0.133.0

### Minor Changes

- [#1140](https://github.com/cube-js/cube-ui-kit/pull/1140) [`af1736db`](https://github.com/cube-js/cube-ui-kit/commit/af1736db1e0b6de77e77a0c25deefabe4c7e6d51) Thanks [@solarrust](https://github.com/solarrust)! - **Tabs**: reorderable tab picker — when `isReorderable` is enabled and a tab picker is shown, items in the picker dropdown can be reordered via drag-and-drop or `Alt+Arrow` keyboard shortcuts.

- [#1142](https://github.com/cube-js/cube-ui-kit/pull/1142) [`fe05e4cd`](https://github.com/cube-js/cube-ui-kit/commit/fe05e4cdf5f49843427191018c57c3e8dbe41d06) Thanks [@tenphi](https://github.com/tenphi)! - **Tree**: revert `expandOnFolderClick`. Its row-level `stopPropagation()` on pointer/mouse events prevented document-level listeners from receiving them — most visibly, `Layout.Panel`'s resize (via React Aria's `useMove`) latched when the cursor released over a folder row in a `Tree` rendered inside a resizable panel. The default `treegrid` behavior (chevron expands, row activates selection) is unchanged.

### Patch Changes

- [#1142](https://github.com/cube-js/cube-ui-kit/pull/1142) [`fe05e4cd`](https://github.com/cube-js/cube-ui-kit/commit/fe05e4cdf5f49843427191018c57c3e8dbe41d06) Thanks [@tenphi](https://github.com/tenphi)! - **Tree**: fix virtualized scroll container growing past its fixed height. The previous structure made the outer `TreeElement` both a `display: flex` layout container and the `overflow: auto` scroll element, so the virtualizer's sizer (a flex child with `height: totalSize`) was squashed by `flex-shrink: 1` and the scroll area visibly grew as `@tanstack/react-virtual` re-measured rows during scroll. Scrolling now happens inside a dedicated block-level inner container, so the sizer's height is honored and the scroll viewport stays stable.

  The forwarded `ref` now points at this inner scroll container so consumers can read/write `scrollTop` directly. The `role="treegrid"` element (used internally by `useTree`) is its parent.

## 0.132.0

### Minor Changes

- [#1138](https://github.com/cube-js/cube-ui-kit/pull/1138) [`61b2eb40`](https://github.com/cube-js/cube-ui-kit/commit/61b2eb4004324756b4bbb49f6808d4ad6c04b5d2) Thanks [@tenphi](https://github.com/tenphi)! - Add `expandOnFolderClick` prop to `Tree`. When enabled, activating a non-leaf row toggles its expansion instead of triggering selection — useful for file-tree UX where only leaves are meaningful selection targets. Leaves still select normally; the chevron toggle, keyboard navigation, and right-click context menu continue to work independently.

  Activation rules:

  - Mouse click on a folder row → expand / collapse.
  - `Enter` on a folder row → expand / collapse (always, including in `isCheckable` trees, where it does NOT toggle the checkbox).
  - `Space` on a folder row → expand / collapse in non-checkable trees; in `isCheckable` trees `Space` is reserved for toggling the row's checkbox.

  Clicks that originate inside an interactive descendant of a folder row (chevron, checkbox, overflow `⋮` trigger, user-supplied buttons / links / inputs in the `prefix` and `actions` slots) no longer bubble up to the row's expand-on-click handler, so the chevron does not visibly double-toggle and inner controls do not have the side effect of expanding / collapsing the row.

- [#1138](https://github.com/cube-js/cube-ui-kit/pull/1138) [`61b2eb40`](https://github.com/cube-js/cube-ui-kit/commit/61b2eb4004324756b4bbb49f6808d4ad6c04b5d2) Thanks [@tenphi](https://github.com/tenphi)! - Add `menu`, `contextMenu`, `onAction`, `menuTriggerProps`, and `menuProps` to `Tree`. The new props mirror the `Tabs` API: `contextMenu={true}` renders a built-in `⋮` overflow trigger AND opens the same menu on right-click / Shift+F10; `'context-only'` keeps the right-click menu but hides the overflow trigger. Per-node overrides (`data.menu`, `data.contextMenu`, `data.onAction`) take precedence over tree-level defaults. An `onAction` supplied via `menuProps` is chained with the tree-level / per-node `onAction` callbacks so consumer-supplied handlers also fire.

  While re-wiring the row's `onKeyDown` for the menu / `expandOnFolderClick` shortcuts, the chained behavior of `Space` in `isCheckable` trees was preserved: pressing `Space` on a focused row toggles the row's checkbox AND continues to fire the tree's selection logic (matching the previous `mergeProps`-based chaining), so existing consumers see no change.

## 0.131.0

### Minor Changes

- [#1136](https://github.com/cube-js/cube-ui-kit/pull/1136) [`ed5887be`](https://github.com/cube-js/cube-ui-kit/commit/ed5887bee8b6435ed8699ccb194e8862e3ca630b) Thanks [@tenphi](https://github.com/tenphi)! - Added `shape` prop to `Tree` with `default` and `card` values for controlling border and radius. Added `containerPadding` prop for adjustable padding around the tree content via virtualizer configuration.

## 0.130.0

### Minor Changes

- [#1131](https://github.com/cube-js/cube-ui-kit/pull/1131) [`993fde86`](https://github.com/cube-js/cube-ui-kit/commit/993fde86bb6ce4f1022140bc3731a589efada1fd) Thanks [@tenphi](https://github.com/tenphi)! - Add `itemProps` prop to Tree for per-node customization of Item slots (prefix, actions, suffix, etc.) with access to node state (expanded, selected, checked)

- [#1131](https://github.com/cube-js/cube-ui-kit/pull/1131) [`993fde86`](https://github.com/cube-js/cube-ui-kit/commit/993fde86bb6ce4f1022140bc3731a589efada1fd) Thanks [@tenphi](https://github.com/tenphi)! - Add `size` prop to Tree (`'xsmall' | 'small' | 'medium' | 'large' | 'xlarge'`). Default row size changed from `small` to `medium`.

- [#1131](https://github.com/cube-js/cube-ui-kit/pull/1131) [`993fde86`](https://github.com/cube-js/cube-ui-kit/commit/993fde86bb6ce4f1022140bc3731a589efada1fd) Thanks [@tenphi](https://github.com/tenphi)! - Add virtualization to the Tree component using `@tanstack/react-virtual` for efficient rendering of large trees

### Patch Changes

- [#1134](https://github.com/cube-js/cube-ui-kit/pull/1134) [`e9857f51`](https://github.com/cube-js/cube-ui-kit/commit/e9857f51ff2729565f86d8afe577ac8715c98366) Thanks [@tenphi](https://github.com/tenphi)! - Fix `Button` disabled state resolution in `Button.Split` context.

  - Replace `??` chain with `||` so that `isLoading={false}` no longer blocks `splitContext.isDisabled` inheritance
  - Ensure `splitContext.isDisabled` always wins over child props (a disabled split button should disable all children)
  - Fix edge case where `isDisabled={false}` with `isLoading={true}` incorrectly resulted in a clickable loading button

- [#1130](https://github.com/cube-js/cube-ui-kit/pull/1130) [`15badca8`](https://github.com/cube-js/cube-ui-kit/commit/15badca848185c2e6a3b0808152f452dd06dd8eb) Thanks [@tenphi](https://github.com/tenphi)! - Fix popover positioning and premature closing in ComboBox, FilterPicker, and Picker.

  - Replace `react-transition-group` with `DisplayTransition` in the overlay system
  - Fix timing bug where overlay element didn't exist when `useOverlayPosition` ran, causing a flash at wrong position
  - Remove manual `updatePosition` workarounds (`chainRaf`) that were unreliable race-condition fixes
  - Remove `shouldUpdatePosition` timer hack from FilterPicker and Picker
  - Remove `react-transition-group` dependency

- [#1133](https://github.com/cube-js/cube-ui-kit/pull/1133) [`6b660836`](https://github.com/cube-js/cube-ui-kit/commit/6b660836271e8b6440f02911ce7f5145695e8f39) Thanks [@tenphi](https://github.com/tenphi)! - Fix `selectedKeys` in `Tab.menuProps` not working without manual `.# @cube-dev/ui-kit prefix

## 0.129.0

### Minor Changes

- [#1127](https://github.com/cube-js/cube-ui-kit/pull/1127) [`4742b843`](https://github.com/cube-js/cube-ui-kit/commit/4742b843cd4fb15704bcabef85717e7ecedd5852) Thanks [@tenphi](https://github.com/tenphi)! - Add `Tree` component — a hierarchical tree view built on React Aria/Stately with an Ant Design–compatible API for easy migration.

  - `treeData` accepts nested `{ key, title, children, isLeaf, isCheckable, isCheckboxDisabled }` nodes
  - Optional checkbox column via `isCheckable` with cascading parent/child state and `halfChecked` keys in `onCheck` payload
  - Controlled / uncontrolled `checkedKeys`, `expandedKeys`, and `selectedKeys` (single or multiple `selectionMode`)
  - Async `loadData` with per-row loading indicator; auto-expands lazy nodes after load
  - Per-node and per-tree `isDisabled`, `autoExpandParent`, custom `title` ReactNode
  - `rowStyles` prop forwarded to each row's underlying `Item` for visual customization

### Patch Changes

- [#1129](https://github.com/cube-js/cube-ui-kit/pull/1129) [`6e74d310`](https://github.com/cube-js/cube-ui-kit/commit/6e74d310899a03b5f9c3a4be941380300a1865bc) Thanks [@tenphi](https://github.com/tenphi)! - FilterPicker: Clear search value when the popover closes

- [#1127](https://github.com/cube-js/cube-ui-kit/pull/1127) [`4742b843`](https://github.com/cube-js/cube-ui-kit/commit/4742b843cd4fb15704bcabef85717e7ecedd5852) Thanks [@tenphi](https://github.com/tenphi)! - Update `@tenphi/tasty` to `2.1.1`.

  - Fix `$: '> SubElementName'` selector affix when the trailing element name matches the sub-element key (avoids duplicate key injection; placeholder behavior is correct).

  Migrated: `TreeNode` uses `@ts-expect-error` for `Checkbox` `onChange` (react-types / `AriaCheckboxProps`).

## 0.128.0

### Minor Changes

- [#1124](https://github.com/cube-js/cube-ui-kit/pull/1124) [`9d3785c4`](https://github.com/cube-js/cube-ui-kit/commit/9d3785c48998437b1115305e4db162235887ad18) Thanks [@tenphi](https://github.com/tenphi)! - Simplify `isLoadingItems` in `FilterPicker` and `FilterListBox` — it now shows a loading spinner in the search input suffix inside the popover instead of a full disclaimer. The trigger no longer shows a loading icon for `isLoadingItems`. Remove `loadingItemsLabel` prop. Unify `emptyLabel` to cover all empty states: when provided, it overrides both the "No items" and "No results found" defaults.

  During an in-flight server fetch (`filter={false}` + `isLoadingItems={true}`), stale items that do not text-match the current search are now hidden client-side via `contains`. This avoids confusing UI where unrelated stale items remain visible alongside the user's typed value. Once the fetch resolves and `isLoadingItems` flips back to `false`, the parent's items are shown as-is.

  Locally-injected selected custom values (the ones that persist via `customKeys` in multi-select with `allowsCustomValue`) now also respect the search input regardless of `filter={false}`. Previously they remained visible while the parent's items were filtered, which created an inconsistent UI. `filter={false}` only governs how parent-provided items are filtered — it does not exempt FilterListBox's own injected items.

  Improve virtual-focus behavior with `allowsCustomValue`:

  - While the user is typing and the server fetch is in flight, non-matching stale items are hidden and focus moves to the new custom-value suggestion so the user can press Enter to add it immediately.
  - When the fetch resolves with no matches, focus stays on the custom value.
  - When the fetch resolves with matches, focus moves to the first real item.
  - With client-side filtering, when no items match the search, focus moves to the custom-value suggestion (same UX as the server-side path).

## 0.127.3

### Patch Changes

- [#1122](https://github.com/cube-js/cube-ui-kit/pull/1122) [`6ae54b68`](https://github.com/cube-js/cube-ui-kit/commit/6ae54b686fef188acdf961846211bce8916df681) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty to the latest.

## 0.127.2

### Patch Changes

- [#1120](https://github.com/cube-js/cube-ui-kit/pull/1120) [`197db607`](https://github.com/cube-js/cube-ui-kit/commit/197db60739d6a335fdcb233a8a26daf0ce59964b) Thanks [@tenphi](https://github.com/tenphi)! - Fix placeholder color in input recipes to use `#placeholder` token consistently

## 0.127.1

### Patch Changes

- [`712f6c5d`](https://github.com/cube-js/cube-ui-kit/commit/712f6c5dac9412acb72b4e907c099f0db6df928d) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty to the latest with pipeline improvements.

## 0.127.0

### Minor Changes

- [`f8ef25e7`](https://github.com/cube-js/cube-ui-kit/commit/f8ef25e7a1498bded3808ebb93c6526661434116) Thanks [@tenphi](https://github.com/tenphi)! - Update `@tenphi/tasty` to `1.4.2`.

  - Hook-free `tasty()` components, enabling React Server Component compatibility.
  - New `tokenProps` option for exposing token keys as top-level component props.
  - Popularity-aware garbage collector for unused styles with `gc()`, `maybeGC()`, and `touch()` APIs.
  - Internal properties now overridable via `configure({ properties })`.
  - `filterBaseProps` is now generic — accepts strongly-typed props without casting.

- [#1116](https://github.com/cube-js/cube-ui-kit/pull/1116) [`b37f92b4`](https://github.com/cube-js/cube-ui-kit/commit/b37f92b4db5b9e17fcaf21bb87fa98bdd45d204c) Thanks [@tenphi](https://github.com/tenphi)! - Update `@tenphi/tasty` to `2.0.1`.

  - Unified hash-based class names across all rendering environments for stable cross-environment style deduplication.
  - New `presets` and `globalStyles` options in `configure()`.
  - Default `letterSpacing` in typography presets changed from `'0'` to `'normal'`.
  - Simplified GC to touch-count-driven mechanism — no longer requires `auto: true` configuration.
  - Fixed overlapping and duplicate CSS selectors produced by the condition simplifier.

  Migrated: removed deprecated `gc: { auto: true }` from `configure()` call (GC now runs automatically).

## 0.126.1

### Patch Changes

- [#1109](https://github.com/cube-js/cube-ui-kit/pull/1109) [`fb2b3e6d`](https://github.com/cube-js/cube-ui-kit/commit/fb2b3e6df036c535dea789217d29cec5c876d7f4) Thanks [@tenphi](https://github.com/tenphi)! - Fix Layout.Panel resize handler not working properly on touch devices by adding `touch-action: none` to prevent browser scroll interference during drag

- [#1110](https://github.com/cube-js/cube-ui-kit/pull/1110) [`a8f59f1f`](https://github.com/cube-js/cube-ui-kit/commit/a8f59f1f75e0184c7037b529536b5430415bbce5) Thanks [@tenphi](https://github.com/tenphi)! - fix(Tabs, RadioGroup): align radio/tabs size mapping

  Both `Tabs type="radio"` and `Radio.Tabs` now use the same two API sizes with consistent Item button mappings:

  - `large` (default): medium button (32px), 40px total
  - `medium`: xsmall button (24px), 32px total

- [#1113](https://github.com/cube-js/cube-ui-kit/pull/1113) [`e236b0cf`](https://github.com/cube-js/cube-ui-kit/commit/e236b0cf1b930041815868943cf237f83ba9240e) Thanks [@tenphi](https://github.com/tenphi)! - Update `@tenphi/tasty` to `1.2.0`.

  - All style handlers now accept CSS-wide keywords (`initial`, `inherit`, `revert`, `unset`, `revert-layer`)
  - New `longhand` modifier forces longhand CSS output for radius, padding, margin, scroll-margin, inset, and border
  - Unified placement style handler with hierarchical priority (longhands override shorthands)
  - New `scrollMargin` style with full directional support
  - `radius` now supports `inherit` value

## 0.126.0

### Minor Changes

- [#1107](https://github.com/cube-js/cube-ui-kit/pull/1107) [`c5357a7f`](https://github.com/cube-js/cube-ui-kit/commit/c5357a7f52651cf6fc9fad99259f0ce94bb67b2a) Thanks [@tenphi](https://github.com/tenphi)! - Upgrade `@tenphi/tasty` from 0.15.3 to 1.1.0.

  **Breaking changes:**

  - Font CSS custom properties renamed: `--font` → `--font-sans`, `--monospace-font` → `--font-mono`
  - Preset modifier syntax now uses `/` separator (e.g., `'t3 / strong'` instead of `'t3 strong'`)
  - Removed standalone `strong` and `em` typography presets (use modifiers instead: `'inherit / bold'`, `'inherit / italic'`)
  - The `1fs` unit is no longer supported; replaced with `1em`

## 0.125.1

### Patch Changes

- [#1105](https://github.com/cube-js/cube-ui-kit/pull/1105) [`afa94839`](https://github.com/cube-js/cube-ui-kit/commit/afa9483985a1cece863478f460c1066c7f989005) Thanks [@tenphi](https://github.com/tenphi)! - Improve `FilterPicker` and `Picker` performance: fewer redundant re-renders, memoized label and key lookups, trigger width measured only when the popover opens, and a controlled popover state so the trigger subtree reconciles normally.

## 0.125.0

### Minor Changes

- [#1103](https://github.com/cube-js/cube-ui-kit/pull/1103) [`f96c2caa`](https://github.com/cube-js/cube-ui-kit/commit/f96c2caaf79ed92854ce9786b33f55a5f17f69c4) Thanks [@tenphi](https://github.com/tenphi)! - `Tabs`: add `hideTabListScroll` prop to visually hide the custom horizontal scrollbar in the tab list and skip its tracking logic. Tab picker, scroll arrows, and fade indicators are unaffected.

## 0.124.4

### Patch Changes

- [#1101](https://github.com/cube-js/cube-ui-kit/pull/1101) [`76e8365a`](https://github.com/cube-js/cube-ui-kit/commit/76e8365a0870f29804eb1aa9976728601597f9f7) Thanks [@tenphi](https://github.com/tenphi)! - Fixed tab indicator not appearing when Tabs is rendered inside a lazy-visibility container (e.g., Dialog, collapsed panel). A ResizeObserver now detects when the container transitions from zero to non-zero width and recalculates the indicator position.

## 0.124.3

### Patch Changes

- [#1099](https://github.com/cube-js/cube-ui-kit/pull/1099) [`35b5910c`](https://github.com/cube-js/cube-ui-kit/commit/35b5910c7066c5083b0106c672fbf181088b692b) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty to fix color space definition.

## 0.124.2

### Patch Changes

- [`ad603163`](https://github.com/cube-js/cube-ui-kit/commit/ad6031634a0c5041f1c200881de918cb33ad8411) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty with support for different color spaces.

## 0.124.1

### Patch Changes

- [#1096](https://github.com/cube-js/cube-ui-kit/pull/1096) [`6a286379`](https://github.com/cube-js/cube-ui-kit/commit/6a286379347665c7de452b27d1644bdc1a7172e0) Thanks [@tenphi](https://github.com/tenphi)! - Propagate mods to TextInputBase in TextArea.

- [#1092](https://github.com/cube-js/cube-ui-kit/pull/1092) [`6afa2741`](https://github.com/cube-js/cube-ui-kit/commit/6afa2741b0d9287e427a6b7a4dc59bcb94d9a3fc) Thanks [@tenphi](https://github.com/tenphi)! - Refactor internal styled component sub-elements to use tasty `# @cube-dev/ui-kit selector syntax instead of raw CSS selectors (`'& svg'`, `'& code'`). Remove unused `Postfix`and`ButtonIcon`sub-element styles from`Menu` item styles.

## 0.124.0

### Minor Changes

- [#1093](https://github.com/cube-js/cube-ui-kit/pull/1093) [`c3530abe`](https://github.com/cube-js/cube-ui-kit/commit/c3530abe1e57751bb08f00ae2e9b3cfd06f66e14) Thanks [@tenphi](https://github.com/tenphi)! - Add `getFieldNames`, `isFieldDirty`, `getDirtyFieldNames`, `getValidFieldNames`, and `getInvalidFieldNames` methods to `CubeFormInstance`.

## 0.123.1

### Patch Changes

- [#1090](https://github.com/cube-js/cube-ui-kit/pull/1090) [`c4da7cec`](https://github.com/cube-js/cube-ui-kit/commit/c4da7cec7010df9aae7abba7c5840717ed0dd0a0) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty with support of oklch input color values.

## 0.123.0

### Minor Changes

- [#1087](https://github.com/cube-js/cube-ui-kit/pull/1087) [`b04bfde1`](https://github.com/cube-js/cube-ui-kit/commit/b04bfde1ead7158ad4ed58a8dccff662302e0c5b) Thanks [@tenphi](https://github.com/tenphi)! - Add `#surface`, `#surface-2`, and `#surface-3` for layered backgrounds. `#light` now aliases `#surface-3`. Defaults that used `#dark-bg` (CopySnippet, CopyPasteBlock, disabled theme sample, scrollbar track, Storybook playground) use `#surface-2`. File- and radio-style tab fills use the surface scale instead of `#light` / `#white`. Prefer `#surface-2` over legacy `#dark-bg`; TypeScript named-color augmentation lists the surface tokens and no longer includes `dark-bg`.

### Patch Changes

- [#1088](https://github.com/cube-js/cube-ui-kit/pull/1088) [`3d8e4181`](https://github.com/cube-js/cube-ui-kit/commit/3d8e41812ac9c3ea06d0481a080d17828d1d201e) Thanks [@tenphi](https://github.com/tenphi)! - Defer `Tabs` `onTitleChange` with `requestAnimationFrame` so controlled title updates apply after React has committed state.

## 0.122.0

### Minor Changes

- [#1085](https://github.com/cube-js/cube-ui-kit/pull/1085) [`5d30524e`](https://github.com/cube-js/cube-ui-kit/commit/5d30524ec22db9e8d0ad86c33d67193d1a4413e1) Thanks [@tenphi](https://github.com/tenphi)! - Tabs: support `contextMenu="context-only"` — tab menu opens only via right-click and Shift+F10 (no ⋮ trigger); inline close remains available when `onDelete` is set alongside a non-empty `menu`. Adds exported `TabContextMenu` type.

## 0.121.7

### Patch Changes

- [`7351f030`](https://github.com/cube-js/cube-ui-kit/commit/7351f0306bdd2f2ac8dd1cd2e3e858f574e42d03) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty to the latest version.

## 0.121.6

### Patch Changes

- [#1082](https://github.com/cube-js/cube-ui-kit/pull/1082) [`523f74ea`](https://github.com/cube-js/cube-ui-kit/commit/523f74eaa523893b3c9e524a7d2f9a89714dc537) Thanks [@tenphi](https://github.com/tenphi)! - Fix style props like `width` being applied to inner `<input>` element instead of the wrapper in TextInput, NumberInput, SearchInput, PasswordInput, TextArea, and Switch components.

- [`a86746f2`](https://github.com/cube-js/cube-ui-kit/commit/a86746f25df462ced0fa09e89adf386376d48591) Thanks [@tenphi](https://github.com/tenphi)! - Fix typography presets declaration.

- [#1082](https://github.com/cube-js/cube-ui-kit/pull/1082) [`523f74ea`](https://github.com/cube-js/cube-ui-kit/commit/523f74eaa523893b3c9e524a7d2f9a89714dc537) Thanks [@tenphi](https://github.com/tenphi)! - Standardize default `qa` (data-qa) values to PascalCase. Update selectors if you rely on these:

  - **FieldWrapper**: `Field_Message` → `FieldMessage`, `Field_Description` → `FieldDescription`
  - **Result**: `Result_Container` → `ResultContainer`

- [#1078](https://github.com/cube-js/cube-ui-kit/pull/1078) [`16ade014`](https://github.com/cube-js/cube-ui-kit/commit/16ade014d67749ca22ae97819d12442744ba4bdc) Thanks [@tenphi](https://github.com/tenphi)! - Upgrade to Vite 8 (Rolldown-powered), @vitejs/plugin-react v6, and Vitest 4.1. Remove unused storybook-addon-turbo-build. Migrate vitest config from deprecated esbuild option to oxc.

## 0.121.5

### Patch Changes

- [`24f83450`](https://github.com/cube-js/cube-ui-kit/commit/24f83450f07245e4f513f58ff73af214ec885c52) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty to latest

## 0.121.4

### Patch Changes

- [`2089380f`](https://github.com/cube-js/cube-ui-kit/commit/2089380fdd3dcfb77337546308e6d1b3a0f1117b) Thanks [@tenphi](https://github.com/tenphi)! - Fix `Form` component not passing `qa` prop to the root element.

## 0.121.3

### Patch Changes

- [#1073](https://github.com/cube-js/cube-ui-kit/pull/1073) [`b76deb1d`](https://github.com/cube-js/cube-ui-kit/commit/b76deb1d20420c588dd2fed6f88bc2497f92bb8b) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty to 0.8.1

## 0.121.2

### Patch Changes

- [#1071](https://github.com/cube-js/cube-ui-kit/pull/1071) [`80786328`](https://github.com/cube-js/cube-ui-kit/commit/807863288346d2bbd2678af9a74f5dcffc0b41af) Thanks [@tenphi](https://github.com/tenphi)! - Bump tasty to the latest version.

## 0.121.1

### Patch Changes

- [#1069](https://github.com/cube-js/cube-ui-kit/pull/1069) [`8d00caa9`](https://github.com/cube-js/cube-ui-kit/commit/8d00caa92275cee86e85ac4ce8661d396356a5c9) Thanks [@tenphi](https://github.com/tenphi)! - Update tasty to support infering property types.

## 0.121.0

### Minor Changes

- [#1067](https://github.com/cube-js/cube-ui-kit/pull/1067) [`8af42c73`](https://github.com/cube-js/cube-ui-kit/commit/8af42c732511957f37bf89e725c0ed6c93c72a3b) Thanks [@tenphi](https://github.com/tenphi)! - **Button.Split:** New compound component for split-button patterns. Supports two modes: **custom** (arbitrary `<Button>` children with joined radius) and **strict** (declarative `actions` array with built-in dropdown menu, controlled/uncontrolled selection). `type`, `theme`, `size`, and `isDisabled` are inherited by child buttons via context.

- [#1067](https://github.com/cube-js/cube-ui-kit/pull/1067) [`8af42c73`](https://github.com/cube-js/cube-ui-kit/commit/8af42c732511957f37bf89e725c0ed6c93c72a3b) Thanks [@tenphi](https://github.com/tenphi)! - **Tabs:** Added support for `icon`, `rightIcon`, `prefix`, `suffix`, `tooltip`, `isLoading`, and `loadingSlot` props on `Tabs.Tab`, inherited from the `Item` component. Tab icons are also shown in the TabPicker dropdown.

### Patch Changes

- [#1067](https://github.com/cube-js/cube-ui-kit/pull/1067) [`8af42c73`](https://github.com/cube-js/cube-ui-kit/commit/8af42c732511957f37bf89e725c0ed6c93c72a3b) Thanks [@tenphi](https://github.com/tenphi)! - **Button:** The dynamic `icon` callback now receives `pressed` in its mods argument. Use it to change the icon when the button is pressed (e.g., arrow up when menu is open, arrow down when closed).

- [#1067](https://github.com/cube-js/cube-ui-kit/pull/1067) [`8af42c73`](https://github.com/cube-js/cube-ui-kit/commit/8af42c732511957f37bf89e725c0ed6c93c72a3b) Thanks [@tenphi](https://github.com/tenphi)! - **Disclosure:** Removed default white background (`fill`) from the disclosure root. The component is now transparent by default; use `styles` or `contentStyles` to add a background when needed.

## 0.120.1

### Patch Changes

- [#1065](https://github.com/cube-js/cube-ui-kit/pull/1065) [`55403a6f`](https://github.com/cube-js/cube-ui-kit/commit/55403a6f26950979aca19198fc6919dcdd0134d5) Thanks [@tenphi](https://github.com/tenphi)! - Tooltip: limit max width to viewport to prevent overflow on small screens

## 0.120.0

### Minor Changes

- [#1063](https://github.com/cube-js/cube-ui-kit/pull/1063) [`0342a0f1`](https://github.com/cube-js/cube-ui-kit/commit/0342a0f1b358ab9f402cc8dadfe929998940a31b) Thanks [@tenphi](https://github.com/tenphi)! - Add `ItemCard` component — a convenience wrapper around `Item type="card"` that maps `title` to the card heading and `children` to the card body. Includes `ItemCard.Action` sub-component for inline actions.

## 0.119.1

### Patch Changes

- [#1061](https://github.com/cube-js/cube-ui-kit/pull/1061) [`e3b7999c`](https://github.com/cube-js/cube-ui-kit/commit/e3b7999c3bddfece0c2184f6e35d13db1bd38f4f) Thanks [@tenphi](https://github.com/tenphi)! - Fix Disclosure: pass `transitionDuration` as `$disclosure-transition` token so the height animation uses the same duration as the expand/collapse transition

## 0.119.0

### Minor Changes

- [#1059](https://github.com/cube-js/cube-ui-kit/pull/1059) [`aaca6486`](https://github.com/cube-js/cube-ui-kit/commit/aaca648681c80bce09b719e649f78609c0419f47) Thanks [@tenphi](https://github.com/tenphi)! - Migrate from internal tasty module to external `@tenphi/tasty` package.

  **Breaking changes:**

  - Removed sub-path exports: `@cube-dev/ui-kit/tasty/static`, `@cube-dev/ui-kit/tasty/zero`, `@cube-dev/ui-kit/tasty/zero/babel`, `@cube-dev/ui-kit/tasty/zero/next`
  - Consumers should import these directly from `@tenphi/tasty/static`, `@tenphi/tasty/zero`, `@tenphi/tasty/babel-plugin`, `@tenphi/tasty/next` instead

  **Internal changes:**

  - Removed internal `src/tasty/` directory (~133 files)
  - All internal imports now use `@tenphi/tasty` package
  - Fixed module augmentations in `src/tasty-augment.d.ts` to target `@tenphi/tasty` instead of removed internal modules
  - Added `isDevEnv` utility to `src/utils/is-dev-env.ts`

## 0.118.0

### Minor Changes

- [#1056](https://github.com/cube-js/cube-ui-kit/pull/1056) [`fada43b6`](https://github.com/cube-js/cube-ui-kit/commit/fada43b6aa93232dc85af5e03a0c4737054b5683) Thanks [@tenphi](https://github.com/tenphi)! - Add `isDismissable` option to progress toasts. When enabled, a "Hide" action button appears during loading, allowing users to temporarily dismiss the toast. The toast will not re-appear during the same loading cycle after being dismissed.

- [#1056](https://github.com/cube-js/cube-ui-kit/pull/1056) [`fada43b6`](https://github.com/cube-js/cube-ui-kit/commit/fada43b6aa93232dc85af5e03a0c4737054b5683) Thanks [@tenphi](https://github.com/tenphi)! - Rename `isDismissible` prop to `isDismissable` in Banner and Notification components for consistency with other components (Dialog, LayoutPanel, etc.). This is a breaking change - update your code to use `isDismissable` instead of `isDismissible`.

- [#1056](https://github.com/cube-js/cube-ui-kit/pull/1056) [`fada43b6`](https://github.com/cube-js/cube-ui-kit/commit/fada43b6aa93232dc85af5e03a0c4737054b5683) Thanks [@tenphi](https://github.com/tenphi)! - Add notification restore functionality. When an async action returns `false`, dismissed notifications can now be restored automatically.

### Patch Changes

- [#1056](https://github.com/cube-js/cube-ui-kit/pull/1056) [`fada43b6`](https://github.com/cube-js/cube-ui-kit/commit/fada43b6aa93232dc85af5e03a0c4737054b5683) Thanks [@tenphi](https://github.com/tenphi)! - Improve progress toast updates. Progress toasts now update in-place instead of removing and re-adding, preventing unnecessary exit/enter animations when data changes.

## 0.117.0

### Minor Changes

- [#1054](https://github.com/cube-js/cube-ui-kit/pull/1054) [`9bbc6de2`](https://github.com/cube-js/cube-ui-kit/commit/9bbc6de27b95f5f7d45503370a8fecf4c83aa1bb) Thanks [@tenphi](https://github.com/tenphi)! - Added `onBack` prop to `Layout.Header` component. When provided, a back button with arrow icon is rendered to the left of the title, allowing users to navigate back from the current page.

- [#1053](https://github.com/cube-js/cube-ui-kit/pull/1053) [`9b68b794`](https://github.com/cube-js/cube-ui-kit/commit/9b68b794ed9924cb5a9eec3b1eb5ba13956ec8a0) Thanks [@tenphi](https://github.com/tenphi)! - Added support for CSS string values (like percentages) for `maxSize` prop in Layout.Panel, added `minContentSize` prop to Layout component to control minimum content area between panels, and implemented natural boundaries logic so panels on opposite sides automatically prevent overlap and maintain minimum content space.

## 0.116.3

### Patch Changes

- [#1051](https://github.com/cube-js/cube-ui-kit/pull/1051) [`abe13ad2`](https://github.com/cube-js/cube-ui-kit/commit/abe13ad229aade781785264a212a446b5a262e4e) Thanks [@tenphi](https://github.com/tenphi)! - Fix slider track fill color in disabled state

## 0.116.2

### Patch Changes

- [#1048](https://github.com/cube-js/cube-ui-kit/pull/1048) [`3416f067`](https://github.com/cube-js/cube-ui-kit/commit/3416f067c59695c4fec19f39f77c0728c53b0703) Thanks [@tenphi](https://github.com/tenphi)! - Banner: Use Button component instead of Link for BannerLink implementation. This is an internal refactoring that maintains the same public API and visual appearance.

- [#1048](https://github.com/cube-js/cube-ui-kit/pull/1048) [`3416f067`](https://github.com/cube-js/cube-ui-kit/commit/3416f067c59695c4fec19f39f77c0728c53b0703) Thanks [@tenphi](https://github.com/tenphi)! - Fix okhsl color function to preserve opacity/alpha channel when converting to RGB. Previously, alpha values were silently dropped when using okhsl() colors in styles or tokens. Now okhsl() colors with alpha (e.g., `okhsl(240 50% 50% / .5)`) are correctly converted to `rgb()` format with alpha preserved.

- [#1050](https://github.com/cube-js/cube-ui-kit/pull/1050) [`f4f3f829`](https://github.com/cube-js/cube-ui-kit/commit/f4f3f829047b46471252c98e2ba7b720d8529954) Thanks [@tenphi](https://github.com/tenphi)! - Persist dismissed notification IDs in localStorage so they survive page reloads (24h TTL)

- [#1050](https://github.com/cube-js/cube-ui-kit/pull/1050) [`f4f3f829`](https://github.com/cube-js/cube-ui-kit/commit/f4f3f829047b46471252c98e2ba7b720d8529954) Thanks [@tenphi](https://github.com/tenphi)! - Add `actions` prop to Toast component to support interactive action buttons (e.g., Cancel button in progress toasts). Toasts with actions remain interactive and prevent overlay collapse.

## 0.116.1

### Patch Changes

- [#1045](https://github.com/cube-js/cube-ui-kit/pull/1045) [`552e078c`](https://github.com/cube-js/cube-ui-kit/commit/552e078c62a6ef776121cb008b994bd8f962c7dc) Thanks [@tenphi](https://github.com/tenphi)! - Toast: Make `useProgressToast` options parameter optional and require loading cycle before showing toast. Non-loading initial states are now silently ignored until a loading cycle occurs. Calling the hook with no argument now dismisses the toast.

## 0.116.0

### Minor Changes

- [#1044](https://github.com/cube-js/cube-ui-kit/pull/1044) [`696fd599`](https://github.com/cube-js/cube-ui-kit/commit/696fd599cbe98d2973456c2bbdcad1c356bb547a) Thanks [@tenphi](https://github.com/tenphi)! - Add support for default type styling in Tabs component. TabsAction now adapts its appearance based on tabs type (outline for default type, neutral for others).

### Patch Changes

- [#1042](https://github.com/cube-js/cube-ui-kit/pull/1042) [`32a07b40`](https://github.com/cube-js/cube-ui-kit/commit/32a07b40f3c804f1da0faaf4af04dbea154dcc33) Thanks [@tenphi](https://github.com/tenphi)! - Revert wrong font definition.

## 0.115.0

### Minor Changes

- [#1041](https://github.com/cube-js/cube-ui-kit/pull/1041) [`44d5512f`](https://github.com/cube-js/cube-ui-kit/commit/44d5512f1b91aff1ea6792154c7ce4b4d0d533a4) Thanks [@tenphi](https://github.com/tenphi)! - **Breaking change:** Removed `reset` style property from tasty style system. Browser reset styles are now provided via recipes (`reset`, `button`, `input`, `input-autofill`, `input-placeholder`, `input-search-cancel-button`) registered in the UI kit configuration. Recipe names are now space-separated, with `|` separating base recipes from post-merge recipes.

  **Migration:**

  - Replace `reset: 'button'` with `recipe: 'reset button'`
  - Replace `reset: 'input'` with `recipe: 'reset input | input-autofill'` and add sub-element styles for `Placeholder` and `&::-webkit-search-cancel-button`

- [`c0931497`](https://github.com/cube-js/cube-ui-kit/commit/c09314970629e5312b60681461bd282572960301) Thanks [@tenphi](https://github.com/tenphi)! - Add style extend functionality to `tasty` style system, enabling state map merging, `@inherit` keyword, and property reset semantics.

  **New features:**

  - **State map extension mode**: When extending a component with a state map that doesn't include a `''` key, parent states are preserved and new states are appended
  - **State map replace mode**: When a state map includes a `''` key, it replaces all parent states (existing behavior)
  - **`@inherit` keyword**: Pull parent state values into child state maps, supporting both repositioning (extend mode) and cherry-picking (replace mode)
  - **`null` reset**: Use `null` as a property value to discard parent values and let recipe values fill in
  - **`false` tombstone**: Use `false` to block a property entirely, preventing both parent and recipe values

  **Behavior changes:**

  - Sub-element handling now uses strict equality (`=== null`) instead of loose equality (`== null`) for better semantic clarity

- [#1041](https://github.com/cube-js/cube-ui-kit/pull/1041) [`44d5512f`](https://github.com/cube-js/cube-ui-kit/commit/44d5512f1b91aff1ea6792154c7ce4b4d0d533a4) Thanks [@tenphi](https://github.com/tenphi)! - **Breaking change:** Renamed design tokens used by the tasty style system:

  - `$leaf-sharp-radius` → `$sharp-radius`
  - `$card-shadow` → `$shadow` (in shadow.ts default and component styles)
  - `$fade-width` removed — fade now defaults to `calc(2 * var(--gap))`

  **New:** Tasty now ships with built-in defaults for core design tokens, so the style system works out of the box without a project-level token setup:

  - CSS `@property` registrations with initial values for `$gap` (4px), `$radius` (6px), `$border-width` (1px), `$outline-width` (3px), `$transition` (80ms), `$sharp-radius` (0px), `$bold-font-weight` (700)
  - Default `:root` variables for `--font`, `--monospace-font`, and `--border-color` (currentColor)

  These defaults are overridden by any tokens the consuming project sets on `:root`.

### Patch Changes

- [#1041](https://github.com/cube-js/cube-ui-kit/pull/1041) [`44d5512f`](https://github.com/cube-js/cube-ui-kit/commit/44d5512f1b91aff1ea6792154c7ce4b4d0d533a4) Thanks [@tenphi](https://github.com/tenphi)! - **Fix:** `preset="strong"` (and other modifier-only presets like `"italic"`, `"icon"`, `"tight"`) now correctly inherits typography instead of resolving to `--strong-*` CSS variables. When no preset name is provided, the base preset defaults to `inherit`.

- [#1041](https://github.com/cube-js/cube-ui-kit/pull/1041) [`44d5512f`](https://github.com/cube-js/cube-ui-kit/commit/44d5512f1b91aff1ea6792154c7ce4b4d0d533a4) Thanks [@tenphi](https://github.com/tenphi)! - **Fix:** Vendor-prefixed pseudo-classes (e.g. `:-webkit-autofill`, `:-moz-placeholder`) are now correctly tokenized as pseudo-classes instead of being misinterpreted as boolean modifiers (`[data-webkit-autofill]`).

- [#1041](https://github.com/cube-js/cube-ui-kit/pull/1041) [`44d5512f`](https://github.com/cube-js/cube-ui-kit/commit/44d5512f1b91aff1ea6792154c7ce4b4d0d533a4) Thanks [@tenphi](https://github.com/tenphi)! - **Internal refactoring:** Made token type definitions extensible in the tasty style system. Color names (`TastyNamedColors`), preset names (`TastyPresetNames`), and theme names (`TastyThemeNames`) are now defined via extensible interfaces instead of hardcoded unions.

  This change maintains full backward compatibility - all existing UI kit tokens continue to work via module augmentation. Projects can now augment these interfaces to register their own token names for autocomplete.

- [#1041](https://github.com/cube-js/cube-ui-kit/pull/1041) [`44d5512f`](https://github.com/cube-js/cube-ui-kit/commit/44d5512f1b91aff1ea6792154c7ce4b4d0d533a4) Thanks [@tenphi](https://github.com/tenphi)! - **New:** Predefined state aliases (`@name`) can now be defined inside sub-element blocks and are scoped to that sub-element and its nested children. Parent-level states are inherited; sub-element states do not leak to siblings.

## 0.114.0

### Minor Changes

- [#1034](https://github.com/cube-js/cube-ui-kit/pull/1034) [`10f3e422`](https://github.com/cube-js/cube-ui-kit/commit/10f3e4225028a70a116496de1d46315f2290574c) Thanks [@tenphi](https://github.com/tenphi)! - Refactored notifications system: replaced `NotificationsProvider` and `ToastProvider` with unified `OverlayProvider`. Removed `NotificationsBar` and `NotificationsDialog` components. Introduced new `Notification` component API with `useNotifications` and `usePersistentNotifications` hooks. The Root component now uses `OverlayProvider` instead of separate providers.

### Patch Changes

- [#1036](https://github.com/cube-js/cube-ui-kit/pull/1036) [`19d27844`](https://github.com/cube-js/cube-ui-kit/commit/19d27844326fafaac7a7b94440bf990f2c634802) Thanks [@tenphi](https://github.com/tenphi)! - Fix TabDropIndicator position recalculation when tab content changes during drag operations. The drop indicator now properly updates its position when any tab's content is modified.

## 0.113.1

### Patch Changes

- [#1032](https://github.com/cube-js/cube-ui-kit/pull/1032) [`4b57a4e8`](https://github.com/cube-js/cube-ui-kit/commit/4b57a4e868eabd411f5d16b8940c48db68c181ce) Thanks [@tenphi](https://github.com/tenphi)! - Fix Layout.Center component centering behavior by adjusting placeItems and placeContent styles.

- [#1031](https://github.com/cube-js/cube-ui-kit/pull/1031) [`c2c36157`](https://github.com/cube-js/cube-ui-kit/commit/c2c36157c18ea556743bb7c0820ec18721ed5cbf) Thanks [@tenphi](https://github.com/tenphi)! - Fix okhsl color conversion in production builds by registering okhsl as a built-in parser function instead of relying on a side-effect configure() call that can be tree-shaken away.

## 0.113.0

### Minor Changes

- [#1028](https://github.com/cube-js/cube-ui-kit/pull/1028) [`d3fed9e8`](https://github.com/cube-js/cube-ui-kit/commit/d3fed9e8e69c33ac091fbb97e5b0374b537084a1) Thanks [@tenphi](https://github.com/tenphi)! - Add support for arbitrary CSS function syntax in container queries. Functions like `scroll-state()` and `style()` can now be used directly in `@(...)` container queries and are passed through to CSS verbatim. The existing `# @cube-dev/ui-kit shorthand for custom property style queries remains unchanged and is still the recommended approach for querying CSS custom properties.

### Patch Changes

- [#1030](https://github.com/cube-js/cube-ui-kit/pull/1030) [`6079d7b0`](https://github.com/cube-js/cube-ui-kit/commit/6079d7b0e16cb542bf8eea51d91589c693bd1504) Thanks [@tenphi](https://github.com/tenphi)! - Fix Layout.Header breadcrumbs to no longer duplicate the title. Breadcrumbs now end with a trailing slash separator, and the title appears only once as the heading below.

## 0.112.0

### Minor Changes

- [#1024](https://github.com/cube-js/cube-ui-kit/pull/1024) [`b12a07ac`](https://github.com/cube-js/cube-ui-kit/commit/b12a07ac7fd355bc3dc4b9b1692033967687f6db) Thanks [@tenphi](https://github.com/tenphi)! - Add recipes feature to the tasty style system. Recipes are predefined, named style bundles registered via `configure({ recipes })` and applied to components via the `recipe` style property. Multiple recipes can be composed with commas (`recipe: 'card, elevated'`), and component styles always override recipe values. Recipes work with both runtime `tasty` and zero-runtime `tastyStatic`.

### Patch Changes

- [#1027](https://github.com/cube-js/cube-ui-kit/pull/1027) [`1e2ca928`](https://github.com/cube-js/cube-ui-kit/commit/1e2ca9284e9e71471068ae146fd1798e2209e94a) Thanks [@tenphi](https://github.com/tenphi)! - Fix Item description width to properly handle responsive sizing and prevent overflow issues.

## 0.111.2

### Patch Changes

- [#1021](https://github.com/cube-js/cube-ui-kit/pull/1021) [`6e677a27`](https://github.com/cube-js/cube-ui-kit/commit/6e677a27d438f91b944d387e1e6e74fb993e99ce) Thanks [@tenphi](https://github.com/tenphi)! - Fix ItemButton actions positioning for card type variant and disable pointer events when actions are not shown

## 0.111.1

### Patch Changes

- [#1022](https://github.com/cube-js/cube-ui-kit/pull/1022) [`5885ac14`](https://github.com/cube-js/cube-ui-kit/commit/5885ac1422f330a8a1a79a5b1cea1fdd47db61e3) Thanks [@tenphi](https://github.com/tenphi)! - Fixed Banner component description text styling by correcting the style selector from `Label` to `Description`. Improved display style system to respect user-provided `whiteSpace` prop, allowing it to override default white-space values set by `textOverflow`.

## 0.111.0

### Minor Changes

- [#1017](https://github.com/cube-js/cube-ui-kit/pull/1017) [`82100de3`](https://github.com/cube-js/cube-ui-kit/commit/82100de3dbd9957b4a2846be8e2744226f866c54) Thanks [@tenphi](https://github.com/tenphi)! - Added Banner component with Banner.Action and Banner.Link sub-components for displaying contextual notifications and alerts with support for danger, warning, note, and success themes.

### Patch Changes

- [#1018](https://github.com/cube-js/cube-ui-kit/pull/1018) [`8552358e`](https://github.com/cube-js/cube-ui-kit/commit/8552358e0e03f895d63d28105a50e8d3e518edc7) Thanks [@tenphi](https://github.com/tenphi)! - Fix button colors to ensure proper contrast and consistent styling across all button variants

- [#1018](https://github.com/cube-js/cube-ui-kit/pull/1018) [`8552358e`](https://github.com/cube-js/cube-ui-kit/commit/8552358e0e03f895d63d28105a50e8d3e518edc7) Thanks [@tenphi](https://github.com/tenphi)! - Fix color RGB custom property generation and @property syntax

  - Fix `convertColorChainToRgbChain` to correctly extract RGB values from `rgb(var(--name-color-rgb) / alpha)` patterns. Previously, `--current-color-rgb` was incorrectly set to the full `rgb()` expression instead of just the `var(--name-color-rgb)` reference.
  - Fix `INTERNAL_PROPERTIES` syntax: change invalid `<number> <number> <number>` syntax to valid `<number>+` for RGB triplet properties.
  - Automatically create companion `-rgb` custom properties when registering color `@property` definitions. Color properties (e.g., `#white`) now automatically get their `--white-color-rgb` companion with proper syntax and initial value derived from the color's initial value.

- [#1020](https://github.com/cube-js/cube-ui-kit/pull/1020) [`c60c03a3`](https://github.com/cube-js/cube-ui-kit/commit/c60c03a335c590f7600d2e75bac3a409e2d7c5d9) Thanks [@tenphi](https://github.com/tenphi)! - Fixed SubmitButton to properly disable when form is submitting, preventing double submissions.

- [#1016](https://github.com/cube-js/cube-ui-kit/pull/1016) [`c468f38b`](https://github.com/cube-js/cube-ui-kit/commit/c468f38b382b23043b1a46fc9c11499499e467a0) Thanks [@tenphi](https://github.com/tenphi)! - Set the default menu size inside popovers to max-content.

## 0.110.0

### Minor Changes

- [#1014](https://github.com/cube-js/cube-ui-kit/pull/1014) [`a7047d35`](https://github.com/cube-js/cube-ui-kit/commit/a7047d351138b43f92bd5c464d504d05ff5fd985) Thanks [@tenphi](https://github.com/tenphi)! - Add `#primary`, `#primary-text`, `#primary-bg`, `#primary-icon`, and `#primary-disabled` semantic color tokens. Internal components now use these primary tokens instead of purple variants. The original `#purple*` tokens remain available as aliases for backward compatibility.

### Patch Changes

- [#1012](https://github.com/cube-js/cube-ui-kit/pull/1012) [`cd316981`](https://github.com/cube-js/cube-ui-kit/commit/cd3169814b6fa916caf833b7cf27d8e6fa5fc6a0) Thanks [@tenphi](https://github.com/tenphi)! - Fix scrollbar color when scrollbar is hidden and add scrollbar color tokens (`#scrollbar-thumb-color`, `#scrollbar-track-color`)

- [#1013](https://github.com/cube-js/cube-ui-kit/pull/1013) [`9da597e0`](https://github.com/cube-js/cube-ui-kit/commit/9da597e042170552526c3a09f7a5a33355214758) Thanks [@tenphi](https://github.com/tenphi)! - Allow partial chunking for styles with `@starting-style`: top-level styles are still combined into a single chunk (required by CSS cascade), but sub-element styles are now kept in a separate chunk for better caching.

## 0.109.0

### Minor Changes

- [#1010](https://github.com/cube-js/cube-ui-kit/pull/1010) [`9f35c79e`](https://github.com/cube-js/cube-ui-kit/commit/9f35c79e171255e8a057a732e0247c5afd7a439c) Thanks [@tenphi](https://github.com/tenphi)! - - Fix Layout component z-index stacking by using DOM order instead of explicit z-index values
  - Add `doNotOverflow` prop to Layout component to control overflow behavior
  - **BREAKING**: Layout root element now defaults to `overflow: visible` instead of `overflow: hidden`. Use `doNotOverflow` prop to restore the previous behavior.

## 0.108.5

### Patch Changes

- [#1009](https://github.com/cube-js/cube-ui-kit/pull/1009) [`f6efe1dc`](https://github.com/cube-js/cube-ui-kit/commit/f6efe1dc1c1b5795d7d90bf0c7f5b9df3be5f43c) Thanks [@tenphi](https://github.com/tenphi)! - Fix TextArea controlled state handling to prevent cursor position reset when typing

- [#1006](https://github.com/cube-js/cube-ui-kit/pull/1006) [`93a65944`](https://github.com/cube-js/cube-ui-kit/commit/93a65944a0697e1b4c6a7a0288b397cebbdad9f6) Thanks [@tenphi](https://github.com/tenphi)! - Fix button reset styles by moving appearance, touchAction, and textDecoration from global reset to individual component styles

## 0.108.4

### Patch Changes

- [#1004](https://github.com/cube-js/cube-ui-kit/pull/1004) [`7032020f`](https://github.com/cube-js/cube-ui-kit/commit/7032020f6ce7676a8992f0bf932ed581a4faa533) Thanks [@tenphi](https://github.com/tenphi)! - Fix style leaking in LayoutHeader and TextInput components by adding more specific CSS selectors to prevent styles from affecting unintended child elements.

## 0.108.3

### Patch Changes

- [#1002](https://github.com/cube-js/cube-ui-kit/pull/1002) [`0890e022`](https://github.com/cube-js/cube-ui-kit/commit/0890e022fe1d57907dde6069993cf12821b98826) Thanks [@tenphi](https://github.com/tenphi)! - Fixed a bug where styles would intermittently disappear from elements after garbage collection. The issue occurred when multiple CSS rules were deleted at non-contiguous indices, causing index corruption for remaining rules.

## 0.108.2

### Patch Changes

- [#997](https://github.com/cube-js/cube-ui-kit/pull/997) [`7b19f4d5`](https://github.com/cube-js/cube-ui-kit/commit/7b19f4d55c04ad38444e3dc7615e25412434d22b) Thanks [@tenphi](https://github.com/tenphi)! - Add missing bold weight tokens in presets.

## 0.108.1

### Patch Changes

- [#994](https://github.com/cube-js/cube-ui-kit/pull/994) [`3516a129`](https://github.com/cube-js/cube-ui-kit/commit/3516a129658f8dac4e064c0df7c9ee78fa9b03eb) Thanks [@tenphi](https://github.com/tenphi)! - Export tasty.config.ts

- [#995](https://github.com/cube-js/cube-ui-kit/pull/995) [`cbc20da3`](https://github.com/cube-js/cube-ui-kit/commit/cbc20da3c86ab6bdf8d2f37af4e199afa6aff057) Thanks [@tenphi](https://github.com/tenphi)! - Fix unnecessary re-renders in Tabs component:

  - Fix actions width measurement effect dependency
  - Stabilize `getAllowedDropOperations` callback in drag/drop hooks

  Fix ItemButton missing hover/press/focus states by not overriding actionProps.mods

- [#994](https://github.com/cube-js/cube-ui-kit/pull/994) [`3516a129`](https://github.com/cube-js/cube-ui-kit/commit/3516a129658f8dac4e064c0df7c9ee78fa9b03eb) Thanks [@tenphi](https://github.com/tenphi)! - Migrate all `@keyframes` definitions to use object format for style values instead of raw CSS strings. This ensures consistent token processing and better type safety.

## 0.108.0

### Minor Changes

- [#988](https://github.com/cube-js/cube-ui-kit/pull/988) [`77b87cec`](https://github.com/cube-js/cube-ui-kit/commit/77b87cec90dbb00af09a07c0d7717bc89aa647f2) Thanks [@tenphi](https://github.com/tenphi)! - Add HueSlider component for selecting hue values (0-359) with a rainbow gradient track using okhsl color space. The thumb dynamically reflects the current hue color.

  Add `trackStyles`, `thumbStyles`, and `thumbTokens` props to the Slider component to enable customization of track and thumb elements. The thumb fill color can be customized via `#slider-thumb` and `#slider-thumb-hovered` color tokens.

- [#993](https://github.com/cube-js/cube-ui-kit/pull/993) [`8b539949`](https://github.com/cube-js/cube-ui-kit/commit/8b5399490a7fbc6d3e4d64726717a419125f8e6f) Thanks [@tenphi](https://github.com/tenphi)! - Add support for boolean `true` values in color tokens. When `true` is provided for a color token (`#name`), it converts to `transparent`. This works in:

  - Component styles: `#overlay: { '': true, ':hover': '#purple' }`
  - Tokens prop: `<Element tokens={{ '#overlay': true }} />`
  - Global config: `configure({ tokens: { '#surface': true } })`

  Boolean `false` skips the token entirely (no CSS output).

- [#993](https://github.com/cube-js/cube-ui-kit/pull/993) [`8b539949`](https://github.com/cube-js/cube-ui-kit/commit/8b5399490a7fbc6d3e4d64726717a419125f8e6f) Thanks [@tenphi](https://github.com/tenphi)! - Rename `showActionsOnHover` prop to `autoHideActions` in Item, ItemButton, and Tabs components. The new name better reflects the behavior: actions are hidden by default and revealed on hover, focus, or when an action is pressed.

- [#988](https://github.com/cube-js/cube-ui-kit/pull/988) [`77b87cec`](https://github.com/cube-js/cube-ui-kit/commit/77b87cec90dbb00af09a07c0d7717bc89aa647f2) Thanks [@tenphi](https://github.com/tenphi)! - Allow passing `false` to sub-element keys in tasty styles to remove all styles for that sub-element when extending/wrapping styled components.

  ```tsx
  const CustomTable = tasty(Table, {
    Cell: false, // Removes all Cell styles from the base component
  });
  ```

  Nullish values (`null`, `undefined`) are treated as ignored (no change to styles).

### Patch Changes

- [#989](https://github.com/cube-js/cube-ui-kit/pull/989) [`6fb56a68`](https://github.com/cube-js/cube-ui-kit/commit/6fb56a6865ccf388f6d6cc0afd8404d9d463d800) Thanks [@tenphi](https://github.com/tenphi)! - Fix nested Layout panels affecting parent layouts by splitting context into actions and state, and add LayoutContextReset component to isolate nested panel contexts.

  Layout.Panel now uses React portals for rendering, which allows panels to work correctly even when wrapped in custom components. This removes the need for child detection heuristics and ensures reliable panel positioning regardless of component composition.

- [#992](https://github.com/cube-js/cube-ui-kit/pull/992) [`945375c4`](https://github.com/cube-js/cube-ui-kit/commit/945375c4bdf22e5c8214fbac8bf3a84e40f181a8) Thanks [@tenphi](https://github.com/tenphi)! - Update Tabs component API to use `string` type instead of `Key` for all key-related props and callbacks. This aligns the public API with the internal implementation which already converts keys to strings for React Aria compatibility.

- [#993](https://github.com/cube-js/cube-ui-kit/pull/993) [`8b539949`](https://github.com/cube-js/cube-ui-kit/commit/8b5399490a7fbc6d3e4d64726717a419125f8e6f) Thanks [@tenphi](https://github.com/tenphi)! - Improve Tabs component styling with better element selectors and enhanced visual appearance. Updated shadow handling for file type tabs and refined scrollbar positioning in Layout components.

- [#993](https://github.com/cube-js/cube-ui-kit/pull/993) [`8b539949`](https://github.com/cube-js/cube-ui-kit/commit/8b5399490a7fbc6d3e4d64726717a419125f8e6f) Thanks [@tenphi](https://github.com/tenphi)! - Add styling props to Tabs component for sub-element customization: `tabListPadding`, `tabListStyles`, `prefixStyles`, and `suffixStyles`.

- [#993](https://github.com/cube-js/cube-ui-kit/pull/993) [`8b539949`](https://github.com/cube-js/cube-ui-kit/commit/8b5399490a7fbc6d3e4d64726717a419125f8e6f) Thanks [@tenphi](https://github.com/tenphi)! - Add `useMergeStyles` hook for merging base styles with sub-element style props. Simplifies accepting props like `tabListStyles`, `prefixStyles` that merge into `styles.TabList`, `styles.Prefix`.

## 0.107.0

### Minor Changes

- [#986](https://github.com/cube-js/cube-ui-kit/pull/986) [`43804e80`](https://github.com/cube-js/cube-ui-kit/commit/43804e8053815d2f060572307e4547253e544fe9) Thanks [@tenphi](https://github.com/tenphi)! - Improved sub-element selector affix (`# @cube-dev/ui-kit) with new capabilities:

  - **Compact syntax**: No spaces required around combinators (`'>Body>Row>'` now works)
  - **Pseudo-elements on root**: Use `$: '::before'` to style root pseudo-elements
  - **Pseudo on sub-elements**: Use `@` placeholder for pseudo on keyed elements (`$: '>@:hover'`)
  - **Multiple selectors**: Comma-separated patterns (`$: '::before, ::after'`)
  - **Sibling combinators**: Support `+` and `~` after elements (`$: '>Item+'`)
  - **Validation**: Standalone `+` or `~` warns and skips (targets outside root scope)

## 0.106.1

### Patch Changes

- [#984](https://github.com/cube-js/cube-ui-kit/pull/984) [`ee37ff63`](https://github.com/cube-js/cube-ui-kit/commit/ee37ff63fb3fe9151586ca4148ecff888827573f) Thanks [@tenphi](https://github.com/tenphi)! - Add qa prop to Toast.

## 0.106.0

### Minor Changes

- [#983](https://github.com/cube-js/cube-ui-kit/pull/983) [`48bc9c70`](https://github.com/cube-js/cube-ui-kit/commit/48bc9c70cb7777c4b7b728eb1ee3eb78bfe0192c) Thanks [@tenphi](https://github.com/tenphi)! - Add `#current` color token that maps to CSS `currentcolor` keyword. Supports opacity using `color-mix`:

  - `#current` → `currentcolor`
  - `#current.5` → `color-mix(in oklab, currentcolor 50%, transparent)`
  - `#current.$opacity` → `color-mix(in oklab, currentcolor calc(var(--opacity) * 100%), transparent)`

  Note: `#current` is a reserved token and cannot be overridden via `configure({ tokens: {...} })`. Using `#current` to define other color tokens will log a warning and be ignored.

- [#983](https://github.com/cube-js/cube-ui-kit/pull/983) [`48bc9c70`](https://github.com/cube-js/cube-ui-kit/commit/48bc9c70cb7777c4b7b728eb1ee3eb78bfe0192c) Thanks [@tenphi](https://github.com/tenphi)! - Add custom property opacity syntax for color tokens. You can now use `$name` syntax to reference a CSS custom property as the opacity value:

  - `#purple.$disabled` → `rgb(var(--purple-color-rgb) / var(--disabled))`
  - `#dark-05.$my-opacity` → `rgb(var(--dark-05-color-rgb) / var(--my-opacity))`

  This allows for dynamic opacity values that can be controlled via CSS custom properties.

### Patch Changes

- [#980](https://github.com/cube-js/cube-ui-kit/pull/980) [`9e6cd5da`](https://github.com/cube-js/cube-ui-kit/commit/9e6cd5dab2d290c0882d145c5c2d375c2a71fa24) Thanks [@tenphi](https://github.com/tenphi)! - Allow passing empty values (null, undefined, false, or empty object) to `useProgressToast` hook to immediately remove any existing toast without delay.

- [#980](https://github.com/cube-js/cube-ui-kit/pull/980) [`9e6cd5da`](https://github.com/cube-js/cube-ui-kit/commit/9e6cd5dab2d290c0882d145c5c2d375c2a71fa24) Thanks [@tenphi](https://github.com/tenphi)! - Add automatic theme-based icons to declarative `<Toast>` component, matching the behavior of `useToast` and `useProgressToast` hooks. Consolidate icon logic into a shared `getThemeIcon` helper.

## 0.105.1

### Patch Changes

- [#978](https://github.com/cube-js/cube-ui-kit/pull/978) [`744e9696`](https://github.com/cube-js/cube-ui-kit/commit/744e969674d2e4fd4b867357affdbdeb0128d83e) Thanks [@tenphi](https://github.com/tenphi)! - Add default theme-based icons to `useProgressToast` result states, matching the behavior of `toast.*()` API.

## 0.105.0

### Minor Changes

- [#977](https://github.com/cube-js/cube-ui-kit/pull/977) [`18cb18bd`](https://github.com/cube-js/cube-ui-kit/commit/18cb18bd965bf46064335d9340debcae82379fe6) Thanks [@tenphi](https://github.com/tenphi)! - Add support for dual-color `fill` style. When two color tokens are provided (e.g., `fill="#primary #secondary"`), the first color is applied as `background-color` and the second as a `background-image` gradient layer via a registered CSS custom property (`--tasty-second-fill-color`), enabling smooth CSS transitions. Explicit `backgroundImage` or `background` properties override the second color.

- [#975](https://github.com/cube-js/cube-ui-kit/pull/975) [`38152302`](https://github.com/cube-js/cube-ui-kit/commit/38152302f04338fd67084c18fa15b1865583ca1e) Thanks [@tenphi](https://github.com/tenphi)! - Replaced the toast system with a new implementation:

  - **New API**: `useToast()` hook with `toast()`, `toast.success()`, `toast.danger()`, `toast.warning()`, and `toast.note()` methods
  - **Progress toasts**: `useProgressToast()` hook for loading states that persist while `isLoading` is true
  - **Declarative usage**: `<Toast>` and `<Toast.Progress>` components for declarative toast rendering
  - **Default icons**: Each theme now has a predefined icon (can be overridden)
  - **Collapse on hover**: Toasts collapse when hovering the toast area to reveal content behind
  - **Deduplication**: Toasts with the same content are deduplicated automatically

  **Breaking changes:**

  - Removed `useToastsApi` hook - migrate to `useToast`
  - Removed `attention` theme - use `warning` instead
  - Renamed `header` prop to `title`

- [#974](https://github.com/cube-js/cube-ui-kit/pull/974) [`402d5618`](https://github.com/cube-js/cube-ui-kit/commit/402d56186104ebcdbba3841ef1a03804d33e8d5f) Thanks [@tenphi](https://github.com/tenphi)! - Add support for OKHSL color functions in style parsing and fix CSSWriter.add() method.

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
