---
'@cube-dev/ui-kit': minor
---

Add `isLoadingItems` prop to `FilterPicker` and `FilterListBox`. Unlike `isLoading`, this does not disable the trigger — the popover can still be opened while items are being fetched. Inside the popover, a loading disclaimer is shown. When `allowsCustomValue={false}`, the search input is hidden and the disclaimer becomes the focus target; when `allowsCustomValue={true}`, the search input remains visible so a custom value can still be typed and applied. The disclaimer label is customizable via `loadingItemsLabel` (defaults to `"Loading items..."`).
