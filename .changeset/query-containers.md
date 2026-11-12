---
'@cube-dev/ui-kit': minor
---

**Query containers:** more regions are named `inline-size` query containers, so a `Button`'s `collapseState` (`'@(dialog, w < 400px)'`) and any `@(name, …)` style condition can respond to them. `Layout.Container` and `Layout.Center` are the `content` container on their column, as `Layout.Content` is; `Panel` and `ResizablePanel` are `panel`, as `Layout.Panel` is; and `Dialog` is `dialog`. `Card`, `Alert` and `Result` become `card`, `alert` and `result` with the new `isQueryContainer` prop. They are containers only on request because they can be as wide as their content, and a query container ignores its content's width, so a card in a horizontal `Space` or a centered one would shrink to its padding.

**Breaking — a dialog's width no longer comes from its content.** A container ignores its content's width, so a `Dialog` sized by its content (`width="max-content"`, or a `styles.width` that sets no width of its own, such as `'max 70vw'`) now shrinks to its padding: give it a size or a length. A popover is the exception: it still sizes to what it holds, as the pickers' popovers do, also when `mobileType` shows it as a tray or modal on a phone, and is no container unless you set `isQueryContainer`. A `type="panel"` dialog with no width now takes its width from `size`, as the other types do.
