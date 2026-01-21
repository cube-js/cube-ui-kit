---
'@cube-dev/ui-kit': minor
---

**Breaking:** `ItemAction` now inherits `isDisabled` state from parent `Item` or `ItemButton` via context. When the parent component is disabled, all nested `ItemAction` components are automatically disabled.

To keep an action enabled when the parent is disabled, explicitly set `isDisabled={false}` on the `ItemAction`:

```jsx
<Item isDisabled actions={
  <>
    <ItemAction icon={<IconEdit />} tooltip="Disabled with parent" />
    <ItemAction icon={<IconTrash />} tooltip="Still enabled" isDisabled={false} />
  </>
}>
  Disabled item with one enabled action
</Item>
```
