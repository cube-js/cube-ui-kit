---
'@cube-dev/ui-kit': minor
---

`MenuTrigger` / `DialogTrigger`: an action can now hand focus off to the surface it opens. Closing either overlay used to return focus to its trigger unconditionally — an item or button whose action opened a panel, a dialog or an inline editor lost focus to the trigger a tick later, so consumers had to out-race the overlay by re-focusing on every animation frame over a several-hundred-millisecond window. The restore is now skipped whenever focus already sits outside the closing overlay, so a single `focus()` from the opened surface's mount effect holds.

Nothing changes when the action moves focus nowhere: focus still inside the overlay (the pressed control keeps it through the exit animation) or dropped to `<body>` returns to the trigger as before. A clicked control outside the overlay also keeps focus now instead of having it yanked to the trigger. For `DialogTrigger` this affects the `modal`, `tray`, `fullscreen`, `fullscreenTakeover` and `panel` types; `popover` already restored through `Dialog`'s own `FocusScope`, which declines to restore when focus moved.

Both triggers also gain a `shouldRestoreFocus` prop (default `true`) for surfaces that claim focus *later* than the restore — after an async load or an entry animation — where the trigger would otherwise take focus first and flash. It silences every restore path the trigger owns: `MenuTrigger`'s popover `FocusScope` as well as its manual restore, and for `DialogTrigger` the `Dialog`'s own `FocusScope` (reached through `DialogContext`, so a `Dialog` rendered outside a trigger keeps restoring focus as before).

`Tabs`: the rename-from-menu flow no longer runs a refocus pass. Picking "Rename" used to re-focus the inline-edit input on an animation frame and again at 50/200/400ms purely to survive the closing menu; the input's own `FocusScope autoFocus` is now enough. Behaviour is unchanged — rename still lands in a live editing session, in every context-menu mode.
