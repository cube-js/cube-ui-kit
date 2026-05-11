---
'@cube-dev/ui-kit': minor
---

**Menu / Tray**: gate mobile tray rendering behind a `mobileType` opt-in and let `Tray` accept `shouldCloseOnInteractOutside`.

- `Tray` now accepts a `shouldCloseOnInteractOutside?: (element: Element) => boolean` prop and forwards it to React Aria's `useOverlay`. Without it, the underlying `useOverlay` unconditionally calls `stopPropagation` / `preventDefault` on outside pointer/click events whenever the tray is the topmost overlay, which can swallow clicks on sibling triggers (e.g. a second `MenuTrigger`). The new prop matches the existing API on `Popover`.
- `MenuTrigger` no longer auto-swaps its `Popover` for a `Tray` on mobile screens. The previous behaviour relied on `useIsMobileDevice()` (which returns `true` in jsdom-style environments where `window.screen.width` is `0`), so the mobile branch could activate unintentionally. Opt in explicitly with `mobileType="tray"` (defaults to `'popover'`), mirroring the established `mobileType` API on `DialogTrigger`.
- `MenuTrigger` now passes the same `shouldCloseOnInteractOutside` callback to both the `Popover` and `Tray` branches, so sibling-trigger clicks aren't swallowed in either overlay variant.

This is a behavioural change for apps that intentionally relied on the implicit mobile tray. To restore the previous look, pass `mobileType="tray"` to the relevant `MenuTrigger`s.
