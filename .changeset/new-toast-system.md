---
"@cube-dev/ui-kit": minor
---

Replaced the toast system with a new implementation:

- **New API**: `useToast()` hook with `toast()`, `toast.success()`, `toast.danger()`, `toast.warning()`, and `toast.note()` methods
- **Progress toasts**: `useProgressToast()` hook for loading states that persist while `isLoading` is true
- **Declarative usage**: `<Toast>` and `<Toast.Progress>` components for declarative toast rendering
- **Default icons**: Each theme now has a predefined icon (can be overridden)
- **Collapse on hover**: Toasts collapse when hovering the toast area to reveal content behind
- **Deduplication**: Toasts with the same content are deduplicated automatically

**Breaking changes:**
- Removed `useToastsApi` hook - migrate to `useToast`
- Removed `attention` theme - use `warning` instead
- Renamed `header` prop to `title`
