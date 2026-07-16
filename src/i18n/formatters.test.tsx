import { PassThrough } from 'stream';

import { act } from '@testing-library/react';
import { Suspense } from 'react';
import { renderToPipeableStream, renderToString } from 'react-dom/server.node';

import { useFormatter } from '../index';
import { renderWithRoot, screen, waitFor } from '../test';

import { createFormatter } from './createFormatter';
import { I18nProvider } from './I18nProvider';

import { getI18n } from './index';

import type { Formatter } from './createFormatter';

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

describe('useFormatter', () => {
  afterEach(async () => {
    await act(async () => {
      await getI18n().changeLanguage('en-US');
    });
  });

  it('binds the hook to the shared language and re-renders on change', async () => {
    // `Root` wraps children in `I18nProvider`, which drives React Aria's locale
    // (read by `useFormatter`) from the shared i18next language.
    renderWithRoot(<FormatterProbe />);

    expect(screen.getByTestId('number')).toHaveTextContent('1,234.5');
    expect(screen.getByTestId('currency')).toHaveTextContent('$1,234.50');
    expect(screen.getByTestId('date')).toHaveTextContent('Jan 15, 2024');

    await act(async () => {
      await getI18n().changeLanguage('de-DE');
    });

    await waitFor(() => {
      expect(screen.getByTestId('number')).toHaveTextContent('1.234,5');
    });
    expect(screen.getByTestId('currency')).toHaveTextContent('1.234,50');
  });

  it('keeps explicit formatters scoped to their SSR request', async () => {
    let resolveRender: () => void;
    let isReady = false;
    const renderPromise = new Promise<void>((resolve) => {
      resolveRender = resolve;
    });
    const enFormatter = createFormatter('en-US');
    const deFormatter = createFormatter('de-DE');

    function DeferredNumber({ formatter }: { formatter: Formatter }) {
      if (!isReady) throw renderPromise;

      return <span>{formatter.formatNumber(1234.5)}</span>;
    }

    const output = new PassThrough();
    const chunks: Buffer[] = [];
    output.on('data', (chunk: Buffer) => chunks.push(chunk));
    const markup = new Promise<string>((resolve, reject) => {
      output.on('end', () => resolve(Buffer.concat(chunks).toString()));
      output.on('error', reject);
    });
    const shellReady = new Promise<void>((resolve, reject) => {
      const { pipe } = renderToPipeableStream(
        <I18nProvider locale="en-US">
          <Suspense fallback={<span>Loading</span>}>
            <DeferredNumber formatter={enFormatter} />
          </Suspense>
        </I18nProvider>,
        {
          onShellReady() {
            pipe(output);
            resolve();
          },
          onError: reject,
        },
      );
    });

    await shellReady;

    renderToString(
      <I18nProvider locale="de-DE">
        <span>{deFormatter.formatNumber(1234.5)}</span>
      </I18nProvider>,
    );

    isReady = true;
    resolveRender!();

    expect(await markup).toContain('1,234.5');
  });
});
