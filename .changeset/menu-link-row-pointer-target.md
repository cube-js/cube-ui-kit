---
"@cube-dev/ui-kit": patch
---

In `Menu` and `CommandMenu`, the icon, label and description of a navigation item (or of a command item with inline actions) no longer sit on top of the row's `role="menuitem"` anchor as pointer targets. Before, a long label covered the centre of that anchor, so a role-based browser-test click such as Playwright's `getByRole('menuitem', { name }).click()` failed with "intercepts pointer events". Now those slots let presses through to the menuitem anchor, which carries the same `href`, so plain, modified, middle and right clicks anywhere on the row behave as before for users, and inline actions and controls in the prefix, suffix and actions slots stay clickable. Tests that click such an item by its label, description or icon now fail instead: a browser test reports that the anchor "intercepts pointer events", and jsdom's user-event rejects an element with `pointer-events: none`. Click the item by its role instead, as `getByRole('menuitem', { name })`.
