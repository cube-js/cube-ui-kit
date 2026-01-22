import { useLayoutEffect, useRef, useState } from 'react';
import { useTextField } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';

import { EditableTitleInputElement, HiddenMeasure } from './styled';

import type { FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface EditableTitleProps {
  /** The current title to display (when not editing) */
  title: ReactNode;
  /** Whether the title is currently being edited */
  isEditing: boolean;
  /** Current edit input value */
  editValue: string;
  /** Callback when edit value changes */
  onEditValueChange: (value: string) => void;
  /** Callback to start editing (e.g., on double-click) */
  onStartEditing: () => void;
  /** Callback when editing is submitted (Enter or blur) */
  onSubmit: () => void;
  /** Callback when editing is cancelled (Escape) */
  onCancel: () => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Inline editable title component for tab labels.
 *
 * When not editing, displays the title as a span with double-click to edit.
 * When editing, displays an auto-sizing input field.
 */
export function EditableTitle({
  title,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEditing,
  onSubmit,
  onCancel,
}: EditableTitleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const justEnteredEditModeRef = useRef(false);

  // React Aria text field hook
  const { inputProps } = useTextField(
    {
      'aria-label': 'Edit tab title',
      value: editValue,
      onChange: onEditValueChange,
    },
    inputRef,
  );

  // Focus and select input when entering edit mode
  useLayoutEffect(() => {
    if (isEditing && inputRef.current) {
      const input = inputRef.current;

      // Set flag to ignore immediate blur events
      justEnteredEditModeRef.current = true;

      input.focus();
      // Use requestAnimationFrame to ensure selection happens after focus
      requestAnimationFrame(() => {
        input.select();
        // Clear the flag after focus is established (allow 2 frames for menu to fully close)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            justEnteredEditModeRef.current = false;
          });
        });
      });
    } else {
      justEnteredEditModeRef.current = false;
    }
  }, [isEditing]);

  // Measure text width and update input width
  useLayoutEffect(() => {
    if (isEditing && measureRef.current) {
      const width = measureRef.current.scrollWidth;
      setInputWidth(width);
    }
  }, [isEditing, editValue]);

  const handleKeyDown = useEvent((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === ' '
    ) {
      // Stop propagation to prevent tab navigation while editing
      e.stopPropagation();
    }
  });

  const handleBlur = useEvent(() => {
    // Ignore blur events immediately after entering edit mode (menu closing causes focus loss)
    if (justEnteredEditModeRef.current) {
      // Re-focus the input since something else stole focus
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return;
    }
    // Submit on blur
    onSubmit();
  });

  const handleDoubleClick = useEvent((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartEditing();
  });

  if (isEditing) {
    // Merge our handlers with React Aria's inputProps
    const mergedProps = {
      ...inputProps,
      onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
        handleKeyDown(e);
        inputProps.onKeyDown?.(e);
      },
      onBlur: (e: FocusEvent<HTMLInputElement>) => {
        handleBlur();
        inputProps.onBlur?.(e);
      },
    };

    return (
      <>
        <HiddenMeasure ref={measureRef} aria-hidden="true">
          {editValue || ' '}
        </HiddenMeasure>
        <EditableTitleInputElement
          {...mergedProps}
          ref={inputRef}
          tokens={{ '$input-width': inputWidth ? `${inputWidth}px` : 'auto' }}
        />
      </>
    );
  }

  return <span onDoubleClick={handleDoubleClick}>{title}</span>;
}
