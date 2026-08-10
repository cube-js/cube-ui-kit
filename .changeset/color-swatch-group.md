---
'@cube-dev/ui-kit': minor
---

Add `ColorSwatchGroup` — a grid of color swatches, one of which can be selected. It is the palette half of choosing a color, where `ColorPicker` is the freeform half.

Colors go in as data rather than as children, so the API reads like `Picker` rather than `RadioGroup`, though a radio group is what it is underneath: one tab stop, arrow keys between swatches.

```jsx
<ColorSwatchGroup
  label="Brand color"
  colors={['#7a4dbf', '#26fcb2', { color: '#ff0000', label: 'Danger' }]}
  columns={4}
  value={color}
  onChange={setColor}
/>
```

Swatches are keyed by their canonical hex, so the same color written two ways collapses into one entry — equivalent colors would otherwise make selection ambiguous. That same matching decides which swatch a value selects, so `value` need not use the notation the swatch was written in.

`allowCustom` appends a `ColorPicker` for colors outside the set, showing the current color whenever it is not one of the swatches.

`ColorSwatch` is exported too, for showing a color without a control around it. It takes direct style props, so `<ColorSwatch color="#7a4dbf" radius="round" />` works. `ColorSwatchGroup` and `ColorPicker` both accept the outer and block style props, so `radius`, `border`, `padding` and `shadow` apply directly.

The selected swatch is marked the way React Aria marks it: two rings drawn *inside* the swatch, one in `#surface-text` and one in `#surface`. A single ring in one color vanishes against a swatch of that color — an accent ring on an accent-colored swatch — while two tones that flip with the color scheme contrast against anything, and drawing them inset keeps the swatch's footprint fixed.

`ColorPicker` gains `swatches` and `swatchColumns`, which put a palette under the editor in its popover. The group drops `allowCustom` there — the escape hatch is itself a `ColorPicker`, so offering it inside one would nest popovers without end. That is enforced through context rather than documented, so the recursion cannot be written by hand either.
