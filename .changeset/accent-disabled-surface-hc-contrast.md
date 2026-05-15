---
'@cube-dev/ui-kit': patch
---

Fix high-contrast scheme rendering of disabled brand-tinted chips on PRIMARY-style buttons. The `#<theme>-accent-disabled-surface` tokens (`primary`, `success`, `danger`, `warning`, `note`, `special`) had an inverted contrast pair (`[1.4, 1.3]` — first value > second), which made the chip slightly *less* contrasty in high-contrast mode than in regular mode — opposite to the HC scheme's intent and inconsistent with every other contrast pair in `palette.ts`. Corrected to `[1.4, 1.5]`. Light and dark modes are unchanged; only the high-contrast scheme bumps from cr ≈ 1.3 to cr ≈ 1.5 against `#surface`.
