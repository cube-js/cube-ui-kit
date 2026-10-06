---
'@cube-dev/ui-kit': patch
---

`HotKeys` accepts an array of text children and joins it into one key string, so it can fill a `<Trans>` component slot: `components={{ hotkeys: <HotKeys type="inherit" /> }}`. It used to throw there. `children` is now optional in its type, and string children work as before.
