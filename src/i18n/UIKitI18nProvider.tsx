import { I18nProvider } from 'react-aria';
import { I18nextProvider } from 'react-i18next';

import { setActiveFormattingLocale } from './formatting-locale';
import { getUIKitI18n } from './instance';
import { useUIKitTranslation } from './useUIKitTranslation';

import type { ReactNode } from 'react';

export interface UIKitI18nProviderProps {
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
 * Aria's locale from it, so a host calling
 * `getUIKitI18n().changeLanguage('de-DE')` gets German labels **and** German
 * number/date formatting with no extra setup. `useUIKitTranslation` re-renders on
 * `languageChanged`, keeping the two in sync automatically.
 */
export function UIKitI18nProvider({
  children,
  locale,
}: UIKitI18nProviderProps) {
  // Binds directly to the shared instance (not this component's own
  // `<I18nextProvider>` below), so it re-renders on `languageChanged` regardless
  // of nesting order.
  const { i18n } = useUIKitTranslation();
  const resolvedLocale = locale ?? i18n.language;

  // Mirror the active locale into the module registry so the pure (non-hook)
  // formatting helpers (`formatDate`, `formatNumber`, ...) follow the language
  // too. Set during render (not in an effect) so it's correct on first paint.
  setActiveFormattingLocale(resolvedLocale);

  return (
    <I18nextProvider i18n={getUIKitI18n()}>
      <I18nProvider locale={resolvedLocale}>{children}</I18nProvider>
    </I18nextProvider>
  );
}
