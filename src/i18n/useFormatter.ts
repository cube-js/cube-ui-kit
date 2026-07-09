import { useMemo } from 'react';
import { useLocale } from 'react-aria';

import { createFormatter } from './createFormatter';
import { getActiveFormattingLocale } from './formatting-locale';

import type {
  BytesOptions,
  CurrencyOptions,
  FormatDateInput,
  Formatter,
} from './createFormatter';

/**
 * Returns locale-aware formatting helpers bound to the current UI language.
 *
 * The locale comes from React Aria's `useLocale()` — i.e. the nearest
 * `<I18nProvider>`, which `UIKitI18nProvider` populates from the shared i18next
 * language. So the returned helpers re-render and re-bind whenever the language
 * changes:
 *
 * ```tsx
 * const { formatDate, formatCurrency } = useFormatter();
 * return <span>{formatCurrency(1234.5)}</span>;
 * ```
 *
 * For non-component code (table column definitions, event handlers, plain
 * utilities) use the pure `formatDate` / `formatNumber` / ... exports instead —
 * they read the locale the provider mirrors into the module registry.
 */
export function useFormatter(): Formatter {
  const { locale } = useLocale();

  return useMemo(() => createFormatter(locale), [locale]);
}

// Pure (non-hook) helpers. They resolve the active locale from the module mirror
// on every call, so they always reflect the provider's current language without
// threading a locale argument through non-render call sites.
function activeFormatter(): Formatter {
  return createFormatter(getActiveFormattingLocale());
}

export function formatDate(
  value: FormatDateInput,
  options?: Intl.DateTimeFormatOptions,
): string {
  return activeFormatter().formatDate(value, options);
}

export function formatTime(
  value: FormatDateInput,
  options?: Intl.DateTimeFormatOptions,
): string {
  return activeFormatter().formatTime(value, options);
}

export function formatDateTime(
  value: FormatDateInput,
  options?: Intl.DateTimeFormatOptions,
): string {
  return activeFormatter().formatDateTime(value, options);
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return activeFormatter().formatNumber(value, options);
}

export function formatCurrency(
  value: number,
  options?: CurrencyOptions,
): string {
  return activeFormatter().formatCurrency(value, options);
}

export function formatPercent(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return activeFormatter().formatPercent(value, options);
}

export function formatBytes(value: number, options?: BytesOptions): string {
  return activeFormatter().formatBytes(value, options);
}

export function formatList(
  items: Iterable<string>,
  options?: Intl.ListFormatOptions,
): string {
  return activeFormatter().formatList(items, options);
}

// Note: the Intl relative-time formatter is intentionally NOT exported as a
// top-level pure function — `formatRelativeTime` is already a public export from
// the Notifications module (a compact, translation-key-based variant). Reach the
// Intl version via `useFormatter().formatRelativeTime` or
// `createFormatter(locale).formatRelativeTime`.
