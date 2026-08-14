---
'@cube-dev/ui-kit': minor
---

`ColorSwatch` is a component of its own, with sizes and automatic fitting.

It was already exported — as an implementation detail of the color fields, with no size of its own and no docs. It now lives in `src/components/fields/ColorSwatch/`, ships stories and documentation, and takes a `size`:

```jsx
<ColorSwatch color="#7a4dbf" />              // tracks the control around it
<ColorSwatch color="#7a4dbf" size="large" /> // 28px
```

- **`size`** — `small` / `medium` / `large` = `20px` / `24px` / `28px`.
- **Left unset, the swatch sizes itself to its host.** `Item`, `Button` and the text inputs publish their height as the `$size` custom property, so a swatch in an `icon`, `rightIcon`, `prefix` or `suffix` slot lands `8px` inside it — `20px` in a `small` control, `24px` in a `medium` one, `32px` in a `large` one — with nothing passed between the two. Outside a control it falls back to `medium`.

Two visible consequences: a `ColorPicker` trigger's swatch now grows and shrinks with the trigger instead of sitting at a fixed `20px`, and `ColorInput` pins its swatch to the named size (a text input hangs its prefix off the border with no padding of its own, so the automatic fit would have a large field's swatch touching the edge).

The import path `@cube-dev/ui-kit` is unchanged.
