---
'@cube-dev/ui-kit': minor
---

**Breaking:** rename `ColorPicker` to `ColorInput`, and give the `ColorPicker` name to a new trigger-only component.

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
