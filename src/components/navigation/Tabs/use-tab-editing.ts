import { useCallback, useState } from 'react';

import { chainRaf } from '../../../utils/raf';

import type { Key } from '@react-types/shared';

// =============================================================================
// Types
// =============================================================================

export interface UseTabEditingOptions {
  /** Callback when tab selection changes (used to select tab when editing starts) */
  onChange?: (key: Key) => void;
  /** Callback when a tab title is changed */
  onTitleChange?: (key: Key, newTitle: string) => void;
}

export interface UseTabEditingResult {
  /** Currently editing tab key (null if not editing) */
  editingKey: Key | null;
  /** Current edit input value */
  editValue: string;
  /** Set the edit value */
  setEditValue: (value: string) => void;
  /** Start editing a tab with the given title */
  startEditing: (key: Key, currentTitle: string) => void;
  /** Submit the current edit */
  submitEditing: (
    key: Key,
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
 * - Starting edit mode (selecting the tab and focusing input)
 * - Submitting changes (with tab-level or parent-level callback)
 * - Canceling edits
 */
export function useTabEditing({
  onChange,
  onTitleChange,
}: UseTabEditingOptions = {}): UseTabEditingResult {
  const [editingKey, setEditingKey] = useState<Key | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = useCallback(
    (key: Key, currentTitle: string) => {
      // Also select the tab being edited
      onChange?.(key);
      // Use chainRaf to ensure DOM is ready before entering edit mode
      chainRaf(() => {
        setEditingKey(key);
        setEditValue(currentTitle);
      }, 2);
    },
    [onChange],
  );

  const cancelEditing = useCallback(() => {
    setEditingKey(null);
    setEditValue('');
  }, []);

  const submitEditing = useCallback(
    (
      key: Key,
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
      setEditValue('');
    },
    [onTitleChange],
  );

  return {
    editingKey,
    editValue,
    setEditValue,
    startEditing,
    cancelEditing,
    submitEditing,
  };
}
