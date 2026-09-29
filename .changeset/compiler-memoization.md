---
"@cube-dev/ui-kit": patch
---

React Compiler now optimizes `ButtonSplit`, `CommandMenu`, `Panel`, `Layout.Container`, `Layout.Content`, `Layout.Pane`, the layout provider, the notification stack and `usePersistentNotifications`. They used to skip compilation because their manual `useMemo` and `useCallback` calls could not be preserved. Manual memoization that the compiler already covers has been removed across the kit. `Panel` now applies its `floating` and `flex` modifiers when `isFloating` or `isFlex` change after mount; before, the old memo kept the first values.
