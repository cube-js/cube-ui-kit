---
"@cube-dev/ui-kit": patch
---

`ItemAction` (`Item.Action`) now disables itself while `isLoading`, as `Button` does, so a second press while loading no longer runs the action again. Loading always wins: `isDisabled={false}` still overrides a disabled row, but not a loading action. A disabled or loading action with a tooltip keeps showing it: it is marked `aria-disabled` and kept inert instead of getting the native `disabled` attribute, which stopped the tooltip from opening on hover. And the loading spinner on a label-only action now gets the same padding as an icon.
