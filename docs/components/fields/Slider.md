# Slider

<Badge variant="neutral">Form component</Badge>

The Slider component allows users to select a numeric value from a range by dragging a thumb along a track. It provides an intuitive way to input values that fall within a specific range.

## Examples

### With Label

### Without Value Label

### Custom Value Formatting

### Vertical Orientation

### Disabled State

## Properties

## Sub-elements

The Slider component renders the following sub-elements that can be customized via the `styles` prop:

- **SliderControls**: The container for the track and thumb
- **SliderTrackContainer**: The track background and range fill
- **SliderThumb**: The draggable thumb element
- **SliderGradation**: Container for gradation marks
- **SliderGrade**: Individual gradation mark

## Style Properties

The Slider component supports all standard style properties:

`display`, `font`, `preset`, `hide`, `opacity`, `whiteSpace`, `gridArea`, `order`, `gridColumn`, `gridRow`, `placeSelf`, `alignSelf`, `justifySelf`, `zIndex`, `margin`, `inset`, `position`, `width`, `height`, `flexBasis`, `flexGrow`, `flexShrink`, `flex`, `reset`, `padding`, `paddingInline`, `paddingBlock`, `shadow`, `border`, `radius`, `overflow`, `scrollbar`, `outline`, `textAlign`, `color`, `fill`, `fade`, `textTransform`, `fontWeight`, `fontStyle`, `flow`, `placeItems`, `placeContent`, `alignItems`, `alignContent`, `justifyItems`, `justifyContent`, `align`, `justify`, `gap`, `columnGap`, `rowGap`, `gridColumns`, `gridRows`, `gridTemplate`, `gridAreas`

## Accessibility

The Slider component follows WAI-ARIA guidelines:

- Uses appropriate ARIA roles and properties for slider interaction
- Supports keyboard navigation with arrow keys
- Provides clear focus indicators
- Associates labels with the input element
- Includes proper value announcements for screen readers

## Best Practices

- Use descriptive labels that clearly indicate what the slider controls
- Consider providing gradation marks for better value reference
- Set appropriate min, max, and step values for your use case
- Use custom value formatting when the raw numeric value isn't user-friendly
- Consider the orientation based on your layout and user expectations
