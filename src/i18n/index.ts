export { createUIKitI18n, getI18n, UIKIT_I18N_NAMESPACE } from './instance';
export type { UIKitResources } from './instance';
export { addUIKitLocale } from './add-uikit-locale';
// Internal hook — used by UI Kit components to read their own strings. Not part
// of the public barrel (`src/index.ts`); hosts use the re-exported
// `useTranslation` for their own strings.
export { useI18n } from './use-i18n';
export { I18nProvider } from './I18nProvider';
export type { I18nProviderProps } from './I18nProvider';
export { createFormatter } from './create-formatter';
export type {
  Formatter,
  FormatDateInput,
  RelativeTimeOptions,
  CurrencyOptions,
  BytesOptions,
} from './create-formatter';
export { useFormatter } from './use-formatter';
export { SUPPORTED_LOCALES, LOCALE_LABELS, isSupportedLocale } from './locales';
export type { SupportedLocale } from './locales';
