---
"@cube-dev/ui-kit": patch
---

`TagInput` no longer swallows the click that takes focus away from it while a message is showing over an empty input. Leaving the field clears that message, which moves everything below the field up by a line. A press on a control below, such as a disclosure or a button, then ended off the control and did nothing. The message now stays until the press ends, and focus leaving by keyboard still clears it at once.
