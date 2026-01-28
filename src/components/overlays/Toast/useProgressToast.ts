import { Key, useEffect, useRef } from 'react';

import { useToastContext } from './ToastProvider';
import { getThemeIcon } from './useToast';

import type { ProgressToastEmpty, ProgressToastOptions } from './types';

const RESULT_DURATION = 3000;

/**
 * Check if the options represent an "empty" value (null, undefined, false, or empty object).
 * When empty, the hook should immediately remove any existing toast.
 */
function isEmptyOptions(
  options: ProgressToastOptions | ProgressToastEmpty,
): options is ProgressToastEmpty {
  if (options == null || options === false) return true;
  if (typeof options === 'object' && Object.keys(options).length === 0)
    return true;
  return false;
}

// Get string value for comparison (only strings are compared for re-show logic)
function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Hook to display a progress toast that persists while loading.
 *
 * @example
 * ```tsx
 * useProgressToast(
 *   isLoading
 *     ? { isLoading: true, title: 'Saving...', icon: <Spinner /> }
 *     : { isLoading: false, title: 'Saved!', icon: <IconCheck />, theme: 'success' }
 * );
 *
 * // Or with error handling:
 * useProgressToast(
 *   isLoading
 *     ? { isLoading: true, title: 'Saving...', icon: <Spinner /> }
 *     : isError
 *       ? { isLoading: false, title: 'Error', description: errorMessage, theme: 'danger' }
 *       : { isLoading: false, title: 'Saved!', theme: 'success' }
 * );
 *
 * // Pass empty value to immediately remove any existing toast:
 * useProgressToast(shouldShow ? { isLoading: true, title: 'Loading...' } : null);
 * ```
 */
export function useProgressToast(
  options: ProgressToastOptions | ProgressToastEmpty,
): void {
  const { addToast, removeToast } = useToastContext();

  const toastIdRef = useRef<Key | null>(null);
  const wasLoadingRef = useRef<boolean | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRenderRef = useRef(true);
  const optionsRef = useRef(options);
  const wasEmptyRef = useRef<boolean>(false);

  // Track previous string values for re-show comparison
  const prevThemeRef = useRef<string | undefined>(undefined);
  const prevTitleRef = useRef<string | undefined>(undefined);
  const prevDescriptionRef = useRef<string | undefined>(undefined);

  // Always update optionsRef to latest
  optionsRef.current = options;

  // Clear any pending hide timer
  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // Check if current options are empty
  const isEmpty = isEmptyOptions(options);

  // Extract values only when options are not empty
  const isLoading = isEmpty ? false : options.isLoading;
  const currentTheme = isEmpty ? undefined : options.theme;
  const currentTitle = isEmpty ? undefined : getStringValue(options.title);
  const currentDescription = isEmpty
    ? undefined
    : getStringValue(options.description);

  useEffect(() => {
    const wasLoading = wasLoadingRef.current;
    const wasEmpty = wasEmptyRef.current;
    const isFirstRender = isFirstRenderRef.current;
    const currentOptions = optionsRef.current;
    const currentIsEmpty = isEmptyOptions(currentOptions);

    // Handle empty options - immediately remove any existing toast
    if (currentIsEmpty) {
      clearHideTimer();

      if (toastIdRef.current != null) {
        removeToast(toastIdRef.current);
        toastIdRef.current = null;
      }

      // Update refs for next comparison
      wasLoadingRef.current = null;
      wasEmptyRef.current = true;
      isFirstRenderRef.current = false;
      prevThemeRef.current = undefined;
      prevTitleRef.current = undefined;
      prevDescriptionRef.current = undefined;
      return;
    }

    // From here, we know options is a valid ProgressToastOptions
    const { isLoading: currentIsLoading, ...currentToastData } = currentOptions;

    // Check if meaningful data changed (only string values)
    const themeChanged = currentTheme !== prevThemeRef.current;
    const titleChanged = currentTitle !== prevTitleRef.current;
    const descriptionChanged =
      currentDescription !== prevDescriptionRef.current;
    const dataChanged = themeChanged || titleChanged || descriptionChanged;

    // Helper to create a new toast (removes old one first if exists)
    const showToast = () => {
      // Remove existing toast if any
      if (toastIdRef.current != null) {
        removeToast(toastIdRef.current);
      }

      // Get appropriate icon based on theme and loading state
      const icon = getThemeIcon(
        currentToastData.theme,
        currentToastData.icon,
        currentIsLoading,
      );

      // Create new toast with fresh data
      toastIdRef.current = addToast(
        {
          ...currentToastData,
          icon,
          isLoading: currentIsLoading,
          duration: null, // Persistent - we control removal
        },
        true, // isProgress = true
      );
    };

    // Helper to show toast and schedule removal
    const showToastWithTimer = () => {
      showToast();

      // Schedule removal after result duration
      hideTimerRef.current = setTimeout(() => {
        if (toastIdRef.current != null) {
          removeToast(toastIdRef.current);
          toastIdRef.current = null;
        }
      }, RESULT_DURATION);
    };

    if (currentIsLoading) {
      // Starting or continuing loading
      clearHideTimer();

      if (toastIdRef.current == null) {
        // Create new toast
        showToast();
      } else if (dataChanged) {
        // Toast exists but data changed (e.g., switching back to loading from another state)
        showToast();
      }
    } else if ((wasLoading === true || wasEmpty) && !currentIsLoading) {
      // Transitioning from loading (or from empty) to not loading
      clearHideTimer();

      if (currentTitle) {
        // Show result toast with timer
        showToastWithTimer();
      } else {
        // No content - just remove the loading toast immediately
        if (toastIdRef.current != null) {
          removeToast(toastIdRef.current);
          toastIdRef.current = null;
        }
      }
    } else if (!currentIsLoading && !isFirstRender && dataChanged) {
      // Not loading, data changed - update or re-show toast
      // But only if there's meaningful content (non-empty title)
      if (currentTitle) {
        clearHideTimer();
        showToastWithTimer();
      } else if (toastIdRef.current != null) {
        // No content - hide existing toast
        clearHideTimer();
        removeToast(toastIdRef.current);
        toastIdRef.current = null;
      }
    }

    // Update refs for next comparison
    wasLoadingRef.current = currentIsLoading;
    wasEmptyRef.current = false;
    isFirstRenderRef.current = false;
    prevThemeRef.current = currentTheme;
    prevTitleRef.current = currentTitle;
    prevDescriptionRef.current = currentDescription;
  }, [
    isEmpty,
    isLoading,
    currentTheme,
    currentTitle,
    currentDescription,
    addToast,
    removeToast,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHideTimer();

      if (toastIdRef.current != null) {
        removeToast(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [removeToast]);
}
