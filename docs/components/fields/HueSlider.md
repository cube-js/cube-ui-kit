# HueSlider

<Badge variant="neutral">Form component</Badge>

The HueSlider component allows users to select a hue value (0-359 degrees) from the color wheel. It displays a rainbow gradient track using the okhsl color space and dynamically colors the thumb to match the selected hue.

## When to Use

- When building a color picker that needs hue selection
- When users need to choose a color from the full spectrum
- When you want a visual representation of hue values

## Component

---

### Properties

- **`value`** `number` — The hue value in controlled mode (0-359)
- **`defaultValue`** `number` (default: `0`) — The default hue value in uncontrolled mode (0-359)
- **`orientation`** `'horizontal' | 'vertical'` (default: `horizontal`) — The orientation of the slider
- **`showValueLabel`** `boolean` (default: `true`) — Whether to show the current value label
- **`getValueLabel`** — Function to format the value label
- **`onChange`** `function` — Callback fired when the hue value changes
- **`onChangeEnd`** `function` — Callback fired when the slider interaction ends
- **`labelPosition`** `'top' | 'side'` (default: `top`) — The position of the label relative to the input
- **`styles`** `object` — Custom styles object for styling the component and sub-elements

### Base Properties

Supports [Base properties](../../BaseProperties.md)

### Field Properties

Supports all [Field properties](../../FieldProperties.md)

### Styling Properties

#### styles

Customizes the root element of the component.

**Sub-elements:**

- `SliderControls` - The container for the track and thumb
- `SliderTrackContainer` - The track background with rainbow gradient
- `SliderThumb` - The draggable thumb element (colored to match current hue)

#### trackStyles

Customizes the track element. The default displays a rainbow gradient.

#### thumbStyles

Customizes the thumb element. The default fills with the current hue color.

### Style Properties

These properties allow direct style application without using the `styles` prop: `width`, `height`.

### Modifiers

The `mods` property accepts the following modifiers you can override:

- **`horizontal`** `boolean` — Whether the slider is horizontal (default) or vertical
- **`disabled`** `boolean` — Whether the slider is disabled

## Examples

### Basic Usage

```jsx
<HueSlider defaultValue={180} />
```

### With Label

```jsx
<HueSlider label="Hue" defaultValue={180} />
```

### Custom Value Formatting

```jsx
<HueSlider 
  label="Hue" 
  defaultValue={180}
  getValueLabel={(val) => `${val}°`}
/>
```

### Controlled Mode

```jsx
function ColorPicker() {
  const [hue, setHue] = useState(0);

  return (
    <HueSlider
      label="Hue"
      value={hue}
      onChange={setHue}
      getValueLabel={(val) => `${val}°`}
    />
  );
}
```

### Disabled State

```jsx
<HueSlider label="Disabled Hue" isDisabled />
```

### Vertical Orientation

```jsx
<HueSlider 
  orientation="vertical" 
  fieldStyles={{ height: '200px' }} 
/>
```

## Accessibility

### Keyboard Navigation

- `Tab` - Moves focus to the slider
- `Arrow Left/Down` - Decreases the hue value
- `Arrow Right/Up` - Increases the hue value
- `Home` - Sets value to minimum (0)
- `End` - Sets value to maximum (359)

### Screen Reader Support

- Announces as a slider with current value
- Value changes are announced to screen readers
- Labels are properly associated with the slider input

### ARIA Properties

- `aria-label` - Provides accessible label when no visible label exists
- `aria-valuemin` - Set to 0
- `aria-valuemax` - Set to 359
- `aria-valuenow` - Current hue value

## Best Practices

1. **Do**: Provide a label for clarity

```jsx
<HueSlider label="Select Hue" />
```

2. **Don't**: Use without context in a color picker

```jsx
{/* Missing label makes it unclear what the slider controls */}
<HueSlider />
```

3. **Accessibility**: Use `getValueLabel` to provide meaningful value descriptions

```jsx
<HueSlider getValueLabel={(val) => `${val} degrees`} />
```

## Integration with Forms

This component supports all [Field properties](../../FieldProperties.md) when used within a Form.

## Related Components

- [Slider](./Slider.md) - Base numeric slider component
- RangeSlider - For selecting a range of values
