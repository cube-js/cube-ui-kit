---
"@cube-dev/ui-kit": patch
---

Lowered the `engines.node` requirement from `>=24.0.0` to `>=22.0.0` so the package installs cleanly into projects on Node 22 (e.g. Cube Cloud, which runs Node 22.14). No runtime code changes; CI non-publish jobs now run on Node 22 too. The npm publish jobs remain on Node 24 because OIDC trusted publishing requires npm ≥ 11.5.1+, which Node 24 ships natively (Node 22 ships npm 10.x).
