---
'@cube-dev/ui-kit': minor
---

Render Menu navigation items as native links, supporting `to`, path objects, navigation options and native `href` attributes. Ordinary activation uses the application router once; browser link gestures remain native and disabled destinations stay inert. Preserve the navigation adapter through nested providers and overlays. Submenu triggers open their submenu without invoking item or Menu command callbacks, including pointer and hotkey activation.

Support the same destinations and composed item/Menu callbacks in CommandMenu. Cover complete navigation rows with native link targets, including whitespace and padding. Give mixed command/link menus semantic focus targets and separately accessible inline actions while preserving item layout. Correct CommandMenu's searchbox-to-menu active descendant relationship. Use the `focused` modifier and `data-menuitem` for layout-row selectors that previously relied on LI focus or role adjacency. Selection controls reject and ignore destination props so listbox and combobox options cannot navigate.
