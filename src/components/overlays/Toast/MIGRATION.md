# Migration Guide: useToastsApi → useToast

This guide helps you migrate from the old `useToastsApi` hook to the new `useToast` hook.

## Quick Reference

| Old API (`useToastsApi`) | New API (`useToast`) |
|--------------------------|----------------------|
| `useToastsApi()` | `useToast()` |
| `const { toast } = useToastsApi()` | `const toast = useToast()` |
| `toast({ description: 'msg' })` | `toast('msg')` or `toast({ description: 'msg' })` |
| `toast.success('msg')` | `toast.success('msg')` |
| `toast.danger('msg')` | `toast.danger('msg')` |
| `toast.attention('msg')` | `toast.warning('msg')` |
| `<Toast description="..." />` | `<Toast>...</Toast>` or `<Toast title="..." />` |
| `header` prop | `title` prop |
| `update(id, props)` | Remove and add new toast |

## Step-by-Step Migration

### 1. Update Imports

```diff
- import { useToastsApi } from '@cube-dev/ui-kit';
+ import { useToast } from '@cube-dev/ui-kit';
```

### 2. Update Hook Usage

The new hook returns the toast API directly (no destructuring needed):

```diff
- const { toast } = useToastsApi();
+ const toast = useToast();
```

### 3. Update Toast Calls

#### Simple messages (unchanged)

```tsx
// These still work the same way
toast.success('Copied to clipboard');
toast.danger('Something went wrong');
```

#### attention → warning

```diff
- toast.attention('Check your input');
+ toast.warning('Check your input');
```

#### Object syntax

```diff
// Old: description was the main content
- toast({ description: 'Message', header: 'Title' });

// New: title is the main content, description is secondary
+ toast({ title: 'Title', description: 'Message' });

// Or use string shorthand for simple messages
+ toast('Message');
```

### 4. Update Declarative Toast Component

```diff
// Old: description was required
- <Toast description="Saved successfully" type="success" />

// New: use children or title for primary content
+ <Toast theme="success">Saved successfully</Toast>
// or
+ <Toast title="Saved successfully" theme="success" />
```

### 5. Handle `update` Method

The new API does not have an `update` method. Instead, remove the old toast and add a new one:

```diff
- const { toast, update } = useToastsApi();
- const id = toast({ description: 'Loading...' });
- // later...
- update(id, { description: 'Complete!' });

+ const toast = useToast();
+ let toastId = toast({ title: 'Loading...' });
+ // later...
+ toast.remove(toastId);
+ toastId = toast({ title: 'Complete!' });
```

Or use `useProgressToast` for loading states:

```tsx
import { useProgressToast } from '@cube-dev/ui-kit';

useProgressToast(
  isLoading
    ? { isLoading: true, title: 'Loading...' }
    : { isLoading: false, title: 'Complete!', theme: 'success' }
);
```

### 6. Handle `remove` Method

```diff
- const { toast, remove } = useToastsApi();
- const { id } = toast({ description: 'Message' });
- remove(id);

+ const toast = useToast();
+ const id = toast({ title: 'Message' });
+ toast.remove(id);
```

## Key Differences

### Terminology Changes

- `header` → `title` - The primary content prop
- `attention` → `warning` - Matches Item theme names
- `type` → `theme` - Visual theme of the toast

### API Structure

- **Old**: `const { toast, update, remove } = useToastsApi()`
- **New**: `const toast = useToast()` where `toast.remove()` is available

### Content Priority

- **Old**: `description` was the primary/required content
- **New**: `title` (or `children`) is primary; `description` is secondary
- **Backward compatible**: If only `description` is provided without `title`, it becomes the primary content

### Duration

- Default duration remains 5 seconds
- Set `duration: null` for persistent toasts (or use `useProgressToast`)

## New Features

### String Shorthand

```tsx
// New simplified API
toast.success('Message');
// Instead of
toast.success({ description: 'Message' });
```

### Progress Toast Hook

For loading states with automatic state transitions:

```tsx
import { useProgressToast } from '@cube-dev/ui-kit';

useProgressToast(
  isLoading
    ? { isLoading: true, title: 'Saving...', icon: <Spinner /> }
    : { isLoading: false, title: 'Saved!', theme: 'success' }
);
```

### Deduplication

Toasts with identical content are automatically deduplicated, creating a "refresh" effect for repeated actions.

### Collapse on Hover

Toasts collapse when hovered to reveal content behind them.

## Complete Example

### Before

```tsx
import { useToastsApi, Toast } from '@cube-dev/ui-kit';

function MyComponent() {
  const { toast, update, remove } = useToastsApi();

  const handleCopy = () => {
    toast.success('Copied to clipboard');
  };

  const handleSave = async () => {
    const { id } = toast({ description: 'Saving...', duration: null });
    
    try {
      await save();
      update(id, { description: 'Saved!', type: 'success' });
    } catch (e) {
      update(id, { description: 'Error saving', type: 'danger' });
    }
    
    setTimeout(() => remove(id), 3000);
  };

  return (
    <>
      <button onClick={handleCopy}>Copy</button>
      <Toast description="Persistent toast" duration={null} />
    </>
  );
}
```

### After

```tsx
import { useToast, useProgressToast, Toast } from '@cube-dev/ui-kit';

function MyComponent() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCopy = () => {
    toast.success('Copied to clipboard');
  };

  useProgressToast(
    isLoading
      ? { isLoading: true, title: 'Saving...' }
      : error
        ? { isLoading: false, title: 'Error saving', theme: 'danger' }
        : { isLoading: false, title: 'Saved!', theme: 'success' }
  );

  const handleSave = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      await save();
    } catch (e) {
      setError(e);
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <button onClick={handleCopy}>Copy</button>
      <Toast>Persistent toast</Toast>
    </>
  );
}
```
