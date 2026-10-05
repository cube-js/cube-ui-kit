---
"@cube-dev/ui-kit": patch
---

`ItemAction` (`Item.Action`) now disables itself while `isLoading`, as `Button` does, so a second press while loading no longer runs the action again. Loading always wins: `isDisabled={false}` still overrides a disabled row, but not a loading action. A loading action is marked `aria-disabled` rather than natively disabled, so it keeps keyboard focus and its tooltip, while Tab skips it until loading ends. An icon-only action with a tooltip that disables itself is marked the same way, so keyboard users can still reach it and read the tooltip, as on `Button`. Inside a disabled row, a disabled action stays natively disabled and no longer fades twice. The loading spinner on a label-only action now gets the same padding as an icon. An interactive `InfoBadge` follows the same rules.
