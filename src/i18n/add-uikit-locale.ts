import { getI18n, UIKIT_I18N_NAMESPACE } from './instance';

import type { UIKitResources } from './instance';

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
