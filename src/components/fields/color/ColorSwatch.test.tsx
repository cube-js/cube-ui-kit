import { render } from '../../../test';

import { ColorSwatch } from './ColorSwatch';

describe('<ColorSwatch />', () => {
  it('shows a color given as a string', () => {
    const { getByTestId } = render(
      <ColorSwatch qa="Swatch" color="rgb(255 0 0)" />,
    );

    expect(getByTestId('Swatch')).toHaveStyle({
      '--color-picker-color': '#ff0000',
    });
  });

  it('falls back to the empty state without a color', () => {
    const { getByTestId } = render(<ColorSwatch qa="Swatch" />);

    expect(getByTestId('Swatch')).toHaveAttribute('data-empty');
  });

  it('marks an unparsable color empty rather than guessing', () => {
    const { getByTestId } = render(<ColorSwatch qa="Swatch" color="nope" />);

    expect(getByTestId('Swatch')).toHaveAttribute('data-empty');
  });

  it('accepts direct style props', () => {
    // `radius="round"` and friends have to work without reaching for `styles`.
    const { getByTestId } = render(
      <ColorSwatch qa="Swatch" color="#ff0000" radius="round" width="4x" />,
    );

    expect(getByTestId('Swatch')).toBeInTheDocument();
  });
});
