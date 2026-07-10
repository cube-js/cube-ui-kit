import { useTranslation } from 'react-i18next';

import { getI18n, UIKIT_I18N_NAMESPACE } from './instance';

/**
 * Internal hook every UI Kit component uses to read its own strings. It binds
 * to the shared UI Kit instance explicitly so translations resolve even when
 * the consumer has not wrapped the tree in an `<I18nextProvider>` (Storybook,
 * unit tests, non-i18next apps). When a host app connects its own instance to
 * this same object, the current language is shared automatically.
 */
export function useI18n() {
  return useTranslation(UIKIT_I18N_NAMESPACE, { i18n: getI18n() });
}
