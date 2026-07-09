import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { SUPPORTED_LOCALES } from './locales';
import deDE from './locales/de-DE/uikit.json';
import enUS from './locales/en-US/uikit.json';
import esES from './locales/es-ES/uikit.json';
import esMX from './locales/es-MX/uikit.json';
import frFR from './locales/fr-FR/uikit.json';
import itIT from './locales/it-IT/uikit.json';
import jaJP from './locales/ja-JP/uikit.json';
import nbNO from './locales/nb-NO/uikit.json';
import ptBR from './locales/pt-BR/uikit.json';
import ptPT from './locales/pt-PT/uikit.json';
import svSE from './locales/sv-SE/uikit.json';
import viVN from './locales/vi-VN/uikit.json';

import type { i18n as I18nInstance } from 'i18next';

/** The dedicated namespace all UI Kit strings live under. */
export const UIKIT_I18N_NAMESPACE = 'uikit';

/** Shape of the UI Kit translation bundle (the `en-US` source of truth). */
export type UIKitResources = typeof enUS;

const BUNDLES: Record<(typeof SUPPORTED_LOCALES)[number], UIKitResources> = {
  'en-US': enUS,
  'de-DE': deDE,
  'es-ES': esES,
  'es-MX': esMX,
  'fr-FR': frFR,
  'it-IT': itIT,
  'ja-JP': jaJP,
  'nb-NO': nbNO,
  'pt-BR': ptBR,
  'pt-PT': ptPT,
  'sv-SE': svSE,
  'vi-VN': viVN,
};

// Every locale is tiny (~40 keys), so all are registered eagerly at init —
// no code-splitting/loader machinery is needed.
const resources = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [
    locale,
    { [UIKIT_I18N_NAMESPACE]: BUNDLES[locale] },
  ]),
);

/**
 * The single i18next instance the UI Kit owns and exports. `useTranslation`
 * (re-exported from the UI Kit) and `<I18nextProvider>` both reference this
 * object, so a host app that drives it (e.g. Cube Cloud registering its own
 * namespaces onto it and calling `changeLanguage`) shares one instance —
 * switching language in the host switches UI Kit strings for free.
 */
const instance: I18nInstance = i18next.createInstance();

void instance.use(initReactI18next).init({
  resources,
  lng: 'en-US',
  fallbackLng: 'en-US',
  // Full BCP-47 codes only — don't let i18next strip `es-ES` to a bare `es`
  // bundle (which we don't ship); an unmatched code falls back to `en-US`.
  load: 'currentOnly',
  defaultNS: UIKIT_I18N_NAMESPACE,
  ns: [UIKIT_I18N_NAMESPACE],
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: true,
  // All resources are bundled synchronously at init, so the instance is ready
  // immediately — disable Suspense so components (and unit tests / SSR) render
  // translated text on the first pass without a Suspense boundary.
  react: { useSuspense: false },
  // Proxy-based selector API (`t($ => $.a.b)`). UI Kit components use plain
  // string keys, but Cube Cloud drives this same instance with the selector
  // form, so enabling it here preserves that contract once Cloud consumes the
  // exported instance.
  enableSelector: true,
});

/** Returns the shared UI Kit i18next instance. */
export function getUIKitI18n(): I18nInstance {
  return instance;
}

export default instance;
