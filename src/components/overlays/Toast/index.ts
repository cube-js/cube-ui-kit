// Declarative Toast component
import { Key, ReactNode, useEffect, useRef } from 'react';

import { useToastContext } from './ToastProvider';
import { ProgressToastOptions, ToastData, ToastType } from './types';
import { useProgressToast } from './useProgressToast';

export { ToastProvider, useToastContext } from './ToastProvider';
export { ToastItem } from './ToastItem';
export type { ToastItemProps } from './ToastItem';
export { useToast } from './useToast';
export { useProgressToast } from './useProgressToast';
export type {
  ToastData,
  ToastType,
  ToastApi,
  ProgressToastOptions,
} from './types';

export interface ToastProps extends Omit<ToastData, 'duration'> {
  /** Primary content */
  children?: ReactNode;
  /** Duration is ignored for declarative toasts - they stay visible while mounted */
}

/**
 * Declarative Toast component that shows a toast while mounted.
 *
 * @example
 * ```tsx
 * // Simple toast (visible while mounted)
 * <Toast theme="success">Saved successfully</Toast>
 *
 * // With description
 * <Toast title="Success" description="Changes saved" theme="success" />
 * ```
 */
export function Toast(props: ToastProps): null {
  const { children, ...toastData } = props;
  const { addToast, removeToast, updateToast } = useToastContext();
  const toastIdRef = useRef<Key | null>(null);

  useEffect(() => {
    // Add toast on mount
    toastIdRef.current = addToast(
      {
        ...toastData,
        title: toastData.title ?? children,
        duration: null, // Persistent while mounted
      },
      true, // isProgress = true (persistent)
    );

    return () => {
      // Remove toast on unmount
      if (toastIdRef.current != null) {
        removeToast(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, []);

  // Update toast when props change
  useEffect(() => {
    if (toastIdRef.current != null) {
      updateToast(toastIdRef.current, {
        ...toastData,
        title: toastData.title ?? children,
      });
    }
  }, [
    children,
    toastData.title,
    toastData.description,
    toastData.theme,
    toastData.icon,
  ]);

  return null;
}

export interface ToastProgressProps extends ProgressToastOptions {
  /** Primary content (alternative to title) */
  children?: ReactNode;
}

/**
 * Declarative Progress Toast component.
 *
 * @example
 * ```tsx
 * <Toast.Progress
 *   {...(isLoading
 *     ? { isLoading: true, title: 'Saving...' }
 *     : { isLoading: false, title: 'Saved!', theme: 'success' }
 *   )}
 * />
 * ```
 */
function ToastProgress(props: ToastProgressProps): null {
  const { children, ...progressOptions } = props;

  useProgressToast({
    ...progressOptions,
    title: progressOptions.title ?? children,
  });

  return null;
}

Toast.Progress = ToastProgress;

// Type for compound component
export type ToastComponent = typeof Toast & {
  Progress: typeof ToastProgress;
};
