import { getI18n, UIKIT_I18N_NAMESPACE } from './instance';

import type { UIKitResources } from './instance';

export { getI18n, UIKIT_I18N_NAMESPACE } from './instance';
export type { UIKitResources } from './instance';
// Internal hook — used by UI Kit components to read their own strings. Not part
// of the public barrel (`src/index.ts`); hosts use the re-exported
// `useTranslation` for their own strings.
export { useI18n } from './useI18n';
export { I18nProvider } from './I18nProvider';
export type { I18nProviderProps } from './I18nProvider';
export { createFormatter } from './createFormatter';
export type {
  Formatter,
  FormatDateInput,
  RelativeTimeOptions,
  CurrencyOptions,
  BytesOptions,
} from './createFormatter';
export { useFormatter } from './useFormatter';
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
  getI18n().addResourceBundle(
    locale,
    UIKIT_I18N_NAMESPACE,
    resources,
    true,
    true,
  );
}
