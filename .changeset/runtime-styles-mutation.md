---
'@cube-dev/ui-kit': patch
---

`GridProvider` sets its grid custom properties through `tokens`, so a container resize updates them inline instead of generating a new class for every measured width. Its `width`, `initialWidth` and `gap` props now take a single value (`string | number`): a state map, such as a responsive `gap`, is no longer accepted, since `tokens` take one value. A number now means pixels, where it used to produce a unitless value that broke the column width.
