# `useContextMenu` Hook Specification

## Purpose

`useContextMenu` is a generic React hook that allows a component to open a `Menu`-like overlay (or `CommandMenu`) exactly at the pointer position where the user invoked a context action (typically a right-click or long-press) **inside an anchor container**.  
It is conceptually similar to `useAnchoredMenu`, but whereas `useAnchoredMenu` docks the overlay to an **anchor element**, `useContextMenu` docks it to a **coordinate**.  This makes it ideal for building classic contextual menus that follow the cursor.

## API

```ts
function useContextMenu<P, T = ComponentProps<typeof MenuTrigger>>(
  Component: ComponentType<P>,
  defaultTriggerProps?: Omit<
    ComponentProps<typeof MenuTrigger>,
    'children' | 'isOpen' | 'onOpenChange' | 'targetRef'
  >,
): {
  /** Container that bounds the context menu. Attach to the element that receives the context-menu event. */
  targetRef: RefObject<HTMLElement>;

  /**
   * Opens the menu at the given pointer event position.
   *
   * @param e        The `PointerEvent | MouseEvent | React.PointerEvent` corresponding to the user action.
   * @param props    Props to pass to **Component** (same semantics as `useAnchoredMenu`).
   * @param trigger  Extra props for `MenuTrigger` (merged with `defaultTriggerProps`).
   */
  open(
    e: MouseEvent | PointerEvent | React.MouseEvent | React.PointerEvent,
    props: P,
    trigger?: T,
  ): void;

  /**
   * Programmatically updates the props of the rendered **Component** without re-opening.
   */
  update(props: P, trigger?: T): void;

  /** Closes the menu. */
  close(): void;

  /** Current open state. */
  isOpen: boolean;

  /**
   * JSX element that **must** be rendered in the tree so that the hook can create the `MenuTrigger` overlay.
   * Same lazy getter semantics as in `useAnchoredMenu`.
   */
  get rendered(): ReactElement | null;
};
```

## Behaviour

1. **Coordinate positioning** – The hook silently inserts an **invisible anchor element** (`<span style="position:absolute;" />`) at the click coordinates inside `anchorRef`. This element becomes the `targetRef` that `MenuTrigger` uses for `useOverlayPosition`, giving us pixel-perfect placement **without modifying `MenuTrigger`**.
2. **Viewport clamping** – If the calculated position would push the overlay outside the viewport or the bounding rect of `anchorRef`, the anchor element’s coordinates are shifted so that the popover remains fully visible. The logic re-uses React-Aria’s built-in collision handling (`shouldFlip`, `containerPadding`, `offset`).
3. **Trigger semantics** – Callers invoke `open` from a `contextmenu` handler (or any pointer/keyboard alternative). The hook calls `event.preventDefault()` for you so the native menu never shows.
4. **Keyboard support** – When opened via keyboard (e.g. `Shift-F10`), callers may pass a synthetic `{ clientX, clientY }` object, or omit the event to default to the **focused element’s** bounding rect.
5. **Close interaction** – Outside click, <kbd>Esc</kbd>, or selecting a menu item behaves exactly like with `useAnchoredMenu` (delegated to `MenuTrigger`).

## Differences vs `useAnchoredMenu`

| Concern | `useAnchoredMenu` | `useContextMenu` |
|---------|------------------|------------------|
| Positioning primitive | DOM `targetRef` (typically the button that opened the menu) | Invisible DOM node injected at click coordinates |
| `open` signature | `(props, triggerProps?)` | `(event, props, triggerProps?)` – needs pointer location |
| Default placement passed to `MenuTrigger` | `"bottom start"` | `"bottom start"` (works well with zero-size anchor) but can be overridden |
| Collision handling | Purely via `useOverlayPosition` | Same, plus optional manual clamping inside `anchorRef` |
| Required library changes | — | none |

## Required Codebase Changes

`Menu` and `MenuTrigger` **do not need to change**. All logic lives in the new hook, which:

1. Renders the invisible anchor element.
2. Feeds its ref to `MenuTrigger` via `targetRef`.
3. Passes `placement`, `offset`, etc. through `defaultTriggerProps` / `triggerProps` just like `useAnchoredMenu`.

No type changes are required because `targetRef` remains a real HTMLElement.

## Examples

### 1. Basic Context Menu

```tsx
import { useContextMenu } from '@cube-dev/ui-kit';
import { Menu } from '@cube-dev/ui-kit';

function FileItem({ file }) {
  const { targetRef, open, rendered } = useContextMenu(Menu);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    open(e, {}, { closeOnSelect: true });
  };

  return (
    <div ref={targetRef} onContextMenu={handleContextMenu}>
      {file.name}
      {rendered}
    </div>
  );
}
```

### 2. Context Command Menu with Search

```tsx
const ContextCommand = () => {
  const { targetRef, open, rendered } = useContextMenu(CommandMenu);

  function handleRightClick(e: React.MouseEvent) {
    e.preventDefault();
    open(e, {
      searchPlaceholder: 'Search actions…',
      onAction: (key) => console.log(key),
    });
  }

  return (
    <section ref={targetRef} onContextMenu={handleRightClick} style={{ height: 400 }}>
      Right-click anywhere to open the command palette
      {rendered}
    </section>
  );
};
```

### 3. Re-using the same hook for multiple items

```tsx
function Table() {
  const { targetRef, open, rendered, update } = useContextMenu(Menu);
  const [rowId, setRowId] = useState<number | null>(null);

  const handleContext = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setRowId(id);
    open(e, { onAction: (k) => console.log('row', id, k) });
  };

  return (
    <table ref={targetRef}>
      {rows.map((row) => (
        <tr key={row.id} onContextMenu={(e) => handleContext(e, row.id)}>
          <td>{row.name}</td>
        </tr>
      ))}
      {rendered}
    </table>
  );
}
```

## Migration Guide

1. Replace `useAnchoredMenu` with `useContextMenu` where you need point-based positioning.
2. Pass the triggering event as the **first argument** to `open`.
3. Ensure you render `rendered` and attach `targetRef` *exactly once* per component – same as with the old hook.

---

*Last updated: 2025-07-15* 