---
"@cube-dev/ui-kit": patch
---

Four places where a style or a size did not do what it said.

`Dialog`, `Modal` and `Tray` fit viewports narrower than ~352px. `$min-dialog-size` was computed from `100vw - 2x` while the components' own max-width uses `100dvw - 8x`; CSS resolves `min-width` after `max-width`, so below the crossover the floor beat the ceiling and every dialog rendered wider than the viewport it sat in — in a 300px pane, 288px inside a 236px box. The token now measures the same box as the max-width, so the two can no longer cross. Apps that overrode the token to order the clamp themselves can drop the override. `Dialog`'s gutter custom properties (`$dialog-padding-h`, `$dialog-content-padding-v` and the header/footer pair) are now documented as a supported contract, for the case where one child should span the full dialog width while its siblings keep the gutter.

A standalone `Checkbox` honours `styles` and can wrap its label. Outside a `CheckboxGroup` the extracted container styles were computed and then never forwarded, so `<Checkbox styles={{ … }}>` was a silent no-op, and children were forced through `<Text nowrap>` — `white-space: nowrap` inherits, so a label of more than a few words could not wrap at all. Both branches now render the label through the same element, so the preset and the validation colour match in and out of a group.

`Item` gains `$prefix-gap` and `$suffix-gap` tokens for the space between those slots and the label. The grid contributes no gap and `Label` drops its own inline padding for any start or end content, so a prefix or suffix renders flush — right for a checkbox, kbd chip or badge, which already carry their own presence, and wrong for a bare glyph, which is the case that looks unspaced next to the same glyph in the `icon` slot. Both tokens default to `0`, so nothing moves until a call site opts in with `styles={{ '$prefix-gap': '1x' }}`. Prefer them over overriding `Prefix` / `Suffix` padding, which silently replaces the state maps that drop the outer gutter next to an icon or an actions run.

`DatePicker`, `DateRangePicker` and `DateRangeSeparatedPicker` apply the container style props and `styles` their types advertise. All three extracted them and dropped the result, forwarding only `wrapperStyles`, so `width="100%"` type-checked, reviewed clean and did nothing. `wrapperStyles` remains the most specific of the three and still wins.
