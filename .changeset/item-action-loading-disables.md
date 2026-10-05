---
"@cube-dev/ui-kit": patch
---

`ItemAction` (`Item.Action`) now disables itself while `isLoading`, as `Button` does, so a second press while loading no longer runs the action again. Loading always wins: `isDisabled={false}` still overrides a disabled row, but not a loading action. A loading action is marked `aria-disabled` and kept inert rather than natively disabled, so it keeps keyboard focus and its tooltip. So is an action that disables itself with its own `isDisabled` and has a tooltip: the tooltip now opens on hover, and the action stays in the tab order, as on `Button`. And the loading spinner on a label-only action now gets the same padding as an icon.
