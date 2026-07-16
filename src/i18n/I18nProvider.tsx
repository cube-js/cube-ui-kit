import { I18nProvider as AriaI18nProvider } from 'react-aria';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { getI18n, UIKIT_I18N_NAMESPACE } from './instance';

import type { i18n as I18nInstance } from 'i18next';
import type { ReactNode } from 'react';

export interface I18nProviderProps {
  children: ReactNode;
  /**
   * i18next instance used by this tree. Pass a request-local instance from
   * `createUIKitI18n()` during SSR to prevent concurrent requests from sharing
   * mutable language state. Defaults to the browser-friendly shared instance.
   */
  i18n?: I18nInstance;
  /**
   * Force a specific BCP-47 locale for React Aria formatting instead of
   * following the active i18next language. Rarely needed — omit it so
   * date/number/collation formatting stays in sync with translated strings.
   */
  locale?: string;
}

/**
 * The UI Kit's single i18n provider. It wires up **both** localization layers
 * from one place:
 *
 * - `<I18nextProvider>` — supplies the selected i18next instance for translated
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
 * The locale bridge re-renders on `languageChanged`, keeping the two in sync
 * automatically.
 */
function AriaLocaleBridge({
  children,
  i18n,
  locale,
}: Required<Pick<I18nProviderProps, 'children' | 'i18n'>> &
  Pick<I18nProviderProps, 'locale'>) {
  const { i18n: activeI18n } = useTranslation(UIKIT_I18N_NAMESPACE, { i18n });
  const resolvedLocale =
    locale ?? activeI18n.resolvedLanguage ?? activeI18n.language;

  return (
    <AriaI18nProvider locale={resolvedLocale}>{children}</AriaI18nProvider>
  );
}

export function I18nProvider({
  children,
  i18n = getI18n(),
  locale,
}: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <AriaLocaleBridge i18n={i18n} locale={locale}>
        {children}
      </AriaLocaleBridge>
    </I18nextProvider>
  );
}
