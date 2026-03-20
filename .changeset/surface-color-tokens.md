---
'@cube-dev/ui-kit': minor
---

Add `#surface`, `#surface-2`, and `#surface-3` for layered backgrounds. `#light` now aliases `#surface-3`. Defaults that used `#dark-bg` (CopySnippet, CopyPasteBlock, disabled theme sample, scrollbar track, Storybook playground) use `#surface-2`. File- and radio-style tab fills use the surface scale instead of `#light` / `#white`. Prefer `#surface-2` over legacy `#dark-bg`; TypeScript named-color augmentation lists the surface tokens and no longer includes `dark-bg`.
