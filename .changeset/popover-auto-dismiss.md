---
'@cube-dev/ui-kit': minor
---

**New:** Pressing a `Button` or `ItemButton` inside an open popover now
**dismisses that popover by default**. This covers every overlay that uses
`usePopoverSync` — `FilterPicker`, `Picker`, `ComboBox`, `Select`,
`MenuTrigger`, `SubMenuTrigger`, `DialogTrigger type="popover"`,
`use-anchored-menu`, and `use-context-menu`. Modal/tray/fullscreen Dialogs
are **not** affected — a Button inside a modal Dialog still does not
auto-close it.

The dismiss event is dispatched through the EventBus and deferred via
`setTimeout(0)`, so synchronous `onPress` handlers (and any React state
updates they trigger) flush BEFORE the popover closes. This makes the
common "open a hoisted modal from a popover footer" flow work without
flicker: the modal mounts first, then the popover closes.

### Opt-outs

- **Automatic** — Buttons that act as popover triggers (`MenuTrigger`
  children, `DialogTrigger type="popover"` children, picker trigger
  ItemButtons) already carry `data-popover-trigger` and skip the dismiss.
  Modal-type `DialogTrigger` children stay unmarked so they correctly
  dismiss the parent popover and let the modal take over.
- **Manual** — Add `data-popover-keep` to a Button (toggle case) or any
  ancestor element (subtree case):

  ```jsx
  <Button data-popover-keep onPress={() => setMode((m) => !m)}>
    Toggle
  </Button>

  <div data-popover-keep>{/* every Button inside opts out */}</div>
  ```

- **Custom non-Cube triggers** — call the newly exported
  `useDismissParentPopover()` to wire the same behaviour into your own
  interactive controls.

### Migration

Existing Buttons / ItemButtons inside popovers that were expected to **keep
the popover open** on press (toggles, inline editors, mode switches, etc.)
need `data-popover-keep`. Popover triggers wrapped by `MenuTrigger`,
`DialogTrigger type="popover"`, `FilterPicker`, `Picker`, `ComboBox`, or
`Select` need no change — they're auto-skipped.

### Internals

- `usePopoverSync` gained a `dismissOnInnerButtonPress` option (default
  `true`). `DialogTrigger` passes `false` for modal/tray/fullscreen types
  so buttons inside those dialogs don't subscribe to the new dismiss
  event. The `popover:dismiss-ancestor` EventBus event carries the
  originating DOM element so each popover host can do a `container.contains()`
  check before closing.
- `usePopoverSync` gained a `closeOnPeerOpen` option (default `true`).
  `DialogTrigger` passes `false` for modal/tray/fullscreen/panel types so
  a peer popover opening (e.g. via `useDialogContainer` or
  `useAnchoredMenu`) cannot bypass the dialog's `isDismissable` /
  `onClose` handling and call `state.close()` directly. The host still
  EMITS `popover:open`, so opening a modal correctly dismisses peer
  popovers — only the listener side is gated.
- `DialogTrigger` now applies `data-popover-trigger` to its child press
  responder **only when `type === 'popover'`**. This is the critical
  correctness piece for the original bug — when a `DialogTrigger type="modal"`
  lives inside a `FilterPicker` footer, pressing its trigger now correctly
  dismisses the FilterPicker, and the modal takes over.
- `EventBusProvider` is now a no-op when nested inside another
  `EventBusProvider`. The internal `Provider` from `provider.tsx` wraps
  overlay content with its own `EventBusProvider`, which used to silently
  shadow the global `<Root>` bus and prevent cross-overlay events from
  reaching the host.
- `usePopoverSync`'s nested-popover guard now walks the **logical**
  popover chain via a module-level registry of open overlays, rather than
  relying solely on a direct `container.contains(triggerEl)` DOM check.
  Popover content is portaled to a shared overlay root, so a grandchild
  popover's trigger lives in a sibling portal — not inside its
  grandparent's DOM. Without the chain walk, opening a third+ level
  `SubMenuTrigger` (or any equivalent nested popover) closed every
  ancestor.
