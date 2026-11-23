---
"@cube-dev/ui-kit": patch
---

A word longer than the line, such as a long name a user typed, now breaks onto the next line in a dialog's title and content instead of running past the dialog's edge, where it was cut off. This covers `Dialog`, `AlertDialog` and `DialogForm`. Ordinary text wraps as before. The docs now say to keep a dialog title short and put a value the user typed in the content.
