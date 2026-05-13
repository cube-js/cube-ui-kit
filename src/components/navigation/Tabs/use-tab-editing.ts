import { useCallback, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseTabEditingOptions {
  /** Callback when tab selection changes (used to select tab when editing starts) */
  onChange?: (key: string) => void;
  /** Callback when a tab title is changed */
  onTitleChange?: (key: string, newTitle: string) => void;
}

export interface UseTabEditingResult {
  /** Currently editing tab key (null if not editing) */
  editingKey: string | null;
  /** Start editing the given tab. The `currentTitle` argument is kept for API compatibility but is no longer used internally — `InlineInput` manages the draft. */
  startEditing: (key: string, currentTitle?: string) => void;
  /** Submit the current edit */
  submitEditing: (
    key: string,
    newTitle: string,
    tabOnTitleChange?: (title: string) => void,
  ) => void;
  /** Cancel the current edit */
  cancelEditing: () => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to manage tab title editing state.
 *
 * Provides state and callbacks for inline title editing with support for:
 * - Starting edit mode (selecting the tab)
 * - Submitting changes (with tab-level or parent-level callback)
 * - Canceling edits
 *
 * The draft value is managed inside `InlineInput`; this hook only tracks
 * which tab (if any) is currently editing.
 */
export function useTabEditing({
  onChange,
  onTitleChange,
}: UseTabEditingOptions = {}): UseTabEditingResult {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const startEditing = useCallback(
    (key: string) => {
      onChange?.(key);
      setEditingKey(key);
    },
    [onChange],
  );

  const cancelEditing = useCallback(() => {
    setEditingKey(null);
  }, []);

  const submitEditing = useCallback(
    (
      key: string,
      newTitle: string,
      tabOnTitleChange?: (title: string) => void,
    ) => {
      const trimmed = newTitle.trim();

      if (trimmed) {
        // Tab-level callback takes precedence
        if (tabOnTitleChange) {
          tabOnTitleChange(trimmed);
        } else if (onTitleChange) {
          onTitleChange(key, trimmed);
        }
      }

      setEditingKey(null);
    },
    [onTitleChange],
  );

  return {
    editingKey,
    startEditing,
    cancelEditing,
    submitEditing,
  };
}
