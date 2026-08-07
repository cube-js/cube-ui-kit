---
'@cube-dev/ui-kit': patch
---

Fix the types of `FilterListBox.Item` and `CommandMenu.Item`. Both were declared as React Stately's bare `Item`, so `Item` props such as `icon`, `rightIcon`, `description`, `hotkeys` and `actions` were rejected by TypeScript even though they worked at runtime. They now use `CollectionItem`, matching `ListBox.Item`, `Menu.Item` and the other collection components.
