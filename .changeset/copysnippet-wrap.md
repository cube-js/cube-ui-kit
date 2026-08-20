---
'@cube-dev/ui-kit': minor
---

`CopySnippet` takes an `isWrapped` prop that soft-wraps long content instead of scrolling it sideways.

By default a `CopySnippet` keeps each line on one line and scrolls horizontally, which buries long error messages and logs off to the right. `isWrapped` lays the content out on multiple lines instead: the block grows vertically to fit — so even a single very long line is fully readable rather than clamped to the collapsed height — and unbreakable runs like URLs, tokens and identifiers break too (`overflow-wrap: anywhere`), not just spaces.

```jsx
<CopySnippet code={longErrorMessage} language="bash" isWrapped />
```

It is a different axis from `nowrap` — `nowrap` collapses real newlines into one scrolling line, `isWrapped` breaks long lines — and `nowrap` wins when both are set. The copy button and syntax highlighting are unchanged.
