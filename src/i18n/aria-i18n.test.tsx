import { act } from '@testing-library/react';
import { useLocale, useNumberFormatter } from 'react-aria';

import { renderWithRoot, screen, waitFor } from '../test';

import { getI18n } from './index';

function LocaleProbe() {
  const { locale } = useLocale();
  const formatter = useNumberFormatter();

  return (
    <>
      <span data-qa="locale">{locale}</span>
      <span data-qa="number">{formatter.format(1234.5)}</span>
    </>
  );
}

describe('React Aria i18n bridge', () => {
  afterEach(async () => {
    await act(async () => {
      await getI18n().changeLanguage('en-US');
    });
  });

  it('feeds the shared i18next language into React Aria useLocale()', async () => {
    // `Root` wraps children in `I18nProvider`, which mirrors the shared
    // i18next language into React Aria's `I18nProvider`.
    renderWithRoot(<LocaleProbe />);

    expect(screen.getByTestId('locale')).toHaveTextContent('en-US');
    // en-US number formatting: comma thousands, dot decimal.
    expect(screen.getByTestId('number')).toHaveTextContent('1,234.5');

    await act(async () => {
      await getI18n().changeLanguage('de-DE');
    });

    await waitFor(() => {
      expect(screen.getByTestId('locale')).toHaveTextContent('de-DE');
    });
    // de-DE number formatting: dot thousands, comma decimal.
    expect(screen.getByTestId('number')).toHaveTextContent('1.234,5');
  });
});
