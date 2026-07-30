---
'@cube-dev/ui-kit': major
---

**Breaking:** remove `CloudLogo`. It shipped the previous brand artwork with hard-coded hexes (`#ff6492`, `#141446`, `#7a77ff`, `#a14474`) and the retired "Cube Cloud" wordmark, so it could neither adapt to a colour scheme nor be recoloured.

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
