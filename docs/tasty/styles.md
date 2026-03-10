# Style Properties Reference

All standard CSS properties are supported in Tasty and benefit from its syntax sugar: design tokens (`$name`, `#name`), custom units (`2x`, `1r`, `1bw`), color opacity (`#purple.5`), auto-calc (`(100% - 2x)`), and custom functions. Values are parsed through the Tasty engine automatically.

The properties documented below have **custom handlers** with enhanced syntax. They should be **preferred** over their raw CSS equivalents because they:

- Provide concise, declarative syntax for common patterns
- Simplify overrides when extending components
- Keep style definitions predictable and composable

Other CSS properties (e.g. `opacity`, `transform`, `cursor`, `position`, `zIndex`) are passed through with standard Tasty value parsing but no special handler logic.

---

## Recommended Props

Use these instead of their raw CSS counterparts:

| Use | Instead of |
|-----|------------|
| `fill` | `backgroundColor`, `background` |
| `image` | `backgroundImage` |
| `padding` (with direction modifiers) | `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft` |
| `margin` (with direction modifiers) | `marginTop`, `marginRight`, `marginBottom`, `marginLeft` |
| `width` (with `min`/`max` modifiers) | `minWidth`, `maxWidth` |
| `height` (with `min`/`max` modifiers) | `minHeight`, `maxHeight` |
| `border` | `borderColor`, `borderWidth`, `borderStyle` |
| `radius` | `borderRadius` |
| `flow` | `flexDirection`, `gridAutoFlow` |
| `preset` | `fontSize`, `lineHeight`, `letterSpacing`, `fontWeight`, `fontStyle`, `textTransform` |
| `font` | `fontFamily` |
| `inset` (with direction modifiers) | `top`, `right`, `bottom`, `left` |
| `scrollbar` | Raw scrollbar CSS properties |

---

## Layout

### `display`

Standard CSS display values. Handled together with `hide`, `textOverflow`, `overflow`, and `whiteSpace` for priority resolution.

| Prop | Values | Notes |
|------|--------|-------|
| `display` | Any CSS display value | Overridden by `hide` or multi-line `textOverflow` |
| `hide` | `true` / `false` | Shortcut for `display: none`. Highest priority |
| `overflow` | Any CSS overflow value | Overridden when `textOverflow` sets `hidden` |
| `whiteSpace` | Any CSS white-space value | Overridden when `textOverflow` sets `nowrap` or `initial` |

### `textOverflow`

Text truncation with optional multi-line clamping.

**Syntax:** `[ellipsis|clip]` or `[ellipsis|clip] / [lines]`

| Value | Effect |
|-------|--------|
| `"ellipsis"` | Single-line truncation with ellipsis, sets `overflow: hidden` and `white-space: nowrap` |
| `"ellipsis / 3"` | Multi-line clamp (3 lines) with ellipsis, sets `overflow: hidden` and `white-space: initial` |
| `"clip"` | Single-line truncation without ellipsis, sets `overflow: hidden` and `white-space: nowrap` |
| `"clip / 2"` | Multi-line clip (2 lines), sets `overflow: hidden` and `white-space: initial` |
| `true` or `"initial"` | Reset text-overflow to initial |

Explicit `whiteSpace` overrides the default white-space set by `textOverflow`.

### `flow`

Unified direction control for flex and grid layouts.

**Syntax:** `[direction] [wrap|dense]`

| Layout | CSS output |
|--------|------------|
| Flex | `flex-flow` (direction + wrap) |
| Grid | `grid-auto-flow` (direction + density) |
| Block | No CSS output (used by `gap` for direction) |

```jsx
flow="row wrap"       // flex: row wrap
flow="column dense"   // grid: column dense
flow="column"         // flex: column; or grid: column
```

### `gap`

Spacing between child elements. Adapts to layout type.

**Syntax:** `[row-gap]` or `[row-gap column-gap]`

| Value | Effect |
|-------|--------|
| `"2x"` | Gap of `2x` |
| `"1x 2x"` | Row gap `1x`, column gap `2x` |
| `true` | Default gap (`1x`) |
| Number | Converted to `px` |

For flex/grid layouts, outputs native `gap`. For block layouts, emulates gap using `margin` on children based on `flow` direction.

### `padding`

Element padding with directional modifiers and multi-group support. Use **comma-separated groups** to set a base value and then override specific directions.

**Syntax:** `[value]` | `[top right]` | `[top right bottom left]` | `[value directions...]` — comma-separated for multiple groups

