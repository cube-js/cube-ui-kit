---
'@cube-dev/ui-kit': patch
---

- A `to` with a colon in its path or query, such as `/models/cube:orders` or `..?thread=a:b`, now navigates in the router instead of reloading the page. Only a string that starts with a URL scheme (`https:`, `mailto:`, `tel:`) or with `//` counts as external. This covers `Link`, `Button`, `ItemButton`, `ItemAction` and every other action that takes `to`.

- `Skeleton` renders its `children` in the `page`, `content` and `tabs` layouts, in place of the placeholder lines. The page's header row and the tab strip stay. Before, the children were dropped.

- `HotKeys` accepts an array of text children and joins it into one key string, so it can fill a `<Trans>` component slot: `components={{ hotkeys: <HotKeys type="inherit" /> }}`. It used to throw there. `children` is now optional in its type, and string children work as before.

- `TreeItemProps`, the type `Tree`'s `itemProps` returns, is exported next to `TreeNodeState`.

- `Tree` rows with a single child, and lazy rows (`isLeaf: false`) whose children are not loaded yet, report `aria-expanded` and expand and collapse with `ArrowRight` / `ArrowLeft`, like rows with more children. In `selectionMode="none"`, pressing such a row now toggles it too, as it already did for other parent rows.

- `Escape` pressed on a `Tree` row's checkbox now reaches the surrounding popover or dialog, so a checkable `Tree` inside an overlay can be dismissed from the keyboard. Every other key stays held at the checkbox, as before.
