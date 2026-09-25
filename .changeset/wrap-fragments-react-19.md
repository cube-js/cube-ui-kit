---
"@cube-dev/ui-kit": patch
---

Under React 19, a fragment passed as `Result`'s `title` or `subtitle`, or as a field's `description`, is wrapped like any other mixed content again: `Result` renders it in its heading styles instead of as bare text. The check that tells a fragment from a single element used `react-is@18`, which does not recognise React 19 elements, so every fragment was taken for a single element and left unwrapped.
