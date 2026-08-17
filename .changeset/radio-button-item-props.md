---
'@cube-dev/ui-kit': minor
---

`Radio` / `Radio.Button`: a button- or tabs-type radio now accepts the full content API of the `Item` it renders, matching `ItemButton`. Newly forwarded: `descriptionPlacement`, `descriptionProps`, `keyboardShortcutProps`, `isLoading`, `loadingSlot`, `highlight`, `highlightCaseSensitive`, `highlightStyles`, `level` and `labelRef`. `description` now has a grid area to land in, so it renders in both `inline` and `block` placement, and container style props (`padding`, `gap`, `fill`, `preset`, …) apply to button-type radios instead of being dropped.
