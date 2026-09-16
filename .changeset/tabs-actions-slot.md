---
'@cube-dev/ui-kit': patch
---

`Tabs` now renders a tab's actions — your own, the overflow menu trigger, the close button — through the same actions run `ItemButton` and the field triggers use, instead of the copy `TabButton` carried of its own.

The tab bar is meant to look exactly as it did, and does: identical across the `default`, `file`, `narrow` and `radio` types, all three sizes, and the reorderable, editable, auto-hiding, disabled and no-actions variants. What changes is behaviour the copy had drifted on.

- **A press in the run no longer disappears.** The run used to be opaque to the pointer, so a click in its padding — or in the gap between the menu trigger and the close button — hit the run and did nothing. The shared run is transparent and only its controls take presses, so those clicks now select the tab underneath. The controls themselves are unaffected, and pressing one still does not select the tab.
- **Actions centre on the tab's height** rather than being pinned to its top, so a tab whose height a caller has set keeps its controls on the centre line.
- **The active tab keeps its actions visible** under `autoHideActions` because the component asks for that, not because a CSS rule spelled out `active` next to `:hover` and `:focus-within`.

`ItemActionsWrapper` gains a `preserveActionsSpace` option for this, matching the prop `Item` already had: the run keeps its width reserved while hidden, so a bar does not reflow as the pointer crosses it, and it stays mounted rather than transitioning in and out — an unmounted run cannot be measured, so a tab that starts hidden would have nothing to reserve.

A tab's actions container is now always present in the markup, empty when the tab has none.
