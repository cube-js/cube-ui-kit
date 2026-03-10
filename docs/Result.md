# Result

Used to feed back the results of a series of operational tasks.

## When To Use

Use when important operations need to inform the user to process the results and the feedback is more complicated.

## Examples

### Success

### Info

### Warning

### Error

### Custom Icon

### Custom Title

### Compact

## Properties

- **`status`** `'success' | 'error' | 'info' | 'warning' | 404 | 403 | 500` (default: `'info'`) — Result status, determines the icon and color from ready-made templates
- **`title`** `ReactNode` — The title of the result
- **`subtitle`** `ReactNode` — Subtitle of the result component
- **`icon`** `ReactNode` — Custom icon element. Don't use together with `status`
- **`isCompact`** `boolean` — Whether the result component has a compact presentation
- **`children`** `ReactNode` — Additional block content, e.g. a set of action buttons

## Differences from Ant Design

| There are differences | Ant Design property | Cube UIKit property |
| :-------------------: | :-----------------: | :-----------------: |
|          No           |      `status`       |      `status`       |
|          No           |       `title`       |       `title`       |
|          Yes          |     `subTitle`      |     `subtitle`      |
|          No           |       `icon`        |       `icon`        |
|          Yes          |       `extra`       |     `children`      |
