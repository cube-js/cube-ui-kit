import { useTranslation } from 'react-i18next';

import { UIKIT_I18N_NAMESPACE } from './namespace';

/**
 * Internal hook every UI Kit component uses to read its own strings. It reads
 * the nearest `<I18nextProvider>` so SSR can supply a request-local instance.
 * Without a provider, react-i18next falls back to the initialized default UI
 * Kit instance for backward compatibility. This module does not import that
 * instance, so the twelve locale bundles stay out of a bundle that only reads
 * strings; `<Root>` loads it, through `I18nProvider`.
 */
export function useI18n() {
  return useTranslation(UIKIT_I18N_NAMESPACE);
}
