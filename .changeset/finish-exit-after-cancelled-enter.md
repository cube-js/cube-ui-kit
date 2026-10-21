---
'@cube-dev/ui-kit': patch
---

`DisplayTransition` with native transition timing, as `Select` uses it: a close that interrupts the opening animation now plays its exit to the end. The browser cancels the opening transition as the exit's own one starts, and that cancel used to end the exit at once, so a `Select` list closed right after it opened, as a scroll around it closes it, vanished mid-fade, and a press on one of its options could pick nothing. A reopen that interrupts the exit likewise settles only once the opening transition finishes.
