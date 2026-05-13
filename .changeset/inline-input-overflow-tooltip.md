---
'@cube-dev/ui-kit': patch
---

**InlineInput / Tabs**: truncate long values with an ellipsis and surface a tooltip with the full value when truncated.

- **`InlineInput`** now renders as `display: inline-block` with `text-overflow: ellipsis` / `white-space: nowrap` / `overflow: hidden` capped at `max-width: 100%` in display mode. The truncation rules are relaxed while editing (`overflow: visible`, `white-space: normal`) so the auto-sizing input is never visually clipped.
- New props `tooltip?: AutoTooltipValue` (default `true`) and `tooltipPlacement?: OverlayProps['placement']` (default `'top'`). `tooltip={true}` shows the full value as a tooltip when the text is truncated; `tooltip="..."` always shows a custom tooltip; `tooltip={false}` opts out. The tooltip is automatically suppressed while editing and when `renderDisplay` is used.
- **`Tabs`**: editable tabs now route `<Tab tooltip>` through `InlineInput` (single tooltip owner) — `Item`'s own tooltip is disabled for editable tabs to avoid double-wrapping. Long editable tab titles now also truncate with an ellipsis and reveal the full title on hover/focus, with no extra configuration. Non-editable tabs are unchanged.
