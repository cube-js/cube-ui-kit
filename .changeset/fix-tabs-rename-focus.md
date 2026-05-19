---
'@cube-dev/ui-kit': patch
---

`Tabs`: keep the inline rename input mounted when triggered from the tab menu. Previously the Menu popover's `<FocusScope restoreFocus>` would yank focus back to the trigger as soon as the menu started closing, fire `InlineInput`'s `submitOnBlur`, and unmount the input the user just opened — so clicking "Rename" appeared to do nothing.

`InlineInput` now ignores blurs that happen within ~500ms of a programmatic `startEditing()` call (cleared on the first user keystroke). `TabButton` also retries focusing the input across the menu's exit transition as a belt-and-suspenders defense.
