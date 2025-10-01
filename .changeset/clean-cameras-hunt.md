---
"@cube-dev/ui-kit": minor
---

**Breaking Change:** AlertDialog API cancel button behavior changed

The `cancel` button in AlertDialog now rejects the promise instead of resolving with `'cancel'` status, aligning it with the dismiss (Escape key) behavior.

**Migration Guide:**

**Before:**
```typescript
alertDialogAPI.open({...})
  .then((status) => {
    if (status === 'cancel') {
      // Handle cancel
    } else if (status === 'confirm') {
      // Handle confirm
    }
  })
```

**After:**
```typescript
alertDialogAPI.open({...})
  .then((status) => {
    if (status === 'confirm') {
      // Handle confirm
    } else if (status === 'secondary') {
      // Handle secondary action
    }
  })
  .catch(() => {
    // Handle cancel or dismiss
  })
```

**Note:** `AlertDialogResolveStatus` type no longer includes `'cancel'` - it now only contains `'confirm' | 'secondary'`.
