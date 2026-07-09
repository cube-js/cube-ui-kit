import { getUIKitI18n, UIKIT_I18N_NAMESPACE } from './instance';

import type { UIKitResources } from './instance';

export {
  default as uiKitI18n,
  getUIKitI18n,
  UIKIT_I18N_NAMESPACE,
} from './instance';
export type { UIKitResources } from './instance';
export { useUIKitTranslation } from './useUIKitTranslation';
export { UIKitI18nProvider } from './UIKitI18nProvider';
export type { UIKitI18nProviderProps } from './UIKitI18nProvider';
export { createFormatter } from './createFormatter';
export type {
  Formatter,
  FormatDateInput,
  RelativeTimeOptions,
  CurrencyOptions,
  BytesOptions,
} from './createFormatter';
export {
  getActiveFormattingLocale,
  setActiveFormattingLocale,
} from './formatting-locale';
export {
  useFormatter,
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatBytes,
  formatList,
} from './useFormatter';
export { SUPPORTED_LOCALES, LOCALE_LABELS, isSupportedLocale } from './locales';
export type { SupportedLocale } from './locales';

/**
 * Register (or override) the UI Kit translation bundle for a locale. Use this
 * to add languages beyond the ones the UI Kit ships, or to override individual
 * strings. Applied to the shared instance so it takes effect immediately.
 */
export function addUIKitLocale(
  locale: string,
  resources: Partial<UIKitResources>,
): void {
  getUIKitI18n().addResourceBundle(
    locale,
    UIKIT_I18N_NAMESPACE,
    resources,
    true,
    true,
  );
}

export interface ConfigureUIKitI18nOptions {
  /**
   * Default namespace to set on the shared instance. Host apps that own their
   * own strings (e.g. Cube Cloud with a `chat` default) can set it here; UI Kit
   * components always request the `uikit` namespace explicitly, so they are
   * unaffected either way.
   */
  defaultNS?: string;
}

/** Adjust host-facing options on the shared UI Kit i18next instance. */
export function configureUIKitI18n(options: ConfigureUIKitI18nOptions): void {
  if (options.defaultNS) {
    getUIKitI18n().setDefaultNamespace(options.defaultNS);
  }
}
