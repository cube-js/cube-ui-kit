---
"@cube-dev/ui-kit": patch
---

`Layout.Pane` with `flexShrink={1}` now resizes correctly when other panes in the same flex container also give way. The pane follows the pointer and moves exactly 10px per arrow key instead of losing part of each move to the panes beside it, stays where it is dropped, and stops growing once those panes reach their `minSize`. A pane that gives way keeps the size it was left at and reports it through `onSizeChange`.