**Direction modifiers:** `top`, `right`, `bottom`, `left`

| Value | Effect |
|-------|--------|
| `"2x"` | All sides `2x` |
| `"2x 1x"` | Top/bottom `2x`, left/right `1x` |
| `"2x top"` | Top `2x`, right/bottom/left `0` |
| `"1x left right"` | Left and right `1x`, top/bottom `0` |
| `"1x, 2x top"` | All sides `1x`, then top overridden to `2x` |
| `"1x, 2x top bottom"` | Left/right `1x`, top/bottom `2x` |
| `true` | All sides `1x` |
| Number | Converted to `px` |

Later comma-separated groups override earlier groups for conflicting directions.

Individual props `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `paddingBlock`, `paddingInline` are supported but `padding` with modifiers is recommended.

**Priority:** `padding` < `paddingBlock`/`paddingInline` < `paddingTop`/`paddingRight`/`paddingBottom`/`paddingLeft`

### `margin`

Element margin. Same syntax, modifiers, and multi-group support as `padding`.

**Syntax:** `[value]` | `[top right]` | `[top right bottom left]` | `[value directions...]` — comma-separated for multiple groups

**Direction modifiers:** `top`, `right`, `bottom`, `left`

| Value | Effect |
|-------|--------|
| `"2x"` | All sides `2x` |
| `"2x 1x"` | Top/bottom `2x`, left/right `1x` |
| `"2x top"` | Top `2x`, right/bottom/left `0` |
| `"auto left right, 1x top bottom"` | Left/right `auto`, top/bottom `1x` |
| `true` | All sides `1x` |
| Number | Converted to `px` |

Later comma-separated groups override earlier groups for conflicting directions.

Individual props `marginTop`, `marginRight`, `marginBottom`, `marginLeft`, `marginBlock`, `marginInline` are supported but `margin` with modifiers is recommended.

**Priority:** `margin` < `marginBlock`/`marginInline` < `marginTop`/`marginRight`/`marginBottom`/`marginLeft`

### `width`

Element width with min/max control.

**Syntax:** `[value]` | `[min max]` | `[min value max]` | `[modifier value]`

**Modifiers:** `min`, `max`, `fixed`

**Keywords:** `stretch`, `max-content`, `min-content`, `fit-content`

| Value | Effect |
|-------|--------|
| `"10x"` | Width `10x`, min `initial`, max `initial` |
| `"1x 10x"` | Width `auto`, min `1x`, max `10x` |
| `"1x 5x 10x"` | Min `1x`, width `5x`, max `10x` |
| `"min 2x"` | Min-width `2x`, width `auto`, max `initial` |
| `"max 100%"` | Max-width `100%`, width `auto`, min `initial` |
| `"fixed 200px"` | Min, width, and max all set to `200px` |
| `"stretch"` | Fill available space (cross-browser) |
| `true` | Width `auto`, min `initial`, max `initial` |
| Number | Converted to `px` |

Separate `minWidth` and `maxWidth` props are supported and override values from the `width` syntax.

### `height`

Element height. Same syntax and modifiers as `width`.

**Syntax:** `[value]` | `[min max]` | `[min value max]` | `[modifier value]`

**Modifiers:** `min`, `max`, `fixed`

**Keywords:** `max-content`, `min-content`, `fit-content`

Separate `minHeight` and `maxHeight` props are supported and override values from the `height` syntax.

### `inset`

Positioning offsets with directional modifiers and multi-group support. Same directional syntax as `padding`.

**Syntax:** `[value]` | `[top right]` | `[top right bottom left]` | `[value directions...]` — comma-separated for multiple groups

**Direction modifiers:** `top`, `right`, `bottom`, `left`

| Value | Effect |
|-------|--------|
| `"0"` | All sides `0` |
| `"2x top"` | Top `2x`, right/bottom/left `auto` |
| `"1x left right"` | Left and right `1x`, top/bottom `auto` |
| `"0, 2x top"` | All sides `0`, then top overridden to `2x` |
| `true` | All sides `0` |

Later comma-separated groups override earlier groups for conflicting directions.

Individual props `top`, `right`, `bottom`, `left`, `insetBlock`, `insetInline` are supported. When only individual direction props are used (without `inset`), individual CSS properties are output for correct cascade behavior with state overrides.

**Priority:** `inset` < `insetBlock`/`insetInline` < `top`/`right`/`bottom`/`left`

---

## Color & Background

### `fill`

Background color with design token support. Preferred over `backgroundColor` and `background`.

**Syntax:** `[color]` or `[base-color] [overlay-color]`

| Value | Effect |
|-------|--------|
| `"#purple"` | Token-based background color |
| `"#purple.10"` | Token color at 10% opacity |
| `"#surface #primary.10"` | Background `#surface` with `#primary.10` overlay (two colors enable smooth transitions between both) |
| `"rgb(255 128 0)"` | CSS color value |
| `true` | Default fill color |

