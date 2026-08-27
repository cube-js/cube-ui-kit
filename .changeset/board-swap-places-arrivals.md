---
'@cube-dev/ui-kit': minor
---

`<Board collisionMode="swap">` now **places** a widget arriving from another board instead of cancelling the transfer.

`swap` used to treat a cross-board arrival as strict insertion: the anchor cell had to be empty, and releasing over an occupied one cancelled the whole transfer — both boards snapped back and `onWidgetTransfer` never fired. That made the mode's two halves unusable together, since a board that wanted in-board swapping had to give up cross-board drops (or pick `downscale` and give up the swap).

A cross-board arrival now resolves the same way `downscale` does: it keeps its size where the drop cell allows, downscales into the room to its right and below where it does not, and holds the last cell it fitted in as the pointer sweeps across a destination widget — so releasing over an occupied cell commits what the preview was showing. Entering a board directly over an occupied cell places the widget in the nearest cell that fits. Destination widgets are still never exchanged, pushed, or reflowed to make space — only the arrival moves. In-board drops are unchanged and still swap.

Also fixes a cross-board landing under any `collisionMode` where a refused placement committed the widget one row above the board (`y: -1`) instead of on it.
