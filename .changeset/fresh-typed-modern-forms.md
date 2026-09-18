---
"@cube-dev/ui-kit": minor
---

Improve the modern Form API before adoption: add typed field descriptors and value/state hooks, reject misspelled literal command paths, and expose immutable nested read types. Controller callbacks now use the latest committed props; validators track field reads, support explicit field/external dependencies, and cancel stale results without comparing function source text. Submit and Reset honor their controller outside the form, root payload selection supports retained values, and submission failures have discriminated results with explicit-controller error rendering. Existing legacy forms retain their API and behavior. Modern consumers should handle `onSubmitFailed` by its `status` and use `deps` for external validator inputs.