When two colors are provided, the first sets the background color and the second is applied as an overlay gradient layer. This enables independent CSS transitions on each color. The overlay is only applied when no explicit `image` or `backgroundImage` is set.

**Related deprecated props:** `backgroundColor` (use `fill`), `background` (overrides all background props when set — avoid).

### `image`

Background image. Preferred over `backgroundImage`.

**Syntax:** Any CSS background-image value (parsed for token support).

```jsx
image="url(/path/to/image.png)"
image="linear-gradient(to right, #purple, #danger)"
```

Other background props (`backgroundPosition`, `backgroundSize`, `backgroundRepeat`, `backgroundAttachment`, `backgroundOrigin`, `backgroundClip`) are supported as separate props with standard Tasty value parsing.

### `color`

Text color with design token support.

**Syntax:** Color token, CSS color, `true`, or fallback syntax

| Value | Effect |
|-------|--------|
| `"#purple"` | Token-based text color |
| `"#purple.5"` | Token at 50% opacity |
| `"#current"` | Current inherited color |
| `"#current.5"` | Current inherited color at 50% opacity |
| `"(#primary, #secondary)"` | Fallback: use `#primary`, fall back to `#secondary` |
| `true` | `currentColor` |

When set to a named color token, also sets `$current-color` and `$current-color-rgb` custom properties for downstream use.

### `svgFill`

SVG fill color. Same color token syntax as `fill` and `color`. Outputs the native CSS `fill` property.

```jsx
svgFill="#purple.10"
svgFill="currentColor"
```

---

## Border & Outline

### `border`

Border shorthand with directional and multi-group support. Use **comma-separated groups** to set different values per direction — this is the recommended approach for directional borders.

**Syntax:** `[width] [style] [color] [directions...]` — comma-separated for multiple groups

**Defaults:** width = `1bw`, style = `solid`, color = `#border`

**Styles:** `none`, `hidden`, `dotted`, `dashed`, `solid`, `double`, `groove`, `ridge`, `inset`, `outset`

**Direction modifiers:** `top`, `right`, `bottom`, `left`

| Value | Effect |
|-------|--------|
| `true` | Default border (`1bw solid #border`) on all sides |
| `"2bw dashed #purple"` | All sides: 2bw dashed purple |
| `"2bw top"` | Top only: 2bw solid `#border`, others: 0 |
| `"dotted #danger left right"` | Left/right: 1bw dotted `#danger`, others: 0 |
| `"1bw #red, 2bw #blue top"` | All sides: 1bw solid `#red`, top overridden to 2bw solid `#blue` |
| `"1bw, dashed top bottom, #purple left right"` | Base: 1bw solid `#border`, top/bottom: 1bw dashed `#border`, left/right: 1bw solid `#purple` |

Later comma-separated groups override earlier groups for conflicting directions.

### `radius`

Border radius with shape presets and directional modifiers.

**Syntax:** `[value] [modifiers...]` | `[shape]` | `true`

**Shapes:**

| Shape | Effect |
|-------|--------|
| `"round"` | Fully rounded (`9999rem`) |
| `"ellipse"` | Circular (`50%`) |
| `"leaf"` | Asymmetric: sharp, round, sharp, round |
| `"backleaf"` | Asymmetric: round, sharp, round, sharp |

**Direction modifiers:** `top`, `right`, `bottom`, `left` — rounds only the specified corners.

| Value | Effect |
|-------|--------|
| `"2r"` | All corners `2r` |
| `true` | All corners `1r` |
| `"round"` | All corners `9999rem` (pill shape) |
| `"1r top"` | Top-left and top-right `1r`, bottom-left and bottom-right `0` |
| `"leaf"` | Alternating sharp/round corners (top-left `0`, top-right `1r`, bottom-right `0`, bottom-left `1r`) |
| `"backleaf"` | Inverse leaf (top-left `1r`, top-right `0`, bottom-right `1r`, bottom-left `0`) |

### `outline`

Outline with inline offset support.

**Syntax:** `[width] [style] [color] / [offset]`

**Defaults:** width = `1ow`, style = `solid`, color = `#outline`

**Styles:** Same as `border` (`none`, `dotted`, `dashed`, `solid`, etc.)

