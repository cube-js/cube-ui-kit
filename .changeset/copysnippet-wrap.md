---
'@cube-dev/ui-kit': minor
---

`CopySnippet` takes a `wrap` prop that soft-wraps long content instead of scrolling it sideways.

By default a `CopySnippet` keeps each line on one line and scrolls horizontally, which buries long error messages and logs off to the right. `wrap` lays the content out on multiple lines instead: the block grows vertically to fit — so even a single very long line is fully readable rather than clamped to the collapsed height — and unbreakable runs like URLs, tokens and identifiers break too (`overflow-wrap: anywhere`), not just spaces.

```jsx
<CopySnippet code={longErrorMessage} language="bash" wrap />
```

It has no effect when `nowrap` is set (that still forces a single scrolling line), and the copy button and syntax highlighting are unchanged. The `wrap` container style inherited from `Card` (`flex-wrap`, meaningless on this grid-based component) is no longer part of the public props.
