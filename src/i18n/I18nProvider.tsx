import { I18nProvider as AriaI18nProvider } from 'react-aria';
import { I18nextProvider } from 'react-i18next';

import { getI18n } from './instance';
import { useI18n } from './useI18n';

import type { ReactNode } from 'react';

export interface I18nProviderProps {
  children: ReactNode;
  /**
   * Force a specific BCP-47 locale for React Aria formatting instead of
   * following the shared i18next language. Rarely needed — omit it so
   * date/number/collation formatting stays in sync with translated strings.
   */
  locale?: string;
}

/**
 * The UI Kit's single i18n provider. It wires up **both** localization layers
 * from one place:
 *
 * - `<I18nextProvider>` — supplies the shared i18next instance for translated
 *   strings (`useTranslation`, `Trans`, ...).
 * - React Aria's `<I18nProvider>` — supplies the locale that React Aria's
 *   formatting hooks read (`useLocale`, `useDateFormatter`, `useNumberFormatter`,
 *   `useCollator`, `useFilter`, ...).
 *
 * These are two independent library contexts, so they can't be a single physical
 * provider — but the language is one concept, owned by the i18next instance. This
 * component makes the instance the single source of truth and *derives* React
 * Aria's locale from it, so a host calling `getI18n().changeLanguage('de-DE')`
 * gets German labels **and** German number/date formatting with no extra setup.
 * `useI18n` re-renders on `languageChanged`, keeping the two in sync
 * automatically.
 */
export function I18nProvider({ children, locale }: I18nProviderProps) {
  // Binds directly to the shared instance (not this component's own
  // `<I18nextProvider>` below), so it re-renders on `languageChanged` regardless
  // of nesting order.
  const { i18n } = useI18n();
  const resolvedLocale = locale ?? i18n.language;

  return (
    <I18nextProvider i18n={getI18n()}>
      <AriaI18nProvider locale={resolvedLocale}>{children}</AriaI18nProvider>
    </I18nextProvider>
  );
}
