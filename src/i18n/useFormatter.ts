import { useMemo } from 'react';
import { useLocale } from 'react-aria';

import { createFormatter } from './createFormatter';

import type { Formatter } from './createFormatter';

/**
 * Returns locale-aware formatting helpers bound to the current UI language.
 *
 * The locale comes from React Aria's `useLocale()` — i.e. the nearest
 * `<I18nProvider>`, which populates React Aria's locale from the shared i18next
 * language. So the returned helpers re-render and re-bind whenever the language
 * changes:
 *
 * ```tsx
 * const { formatDate, formatCurrency } = useFormatter();
 * return <span>{formatCurrency(1234.5)}</span>;
 * ```
 *
 * For non-component code (table column definitions, event handlers, plain
 * utilities), create a formatter with the relevant locale:
 * `createFormatter(locale)`. Explicit locale binding is safe for concurrent
 * server renders.
 */
export function useFormatter(): Formatter {
  const { locale } = useLocale();

  return useMemo(() => createFormatter(locale), [locale]);
}
