# FileTabs

A tab bar for file-like items with close buttons and dirty state indicators. Designed for editor-style interfaces.

## When to Use

- Code editors or file editors
- Multi-document interfaces
- Tabbed interfaces with close/dirty indicators

## Properties

- **`activeKey`** `string` — Controlled active tab key
- **`defaultActiveKey`** `string` — Default active tab key (uncontrolled)
- **`onTabClick`** `(key: string) => void` — Callback when a tab is clicked
- **`onTabClose`** `(key: string) => void` — Callback when a tab's close button is clicked
- **`isClosable`** `boolean` (default: `true`) — Whether tabs can be closed
- **`paneStyles`** `Styles` — Custom styles for the tab pane area

### Style Defaults

- Tab `radius` — `1r 1r 0 0`
- Tab `padding` — `1x 1.5x`
- Tab `fill` — `#dark.04` (active tabs use `#white`)
- Tab gap — `.5x`

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

```jsx
<FileTabs defaultActiveKey="1" onTabClose={(key) => removeTab(key)}>
  <FileTabs.Tab key="1" title="index.ts" />
  <FileTabs.Tab key="2" title="styles.css" isDirty />
  <FileTabs.Tab key="3" title="readme.md" />
</FileTabs>
```
