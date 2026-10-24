---
'@cube-dev/ui-kit': patch
---

`GridProvider` sets its grid custom properties through `tokens`, so a container resize updates them inline instead of generating a new class for every measured width. Its `width`, `initialWidth` and `gap` props now take a single value (`string | number`): a state map, such as a responsive `gap`, is no longer accepted, since `tokens` take one value. A number now means pixels, and the default `gap` is `0` pixels instead of `'0'`. A unitless value makes `--column-width` invalid, so a string needs a unit (`'8px'`, `'1x'`).

`Radio`'s `labelStyles`, `InlineInput`'s `inputStyles`, the `resize` prop of `TextInput` and `TextArea`, and `Icon`'s `size` and `stroke` are now merged with `mergeStyles` instead of an object spread. A state map without a `''` key now extends the map it is merged over (`Radio`'s default label styles, or the same property in `styles`) instead of replacing it. `Panel` now sends its inner style props (`padding`, `gap`, `fill`, …) to the inner element even when the value is falsy, such as `padding={0}`; before, a falsy value went to the outer element.
