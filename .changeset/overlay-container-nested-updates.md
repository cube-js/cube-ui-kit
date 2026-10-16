---
"@cube-dev/ui-kit": patch
---

Removing many toasts or notifications when each removal commits synchronously on its own (for example one `flushSync` per removal) no longer ends in React's "Maximum update depth exceeded" error. Each removal used to leave a state update pending after its commit, which React 19 counts as a nested update; the stack now forgets a removed item in the same render that drops its height.
