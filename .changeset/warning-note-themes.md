---
"@cube-dev/ui-kit": minor
---

Add warning theme and rename note theme across components

### What's changed:
- Added `warning` theme support to `Badge`, `Tag`, and `Item` components
- Renamed previous `note` theme to `warning` (yellow/amber) across the codebase
- Added new `note` theme (violet) for informational content, available for `card` type items
- Updated component documentation and stories to reflect new themes
- Updated notification icons to use `warning` theme instead of `note`

### Components affected:
- `Badge`: Added `warning` theme option
- `Tag`: Added `warning` theme option  
- `Item`: Added `warning.card` and `note.card` theme variants
- `NotificationIcon`: Changed default/attention from `note` to `warning` colors

### Migration:
- If you were using `theme="note"` on `Badge` or `Tag` components, change to `theme="warning"` for the same yellow/amber appearance
- For violet informational cards, use `type="card" theme="note"` on `Item` component
- Notification icons now use warning colors by default (previously note colors)
