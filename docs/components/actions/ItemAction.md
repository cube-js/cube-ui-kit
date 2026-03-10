# ItemAction

A compact action button designed for use inside `Item`, `ItemButton`, and `ItemCard`. Automatically inherits `type` and `theme` from its parent context.

## When to Use

- Row actions in lists (edit, delete, etc.)
- Card action buttons
- Inline actions that inherit context from parent

## Component

---

## Properties

- **`icon`** `ReactNode | 'checkbox'` — Icon element or `'checkbox'` for a selection indicator
- **`type`** `'primary' | 'secondary' | 'outline' | 'neutral' | 'clear'` (default: `'neutral'`) — Visual type. Inherits from parent context.
- **`theme`** `'default' | 'danger' | 'success' | 'warning' | 'note' | 'special'` (default: `'default'`) — Color theme. Inherits from parent context.
- **`isLoading`** `boolean` (default: `false`) — Shows loading spinner
- **`isSelected`** `boolean` (default: `false`) — Selected state (works with `icon="checkbox"`)
- **`isDisabled`** `boolean` (default: `false`) — Disables the action. Inherits from parent; use `isDisabled={false}` to override.
- **`tooltip`** `string | object` — Tooltip content (shown for icon-only buttons)
- **`onPress`** `() => void` — Press event handler

### Base Properties

Supports [Base properties](../../BaseProperties.md).

## Examples

### Icon-only actions

```jsx
<ItemAction icon={<IconEdit />} tooltip="Edit" onPress={() => edit()} />
<ItemAction icon={<IconTrash />} tooltip="Delete" theme="danger" />
```

### Checkbox action

```jsx
<ItemAction icon="checkbox" isSelected={isChecked} onPress={toggle} />
```

### Inside ItemButton

```jsx
<ItemButton
  type="outline"
  icon={<IconFile />}
  actions={
    <>
      <ItemAction icon={<IconEdit />} tooltip="Edit" />
      <ItemAction icon={<IconTrash />} tooltip="Delete" theme="danger" />
    </>
  }
>
  Document.pdf
</ItemButton>
```
