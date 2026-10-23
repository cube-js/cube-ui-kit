---
'@cube-dev/ui-kit': patch
---

Update Tasty to 3.14.0 (from 3.13.0). Kit components that pass their props through `filterBaseProps` now apply a consumer's `tokens` instead of silently dropping them: `Block`, `Flex`, `Flow`, `Grid`, `Space`, `Text`, `Title`, `Card`, `Header`, `Content`, `Footer`, `Divider`, `Result`, `Label`, `Form`, `Pagination`, `Placeholder`, `Picker`, `FilterPicker`, `Action` and `ItemAction`, among others. A consumer's Tasty `theme` reaches those elements as `data-theme`. `Alert`'s own `theme` prop, its status theme, still renders only through `data-type`. Sub-elements created by `elements` also accept `theme` now.
