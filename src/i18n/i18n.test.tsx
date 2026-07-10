import { act } from '@testing-library/react';
import { useTranslation } from 'react-i18next';

import { Tag } from '../index';
import { render, renderHook, screen, waitFor } from '../test';

import { SUPPORTED_LOCALES } from './locales';

import { addUIKitLocale, getI18n, UIKIT_I18N_NAMESPACE } from './index';

describe('UI Kit i18n', () => {
  afterEach(async () => {
    // Undo any locale change so specs don't leak into one another (the worker
    // shares the module graph with `isolate: false`).
    await act(async () => {
      await getI18n().changeLanguage('en-US');
    });
  });

  it('exposes exactly one shared instance', () => {
    // `getI18n()` must be stable across calls (the single owned instance).
    expect(getI18n()).toBe(getI18n());

    // `useTranslation` (bound to the shared instance) must resolve strings from
    // that same instance — i.e. the `uikit` bundle is registered on the object
    // the hook reads from. (Identity of the returned `i18n` ref is not asserted;
    // react-i18next may return a wrapped reference.)
    const { result } = renderHook(() =>
      useTranslation(UIKIT_I18N_NAMESPACE, { i18n: getI18n() }),
    );

    expect(
      result.current.i18n.hasResourceBundle('en-US', UIKIT_I18N_NAMESPACE),
    ).toBe(true);
    expect(result.current.t('tag.close')).toBe('Close');
  });

  it('ships every supported locale under the uikit namespace', () => {
    const i18n = getI18n();

    for (const locale of SUPPORTED_LOCALES) {
      expect(i18n.hasResourceBundle(locale, UIKIT_I18N_NAMESPACE)).toBe(true);
    }
  });

  it('renders the English default and re-renders when a host changes language', async () => {
    // `Tag` renders its close action with `aria-label={t('tag.close', 'Close')}`.
    render(<Tag isClosable>Example</Tag>);

    expect(screen.getByLabelText('Close')).toBeInTheDocument();

    // A host app driving the shared instance (Cube Cloud calling
    // `changeLanguage`) flips UI Kit strings for free — no separate instance.
    await act(async () => {
      await getI18n().changeLanguage('de-DE');
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Schließen')).toBeInTheDocument();
    });
  });

  it('lets a host register a new locale bundle via addUIKitLocale', async () => {
    // Simulate a host adding a language beyond the shipped set (or overriding a
    // string) — it must drive the same instance the components read from.
    addUIKitLocale('zz-ZZ', {
      tag: { close: 'Zzz' },
    });

    render(<Tag isClosable>Example</Tag>);

    await act(async () => {
      await getI18n().changeLanguage('zz-ZZ');
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Zzz')).toBeInTheDocument();
    });
  });

  it('supports the typed selector API (t($ => $.key)) hosts rely on', () => {
    const { result } = renderHook(() =>
      useTranslation(UIKIT_I18N_NAMESPACE, { i18n: getI18n() }),
    );

    const { t } = result.current;

    // The selector form is enabled via `enableSelector: true` at init — Cube
    // Cloud drives this same instance with the selector API.
    expect((t as any)(($: any) => $.tag.close)).toBe('Close');
  });
});