| Value | Effect |
|-------|--------|
| `true` | Default outline (`1ow solid #outline`) |
| `"2ow dashed #purple"` | 2ow dashed `#purple` outline |
| `"2ow #danger / 1x"` | 2ow solid `#danger` outline with 1x offset |
| `"2ow / 1x"` | 2ow solid `#outline` with 1x offset |
| `0` | No outline |

The `/` separator separates outline from offset. A separate `outlineOffset` prop is also supported but the slash syntax takes precedence.

### `shadow`

Box shadow. Supports multiple shadows comma-separated.

**Syntax:** `[inset] [x] [y] [blur] [spread] [color]`

| Value | Effect |
|-------|--------|
| `true` | Default shadow (from `$shadow` token) |
| `"1x .5x .5x #dark.50"` | Custom shadow with Tasty units/colors |
| `"0 1x 2x #dark.20"` | Standard shadow |
| `"inset 0 1x 2x #dark.10"` | Inset shadow |

Multiple shadows: `shadow="1x 1x 2x #dark.20, inset 0 0 4x #dark.10"`

---

## Typography

### `preset`

Typography preset that sets font-size, line-height, letter-spacing, font-weight, font-style, and text-transform from named design tokens.

**Syntax:** `[name] [modifiers...]`

Preset names are project-specific (e.g. `h1`–`h6`, `t1`–`t4`, `p1`–`p4`). Register them for autocomplete by augmenting `TastyPresetNames`.

**Modifiers:**

| Modifier | Effect |
|----------|--------|
| `strong` | Sets `font-weight` to bold (from `$bold-font-weight` token) |
| `italic` | Sets `font-style: italic` |
| `icon` | Sets font-size and line-height to icon size |
| `tight` | Sets line-height equal to font-size |

```jsx
preset="h1"           // heading 1
preset="h2 strong"    // bold heading 2
preset="t3 italic"    // italic text 3
preset="t2 tight"     // text 2 with tight line-height
```

Individual typography props (`fontSize`, `lineHeight`, `letterSpacing`, `fontWeight`, `fontStyle`, `textTransform`) can be used alongside `preset` to override specific values, but using `preset` alone is recommended.

### `font`

Font family with design-system fallback. Preferred over `fontFamily`.

| Value | Effect |
|-------|--------|
| `"monospace"` | Monospace font stack (from `$monospace-font` token) |
| `true` | Default system font (from `$font` token) |
| `"CustomFont"` | Custom font with system font fallback |

`fontFamily` is supported as a direct pass-through without fallback logic.

---

## Alignment

Use the individual CSS properties (`alignItems`, `alignContent`, `justifyItems`, `justifyContent`, `placeItems`, `placeContent`) for precise control. The shorthands below set both the `-items` and `-content` variants to the same value, which is convenient but less flexible.

### `align`

Shorthand that sets both `align-items` and `align-content` to the same value.

```jsx
align="center"
align="flex-start"
align="space-between"
```

### `justify`

Shorthand that sets both `justify-items` and `justify-content` to the same value.

```jsx
justify="center"
justify="space-between"
justify="flex-end"
```

### `place`

Shorthand that sets both `place-items` and `place-content` to the same value.

```jsx
place="center"
place="stretch"
```

Individual props `placeContent` and `placeItems` are also available for separate control.

---

## Animation & Transition

### `transition`

Semantic transition names that expand to groups of CSS properties.

**Syntax:** `[name] [timing] [easing] [delay]` or `[name] [easing] [delay]` — comma-separated for multiple transitions.

When easing is provided without a duration, the default timing variable is used automatically.

**Semantic names:**

| Name | CSS properties |
|------|---------------|
| `fill` | `background-color`, `background-image`, `--tasty-second-fill-color` |
| `color` | `color` |
| `theme` | `color`, `background-color`, `background-image`, `box-shadow`, `border`, `border-radius`, `outline`, `opacity`, `--tasty-second-fill-color` |
| `border` | `border`, `border-top`, `border-right`, `border-bottom`, `border-left` |
| `radius` | `border-radius` |
| `shadow` | `box-shadow` |
| `outline` | `outline`, `outline-offset` |
| `preset` | `font-size`, `line-height`, `letter-spacing`, `font-weight`, `font-style` |
| `text` | `font-weight`, `text-decoration-color` |
| `fade` | `mask`, `mask-composite` |
| `opacity` | `opacity` |
| `translate` | `transform`, `translate` |
| `rotate` | `transform`, `rotate` |
| `scale` | `transform`, `scale` |
| `filter` | `filter`, `backdrop-filter` |
| `image` / `background` | All background-related properties |
| `width` | `width`, `min-width`, `max-width` |
| `height` | `height`, `min-height`, `max-height` |
| `gap` | `gap`, `margin` |
| `zIndex` | `z-index` |
| `inset` | `inset`, `top`, `right`, `bottom`, `left` |

