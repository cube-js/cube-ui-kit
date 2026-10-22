---
'@cube-dev/ui-kit': patch
---

Add two duration tokens: `$overlay-transition` (`250ms`), for a modal, tray or underlay entering and leaving, and `$scrollbar-transition` (`150ms`), for an auto-hiding (tiny) scrollbar fading in and out. `Modal`, `Tray`, `Underlay`, the `Layout` scrollbars and the `Tabs` scrollbar use them, at the same timings as before. Both are listed in the published `tasty.config.ts`.
