---
"@cube-dev/ui-kit": patch
---

`Tabs` can be themed with the caller's own tokens. It now forwards its `tokens` prop, which it dropped before, and its tabs read current tokens: `#surface-text-soft` for a title, `#primary-accent-text` for the active title of a `default` or `narrow` tab, and `#primary-accent-surface` for the selection indicator. Re-declare those through `tabListStyles`, `styles` or `tokens`, and `$font-sans` for the title font, as described under Theming in the `Tabs` docs. Overriding the legacy aliases `#dark-02`, `#primary-text` and `#primary` on a `Tabs` or its ancestors no longer recolors its tabs.
