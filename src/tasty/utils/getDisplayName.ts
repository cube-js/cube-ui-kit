import { ElementType } from 'react';

const DEFAULT_NAME = 'Anonymous';

export function getDisplayName<T>(
  Component: ElementType<T>,
  fallbackName = DEFAULT_NAME,
): string {
  if (typeof Component === 'function') {
    return Component.displayName ?? Component.name ?? fallbackName;
  }

  return fallbackName;
}
