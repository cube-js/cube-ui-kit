import { Key, ReactNode, useEffect, useRef } from 'react';

import { useToastContext } from './ToastProvider';
import { THEME_ICONS } from './useToast';

import type { ProgressToastOptions, ToastType } from './types';

const RESULT_DURATION = 3000;

// Get string value for comparison (only strings are compared for re-show logic)
function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

// Get default icon for a theme (only when not loading and no icon provided)
function getDefaultIcon(
  isLoading: boolean,
  icon: ReactNode | undefined,
  theme: ToastType | undefined,
): ReactNode | undefined {
  // Don't apply default icon when loading (loading state has its own indicator)
  if (isLoading) return icon;

  // If icon is explicitly provided, use it
  if (icon !== undefined) return icon;

  // Apply theme-based default icon
  return theme ? THEME_ICONS[theme] : undefined;
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
 * ```
 */
export function useProgressToast(options: ProgressToastOptions): void {
  const { isLoading, ...toastData } = options;
  const { addToast, removeToast } = useToastContext();

  const toastIdRef = useRef<Key | null>(null);
  const wasLoadingRef = useRef<boolean | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRenderRef = useRef(true);
  const optionsRef = useRef(options);

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

  // Get current string values for comparison
  const currentTheme = toastData.theme;
  const currentTitle = getStringValue(toastData.title);
  const currentDescription = getStringValue(toastData.description);

  useEffect(() => {
    const wasLoading = wasLoadingRef.current;
    const isFirstRender = isFirstRenderRef.current;
    const currentOptions = optionsRef.current;
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

      // Get default icon based on theme (only when not loading)
      const icon = getDefaultIcon(
        currentIsLoading,
        currentToastData.icon,
        currentToastData.theme,
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
    } else if (wasLoading === true && !currentIsLoading) {
      // Transitioning from loading to not loading
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
    isFirstRenderRef.current = false;
    prevThemeRef.current = currentTheme;
    prevTitleRef.current = currentTitle;
    prevDescriptionRef.current = currentDescription;
  }, [
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
