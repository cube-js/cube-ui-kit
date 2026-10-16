---
"@cube-dev/ui-kit": patch
---

Removing a toast or notification no longer schedules an extra state update after the stack re-measures. Under React 19 that update stayed pending past each synchronous commit and counted as a nested update, so many toasts or notifications leaving in one task, or leaving alongside other synchronous updates, could end in React's "Maximum update depth exceeded" error. The stack now forgets a removed item in the same render that drops its height, so each removal settles without leaving work behind.
