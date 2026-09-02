---
'@cube-dev/ui-kit': patch
---

Mount `TooltipProvider`'s trigger in one commit. Its SSR guard was a `rendered` state flipped from an effect, so on the client it rendered its children bare, then swapped them into `TooltipTrigger` a commit later — remounting the trigger after everything watching the mount had already called it finished, and leaving anything holding that node with a detached one. `useIsSSR` answers on the first client render instead.
