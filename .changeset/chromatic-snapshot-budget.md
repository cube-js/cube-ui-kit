---
'@cube-dev/ui-kit': patch
---

Import defining files directly instead of through barrels along the `Root` → `AlertDialog` → `Dialog` chain, and replace every `from '…/icons'` barrel import inside the library with a direct icon import. Nothing about the public API changes — the barrels still re-export everything — but the module graph gets narrower: pulling in `Root` no longer transitively drags in `Menu`, `CommandMenu`, `Form` and all 133 icon components, which is both better for a consumer's tree-shaking and what lets Chromatic's TurboSnap scope a build to the stories a change actually affects.
