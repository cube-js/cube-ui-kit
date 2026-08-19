import { render, renderWithRoot } from '../../../test';
import { ColorInput } from '../ColorInput';

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

  it('carries the size as a data attribute for the style rule to read', () => {
    const { getByTestId } = render(
      <ColorSwatch qa="Swatch" size="large" color="#ff0000" />,
    );

    expect(getByTestId('Swatch')).toHaveAttribute('data-size', 'large');
  });

  it('leaves the size off so it can track the control around it', () => {
    const { getByTestId } = render(<ColorSwatch qa="Swatch" color="#ff0000" />);

    expect(getByTestId('Swatch')).not.toHaveAttribute('data-size');
  });

  it('accepts direct style props', () => {
    // `radius="round"` and friends have to work without reaching for `styles`.
    const { getByTestId } = render(
      <ColorSwatch qa="Swatch" color="#ff0000" radius="round" width="4x" />,
    );

    expect(getByTestId('Swatch')).toBeInTheDocument();
  });
});

describe('inside the color fields', () => {
  // The swatch in a color field is a fixed badge, not something that grows with the
  // field. It rendered 20px at every size before `ColorSwatch` gained sizes of its
  // own, and letting the field's size through silently made it 24px at medium and
  // 28px at large. Asserted on the emitted `data-size`, which is what selects the
  // width — jsdom will not resolve the custom property behind it.
  it('renders at a fixed size inside the color fields', () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      const { unmount, getAllByTestId } = renderWithRoot(
        <ColorInput size={size} value="#7a4dbf" />,
      );

      expect(getAllByTestId('ColorSwatch')[0]).toHaveAttribute(
        'data-size',
        'small',
      );
      unmount();
    }
  });
});
