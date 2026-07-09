/**
 * Locales the UI Kit ships translations for. This mirrors the set that Cube
 * Cloud supports so that, when the UI Kit's shared i18next instance is driven
 * by the host app, UI Kit strings are already localized for every language the
 * host can switch to. The list is intentionally self-contained (no dependency
 * on the cloud `cross-runtime` package) so the UI Kit stays standalone.
 */
export const SUPPORTED_LOCALES = [
  'en-US',
  'de-DE',
  'es-ES',
  'es-MX',
  'fr-FR',
  'it-IT',
  'ja-JP',
  'nb-NO',
  'pt-BR',
  'pt-PT',
  'sv-SE',
  'vi-VN',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Human-readable label for each supported locale (endonym). */
export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  'en-US': 'English (US)',
  'de-DE': 'Deutsch',
  'es-ES': 'Español (España)',
  'es-MX': 'Español (Latinoamérica)',
  'fr-FR': 'Français',
  'it-IT': 'Italiano',
  'ja-JP': '日本語',
  'nb-NO': 'Norsk bokmål',
  'pt-BR': 'Português (Brasil)',
  'pt-PT': 'Português (Portugal)',
  'sv-SE': 'Svenska',
  'vi-VN': 'Tiếng Việt',
};

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}
