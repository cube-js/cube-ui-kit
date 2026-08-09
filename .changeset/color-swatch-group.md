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

`ColorPicker` gains `swatches` and `swatchColumns`, which put a palette under the editor in its popover. The group drops `allowCustom` there — the escape hatch is itself a `ColorPicker`, so offering it inside one would nest popovers without end. That is enforced through context rather than documented, so the recursion cannot be written by hand either.