Default timing: `$transition` (or `${name}-transition` with `$transition` fallback per semantic name).

```jsx
transition="theme 0.3s"
transition="fill 0.2s, radius 0.3s"
transition="fade 0.15s ease-in"
transition="fill ease-in"           // easing without duration (uses default timing)
transition="radius ease-in-out"     // easing keyword only
transition="$$custom-prop 0.3s"     // custom property transition
```

**Recognized easing keywords:** `ease`, `ease-in`, `ease-out`, `ease-in-out`, `linear`, `step-start`, `step-end`. CSS easing functions (`cubic-bezier(...)`, `steps(...)`, `linear(...)`) are also recognized.

If the name is not a semantic name, it is used as a literal CSS property name.

---

## Scrollbar & Overflow

### `scrollbar`

Cross-browser scrollbar styling. Sets Firefox (`scrollbar-width`, `scrollbar-color`) and WebKit (`::-webkit-scrollbar` pseudo-elements) properties.

**Syntax:** `[modifiers...] [size] [thumb-color] [track-color] [corner-color]`

**Modifiers:**

| Modifier | Effect |
|----------|--------|
| `thin` | Thin scrollbar (`scrollbar-width: thin`) |
| `none` | Hide scrollbar (still scrollable) |
| `auto` | Browser-default scrollbar width |
| `stable` | Reserve space for scrollbar (`scrollbar-gutter: stable`) |
| `both-edges` | Reserve space on both sides (`scrollbar-gutter: stable both-edges`) |
| `always` | Force scrollbars visible (`overflow: scroll` + `scrollbar-gutter: stable`) |
| `styled` | Enhanced appearance with rounded thumb, transitions, and custom sizing |

**Colors:** Up to 3 color values for thumb, track, and corner (optional).

**Defaults:** size = `8px`, thumb = `$scrollbar-thumb-color`, track = `transparent`, corner = same as track

| Value | Effect |
|-------|--------|
| `true` | Thin scrollbar with default thumb/track colors |
| `"none"` | Hidden scrollbar (still scrollable) |
| `"thin 10px #purple.40 #dark.04"` | Thin, 10px, thumb `#purple.40`, track `#dark.04` |
| `"styled 12px #purple.40 #dark.04 #white.10"` | Styled, 12px, thumb `#purple.40`, track `#dark.04`, corner `#white.10` |
| `"always 8px #primary.50 #white.02"` | Always visible, 8px, thumb `#primary.50`, track `#white.02` |

### `fade`

Gradient-based edge fading using CSS masks. Use **comma-separated groups** to set different widths and colors per direction.

**Syntax:** `[width] [directions...] [#from-color] [#to-color]` — comma-separated for multiple groups

**Direction modifiers:** `top`, `right`, `bottom`, `left`

| Value | Effect |
|-------|--------|
| `"top"` | Fade top edge, default width (`2x`), all other edges unfaded |
| `"2x left right"` | Fade left and right edges with `2x` width, top/bottom unfaded |
| `"3x 1x top bottom"` | Fade top with `3x` width, bottom with `1x` width |
| `"2x #transparent #dark"` | All edges faded with `2x` width, from `#transparent` to `#dark` |
| `"top #a #b, bottom #c #d"` | Top fades from `#a` to `#b`, bottom fades from `#c` to `#d` |

Colors are optional: first = transparent mask start, second = opaque mask end.

---

## Grid Aliases

### `gridColumns`

Alias for `grid-template-columns`.

| Value | Effect |
|-------|--------|
| `"1fr 2fr 1fr"` | Three columns with ratios |
| `3` (number) | Three equal `minmax(1px, 1fr)` columns |
| `"repeat(auto-fit, minmax(200px, 1fr))"` | Responsive columns |

### `gridRows`

Alias for `grid-template-rows`.

| Value | Effect |
|-------|--------|
| `"auto 1fr auto"` | Header, content, footer |
| `4` (number) | Four equal `auto` rows |

### `gridAreas`

Alias for `grid-template-areas`. Pass-through string value.

### `gridTemplate`

Alias for `grid-template`. Slash-separated rows/columns with number conversion.
