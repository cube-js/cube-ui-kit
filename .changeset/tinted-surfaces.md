---
'@cube-dev/ui-kit': minor
---

Add `surfaceMode: 'tinted'` and a separate `baseSaturation` seed.

A neutral `surface` sits at the extreme of the tone scale — pure white in light — and chroma needs distance from the extreme to exist at all, so on a light page the surface was white whatever saturation the palette carried. `surfaceMode: 'tinted'` moves the whole surface ramp two tones inward, which is the room the base hue needs to land on the page itself:

```ts
setPaletteConfig({ surfaceMode: 'tinted', baseSaturation: 25 });
```

Everything below `surface` is positioned relative to it, so the ladder, the borders and the text ramp follow, and the text's `['AA','AAA']` floors re-solve against the new background rather than drifting. The `code-*` family's mirrored surface tracks it too — it exists to be the page.

The **tinted** surfaces move with it as well. A status theme's `surface`, and a runtime tint's from `getColorTheme()`, is an offset from the page's rather than an absolute tone — and that offset is exactly the two tones `tinted` shifts by, so anchored absolutely they would land on the page's own new tone and a `note` banner would stop reading as a banner. They keep their separation in both schemes, and pick up a little more chroma for being further from the extreme.

`baseSaturation` is the base zone's own saturation seed, opening the same seam `baseHue` already opens: the chrome is the one family whose job is *not* to look like the brand. It is on the same 0–100 scale as `saturation`, and **the shipped chrome is `12`**, so the interesting range is the low end; the base colors keep their proportions to one another until the highest of them saturates around `25`.

- Left unset it is `0.12` — `surface`'s own factor — of whatever the accent zone carries, so an untouched palette resolves exactly as before and a muted `saturation` still mutes the chrome.
- Unlike `saturation`, writing it does **not** turn `pastel` off: how much hue the chrome carries says nothing about which chroma space the palette is in.

Both are shipped defaults-off: `surfaceMode` defaults to `'default'`, and the resolved palette is unchanged token for token.
