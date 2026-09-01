---
'@cube-dev/ui-kit': minor
---

Add `@cube-dev/ui-kit/precompile/register`, the browser half of the app-owned catalog API.

`@cube-dev/ui-kit/precompile` compiles a catalog but is Node-only, so registering the result meant importing `@tenphi/tasty/precompile/register` directly — an undeclared dependency for most consumers, and a second Tasty instance with its own registry if the versions ever drifted. UI Kit now provides both halves.

It is a separate entry rather than a root re-export: the registry and its configuration comparison ship with whoever imports it, and an application that builds no catalog should not carry them.
