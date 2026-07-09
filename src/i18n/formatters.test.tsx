import { act } from '@testing-library/react';

import { formatDate, formatNumber, useFormatter } from '../index';
import { renderWithRoot, screen, waitFor } from '../test';

import { createFormatter } from './createFormatter';
import { setActiveFormattingLocale } from './formatting-locale';

import { getUIKitI18n } from './index';

// A fixed instant so relative-time math is deterministic.
const NOW = new Date('2024-01-15T12:00:00Z').getTime();
const FIVE_MIN_AGO = NOW - 5 * 60 * 1000;

function FormatterProbe() {
  const {
    formatNumber: fmtNumber,
    formatCurrency,
    formatDate: fmtDate,
  } = useFormatter();

  return (
    <>
      <span data-qa="number">{fmtNumber(1234.5)}</span>
      <span data-qa="currency">{formatCurrency(1234.5)}</span>
      <span data-qa="date">{fmtDate(NOW, { timeZone: 'UTC' })}</span>
      <span data-qa="pure-number">{formatNumber(1234.5)}</span>
    </>
  );
}

describe('createFormatter (pure factory)', () => {
  it('formats numbers per locale', () => {
    expect(createFormatter('en-US').formatNumber(1234.5)).toBe('1,234.5');
    expect(createFormatter('de-DE').formatNumber(1234.5)).toBe('1.234,5');
  });

  it('formats currency per locale (USD default)', () => {
    expect(createFormatter('en-US').formatCurrency(1234.5)).toContain(
      '1,234.50',
    );
    expect(createFormatter('en-US').formatCurrency(1234.5)).toContain('$');
    expect(createFormatter('de-DE').formatCurrency(1234.5)).toContain(
      '1.234,50',
    );
  });

  it('formats percentages from a fraction', () => {
    expect(createFormatter('en-US').formatPercent(0.5)).toBe('50%');
    expect(createFormatter('de-DE').formatPercent(0.5)).toContain('50');
  });

  it('formats byte counts with an auto-scaled, localized unit', () => {
    // 1500 bytes → 1.5 kB (decimal, 1000-based).
    expect(createFormatter('en-US').formatBytes(1500)).toBe('1.5 kB');
    expect(createFormatter('de-DE').formatBytes(1500)).toContain('1,5');
    // Sub-kilobyte stays in whole bytes.
    expect(createFormatter('en-US').formatBytes(512)).toContain('512');
    // Larger magnitudes scale up.
    expect(createFormatter('en-US').formatBytes(2_500_000)).toContain('MB');
  });

  it('formats lists per locale', () => {
    expect(createFormatter('en-US').formatList(['a', 'b', 'c'])).toBe(
      'a, b, and c',
    );
    expect(createFormatter('de-DE').formatList(['a', 'b', 'c'])).toContain(
      'und',
    );
  });

  it('formats dates per locale (medium style)', () => {
    const enDate = createFormatter('en-US').formatDate(NOW, {
      timeZone: 'UTC',
    });
    expect(enDate).toContain('Jan');
    expect(enDate).toContain('2024');

    const deDate = createFormatter('de-DE').formatDate(NOW, {
      timeZone: 'UTC',
    });
    expect(deDate).toContain('2024');
    expect(deDate).toContain('15');
  });

  it('formats relative time per locale', () => {
    expect(
      createFormatter('en-US').formatRelativeTime(FIVE_MIN_AGO, { now: NOW }),
    ).toBe('5 minutes ago');
    expect(
      createFormatter('de-DE').formatRelativeTime(FIVE_MIN_AGO, { now: NOW }),
    ).toContain('Minuten');
  });

  it('returns an empty string for invalid dates', () => {
    expect(createFormatter('en-US').formatDate('not a date')).toBe('');
    expect(createFormatter('en-US').formatDate(NaN)).toBe('');
  });
});

describe('useFormatter + pure helpers follow the active language', () => {
  afterEach(async () => {
    await act(async () => {
      await getUIKitI18n().changeLanguage('en-US');
    });
    setActiveFormattingLocale('en-US');
  });

  it('binds the hook to the shared language and re-renders on change', async () => {
    // `Root` wraps children in `UIKitI18nProvider`, which drives React Aria's
    // locale (read by `useFormatter`) and the module mirror (read by the pure
    // helpers) from the shared i18next language.
    renderWithRoot(<FormatterProbe />);

    expect(screen.getByTestId('number')).toHaveTextContent('1,234.5');
    expect(screen.getByTestId('currency')).toHaveTextContent('$1,234.50');
    expect(screen.getByTestId('date')).toHaveTextContent('Jan 15, 2024');
    // Pure helper reads the provider-synced module mirror.
    expect(screen.getByTestId('pure-number')).toHaveTextContent('1,234.5');

    await act(async () => {
      await getUIKitI18n().changeLanguage('de-DE');
    });

    await waitFor(() => {
      expect(screen.getByTestId('number')).toHaveTextContent('1.234,5');
    });
    expect(screen.getByTestId('currency')).toHaveTextContent('1.234,50');
    expect(screen.getByTestId('pure-number')).toHaveTextContent('1.234,5');
  });

  it('formatDate pure helper follows the mirror', () => {
    setActiveFormattingLocale('de-DE');
    expect(formatDate(NOW, { timeZone: 'UTC' })).toContain('15');

    setActiveFormattingLocale('en-US');
    expect(formatDate(NOW, { timeZone: 'UTC' })).toContain('Jan');
  });
});
