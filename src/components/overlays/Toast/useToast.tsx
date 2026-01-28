import { isValidElement, Key, ReactNode, useMemo } from 'react';
import { isFragment } from 'react-is';

import {
  CheckIcon,
  DangerIcon,
  InfoCircleIcon,
  WarningIcon,
} from '../../../icons';

import { useToastContext } from './ToastProvider';

import type { ToastApi, ToastData, ToastType } from './types';

// Default icons for each theme
const THEME_ICONS: Partial<Record<ToastType, ReactNode>> = {
  success: <CheckIcon />,
  danger: <DangerIcon />,
  warning: <WarningIcon />,
  note: <InfoCircleIcon />,
};

/**
 * Get the appropriate icon for a toast based on theme and loading state.
 * - When loading, returns the provided icon as-is (loading indicator is separate)
 * - When not loading, returns the provided icon or falls back to theme-based default
 */
export function getThemeIcon(
  theme: ToastType | undefined,
  icon: ReactNode | undefined,
  isLoading?: boolean,
): ReactNode | undefined {
  // When loading, don't apply theme icons (loading indicator is shown separately)
  if (isLoading) return icon;

  // If icon is explicitly provided, use it
  if (icon !== undefined) return icon;

  // Apply theme-based default icon
  return theme ? THEME_ICONS[theme] : undefined;
}

function isToastData(data: ToastData | ReactNode): data is ToastData {
  // ReactNode includes: ReactElement | string | number | boolean | null | undefined | Iterable<ReactNode>
  const isReactNode =
    isValidElement(data) ||
    isFragment(data) ||
    typeof data === 'string' ||
    typeof data === 'number' ||
    typeof data === 'boolean' ||
    data === null ||
    data === undefined ||
    Array.isArray(data);

  return !isReactNode;
}

function normalizeToastData(
  data: ToastData | ReactNode,
  defaultTheme?: ToastType,
): ToastData {
  const theme = isToastData(data) ? data.theme ?? defaultTheme : defaultTheme;
  const isLoading = isToastData(data) ? data.isLoading : undefined;
  const providedIcon = isToastData(data) ? data.icon : undefined;
  const icon = getThemeIcon(theme, providedIcon, isLoading);

  if (isToastData(data)) {
    return {
      ...data,
      theme: data.theme ?? defaultTheme,
      icon,
    };
  }

  // String or ReactNode passed directly - use as title
  return {
    title: data,
    theme: defaultTheme,
    icon,
  };
}

/**
 * Hook to display toast notifications.
 *
 * @example
 * ```tsx
 * const toast = useToast();
 *
 * // String shorthand
 * toast.success('Copied to clipboard');
 *
 * // Object with options
 * toast.success({
 *   title: 'Success',
 *   description: 'File copied to clipboard',
 *   icon: <CustomIcon />,
 *   duration: 3000,
 * });
 *
 * // Methods: toast(), toast.success(), toast.danger(), toast.warning(), toast.note()
 * ```
 */
export function useToast(): ToastApi {
  const { addToast, removeToast } = useToastContext();

  const api = useMemo<ToastApi>(() => {
    const toast = (data: ToastData | ReactNode): Key => {
      return addToast(normalizeToastData(data));
    };

    toast.success = (data: ToastData | ReactNode): Key => {
      return addToast(normalizeToastData(data, 'success'));
    };

    toast.danger = (data: ToastData | ReactNode): Key => {
      return addToast(normalizeToastData(data, 'danger'));
    };

    toast.warning = (data: ToastData | ReactNode): Key => {
      return addToast(normalizeToastData(data, 'warning'));
    };

    toast.note = (data: ToastData | ReactNode): Key => {
      return addToast(normalizeToastData(data, 'note'));
    };

    toast.remove = (id: Key): void => {
      removeToast(id);
    };

    return toast;
  }, [addToast, removeToast]);

  return api;
}
