---
'@cube-dev/ui-kit': patch
---

Apply UI Kit's own Tasty configuration before compiling the shipped catalog, so the manifest records it.

The catalog imports the kit lazily inside each case, so the configuration snapshot Tasty now takes was captured before `Root` had registered UI Kit's units, states and recipes. The shipped manifest recorded 6 entries instead of 14, and a consumer overriding one of UI Kit's own recipes would not have been detected as a divergence. The generated CSS is unchanged.
