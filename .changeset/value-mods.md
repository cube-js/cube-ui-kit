---
'@cube-dev/ui-kit': major
---

**BREAKING:** Boolean mods now generate `data-*` instead of `data-is-*` attributes (`mods={{ hovered: true }}` → `data-hovered=""` instead of `data-is-hovered=""`).

**NEW:** Value mods support - `mods` now accepts string values (`mods={{ theme: 'danger' }}` → `data-theme="danger"`). Includes shorthand syntax in styles (`theme=danger`, `theme="danger"`). See Tasty documentation for details.
