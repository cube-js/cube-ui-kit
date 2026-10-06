import { act } from '@testing-library/react';

import { getI18n } from '../../../i18n/instance';
import { renderWithRoot, screen, waitFor } from '../../../test';

import { Placeholder } from './Placeholder';

const loadingPlaceholders = () =>
  document.querySelectorAll('[data-loading-placeholder]');

describe('<Placeholder />', () => {
  afterEach(async () => {
    await act(async () => {
      await getI18n().changeLanguage('en-US');
    });
  });

  it('keeps its marker when the caller sets qa and aria-label', () => {
    renderWithRoot(
      <>
        <Placeholder />
        <Placeholder qa="Chart" aria-label="Loading chart" />
      </>,
    );

    expect(loadingPlaceholders()).toHaveLength(2);
    expect(screen.getByTestId('Chart')).toHaveAttribute(
      'data-loading-placeholder',
    );
  });

  it('keeps its marker in another locale while the label is translated', async () => {
    renderWithRoot(<Placeholder />);

    await act(async () => {
      await getI18n().changeLanguage('de-DE');
    });

    const region = await waitFor(() =>
      screen.getByRole('region', { name: 'Inhalt wird geladen' }),
    );

    expect(region).toHaveAttribute('data-loading-placeholder');
  });
});
