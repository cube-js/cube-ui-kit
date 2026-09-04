---
'@cube-dev/ui-kit': minor
---

New: `toLegacyColor()` — converts a color literal, most usefully the `oklch(...)` every color token resolves to, into a hex or `rgba()` string a third-party parser will actually accept.

`resolveTokenValue()` hands back the token's computed value, and since Glaze that is always `oklch(...)`. A large class of consumers validates colors against "HEX, `rgb()`, or `hsl()`" and **silently drops** anything else: Stripe's Appearance API falls back to its own light theme, `d3-color` (so Vega) throws, mapbox-gl rejects even an `#rrggbbaa` tail. Nothing warns, and a round trip through the DOM does not normalize it — Chrome serializes `oklch` back as `oklch` — so until now each consumer wrote its own regex plus the polar→cartesian→OKHSL→sRGB math, and its own alpha handling.

```ts
toLegacyColor(resolveTokenValue('#purple')); // '#6b53e4'
toLegacyColor('oklch(0.55 0.21 285 / 0.4)'); // 'rgba(107, 83, 228, 0.4)'
toLegacyColor('oklch(0.55 0.21 285 / 0.4)', { alpha: 'hex' }); // '#6b53e466'
```

An opaque color is always `#rrggbb`; `alpha` picks the translucent form, since the acceptable one differs per consumer (`'rgba'`, the default, is the widest; `'hex'` gives the `#rrggbbaa` Vega and CSS prefer and mapbox-gl drops). It accepts `null` so it composes with `resolveTokenValue()` without a null check, and reads `oklch()`, `okhsl()`, `okhst()`, `rgb()`, `hsl()`, hex (3/4/6/8 digits) and `transparent`, in either the slash or the legacy comma alpha syntax — including the components a hand-rolled regex misses: a negative hue, any angle unit, scientific notation, a `none` component. An out-of-gamut chroma is clipped to the gamut boundary. A value whose meaning only exists inside a CSS engine — `color-mix()`, relative syntax (`oklch(from …)`), a bare `var()` — returns `fallback ?? null` rather than passing through, because handing it back unchanged is precisely what makes a consumer drop the color.

The color-literal grammar behind it is now shared with the color fields' own parser rather than duplicated, so `ColorInput` / `ColorPicker` additionally accept `none` components and `rad` / `grad` / `turn` hue units, and no longer read an angle where a plain number belongs.
