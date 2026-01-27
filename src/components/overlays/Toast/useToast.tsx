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

// Default icons for each theme (exported for use in useProgressToast)
export const THEME_ICONS: Partial<Record<ToastType, ReactNode>> = {
  success: <CheckIcon />,
  danger: <DangerIcon />,
  warning: <WarningIcon />,
  note: <InfoCircleIcon />,
};

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
  const defaultIcon = theme ? THEME_ICONS[theme] : undefined;

  if (isToastData(data)) {
    return {
      icon: defaultIcon,
      theme: defaultTheme,
      ...data,
    };
  }

  // String or ReactNode passed directly - use as title
  return {
    title: data,
    theme: defaultTheme,
    icon: defaultIcon,
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
