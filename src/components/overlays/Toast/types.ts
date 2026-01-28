import type { Key, ReactNode } from 'react';
import type { CubeItemProps } from '../../content/Item/Item';

export type ToastType = 'default' | 'success' | 'danger' | 'warning' | 'note';

export interface ToastData {
  /** Unique identifier for deduplication (auto-generated if not provided) */
  id?: Key;
  /** Primary content (→ Item children) */
  title?: ReactNode;
  /** Secondary content (or primary if no title) */
  description?: ReactNode;
  /** Visual theme */
  theme?: ToastType;
  /** Icon to display */
  icon?: ReactNode;
  /** Whether the toast is in loading state (shows loading indicator) */
  isLoading?: boolean;
  /** Duration in ms before auto-dismiss. null = persistent */
  duration?: number | null;
  /** Additional Item props to pass through */
  itemProps?: Partial<CubeItemProps>;
}

export interface ProgressToastOptions extends Omit<ToastData, 'duration'> {
  /** Whether the toast is in loading state */
  isLoading: boolean;
  // Re-shows toast if theme/description/icon change by reference while not visible
}

/**
 * Empty value that indicates no toast should be shown.
 * When passed to useProgressToast, any existing toast is immediately removed.
 */
export type ProgressToastEmpty =
  | null
  | undefined
  | false
  | Record<string, never>;

export interface ToastApi {
  /** Show a toast with default theme */
  (data: ToastData | ReactNode): Key;
  /** Show a success toast */
  success: (data: ToastData | ReactNode) => Key;
  /** Show a danger toast */
  danger: (data: ToastData | ReactNode) => Key;
  /** Show a warning toast */
  warning: (data: ToastData | ReactNode) => Key;
  /** Show a note toast */
  note: (data: ToastData | ReactNode) => Key;
  /** Remove a toast by id */
  remove: (id: Key) => void;
}

export interface InternalToast extends ToastData {
  /** Internal unique identifier */
  internalId: string;
  /** Whether this is a progress toast (persistent) */
  isProgress: boolean;
  /** Deduplication key */
  dedupeKey: string;
  /** Timestamp when toast was created */
  createdAt: number;
  /** Whether the toast is exiting (used for exit transition) */
  isExiting?: boolean;
}

export interface ToastContextValue {
  /** Add a toast */
  addToast: (data: ToastData, isProgress?: boolean) => Key;
  /** Remove a toast by id */
  removeToast: (id: Key) => void;
  /** Update a toast */
  updateToast: (id: Key, data: Partial<ToastData>) => void;
  /** Current toasts */
  toasts: InternalToast[];
}
