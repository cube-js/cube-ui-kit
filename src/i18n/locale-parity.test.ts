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

const BUNDLES: Record<string, Record<string, unknown>> = {
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

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    return value !== null && typeof value === 'object'
      ? flattenKeys(value as Record<string, unknown>, path)
      : [path];
  });
}

function interpolationTokens(value: string): string[] {
  return (value.match(/\{\{[^}]+\}\}/g) ?? []).sort();
}

function collectValues(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  return Object.entries(obj).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object') {
        Object.assign(
          acc,
          collectValues(value as Record<string, unknown>, path),
        );
      } else if (typeof value === 'string') {
        acc[path] = value;
      }

      return acc;
    },
    {},
  );
}

describe('UI Kit locale bundles', () => {
  const baseKeys = flattenKeys(enUS).sort();
  const baseValues = collectValues(enUS);

  it('registers a bundle for every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(BUNDLES[locale]).toBeDefined();
    }

    expect(Object.keys(BUNDLES).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it.each(SUPPORTED_LOCALES)('%s has exactly the en-US key set', (locale) => {
    const keys = flattenKeys(BUNDLES[locale]).sort();

    expect(keys).toEqual(baseKeys);
  });

  it.each(SUPPORTED_LOCALES)(
    '%s preserves the {{interpolation}} tokens of en-US',
    (locale) => {
      const values = collectValues(BUNDLES[locale]);

      for (const key of baseKeys) {
        expect(interpolationTokens(values[key])).toEqual(
          interpolationTokens(baseValues[key]),
        );
      }
    },
  );
});
