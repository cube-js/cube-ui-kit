---
'@cube-dev/ui-kit': patch
---

`GridProvider` sets its grid custom properties through `tokens`, so a container resize updates them inline instead of generating a new class for every measured width. Its `width`, `initialWidth` and `gap` props now take a single value (`string | number`) instead of a style value that could be a state map, which those custom properties never supported.
