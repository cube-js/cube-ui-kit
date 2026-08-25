import { renderWithRoot, screen } from '../../../test';

import { CubeFullLogo, CubeLogo } from './CubeLogo';

describe('<CubeLogo />', () => {
  it('renders both schema marks so the swap is CSS-only', () => {
    renderWithRoot(<CubeLogo />);
    const el = screen.getByTestId('CubeLogo');

    expect(el.querySelector('[data-element="LightMark"]')).toBeInTheDocument();
    expect(el.querySelector('[data-element="DarkMark"]')).toBeInTheDocument();
  });

  it('exposes an accessible name', () => {
    renderWithRoot(<CubeLogo />);

    expect(screen.getByRole('img', { name: 'Cube' })).toBeInTheDocument();
  });

  it.each([
    ['light', 'block', 'none'],
    ['dark', 'none', 'block'],
  ] as const)('pins the %s mark when asked', (schema, light, dark) => {
    renderWithRoot(<CubeLogo schema={schema} />);
    const el = screen.getByTestId('CubeLogo');
    const mark = (name: string) =>
      getComputedStyle(el.querySelector(`[data-element="${name}"]`)!).display;

    expect(mark('LightMark')).toBe(light);
    expect(mark('DarkMark')).toBe(dark);
  });

  it('keeps schema off the DOM', () => {
    renderWithRoot(<CubeLogo schema="dark" />);

    expect(screen.getByTestId('CubeLogo')).not.toHaveAttribute('schema');
  });

  it('drives sizing from the size prop', () => {
    renderWithRoot(<CubeLogo size="32px" />);

    // `Icon` maps `size` onto font-size; its own width/height are 1em, so both
    // axes follow it for the square mark.
    expect(getComputedStyle(screen.getByTestId('CubeLogo')).fontSize).toBe(
      '32px',
    );
  });
});

describe('<CubeFullLogo />', () => {
  it('renders the mark and the wordmark', () => {
    renderWithRoot(<CubeFullLogo />);
    const el = screen.getByTestId('CubeFullLogo');

    expect(el.querySelector('[data-element="LightMark"]')).toBeInTheDocument();
    expect(el.querySelector('[data-element="DarkMark"]')).toBeInTheDocument();
    // mark light + mark dark + wordmark
    expect(el.querySelectorAll('path')).toHaveLength(3);
  });

  it('takes only the height from size and lets width follow the ratio', () => {
    renderWithRoot(<CubeFullLogo size="24px" />);
    const styles = getComputedStyle(screen.getByTestId('CubeFullLogo'));

    expect(styles.fontSize).toBe('24px');
    // Width must NOT be pinned to a square 1em the way `Icon` does by default.
    expect(styles.width).toBe('auto');
    expect(styles.aspectRatio.replace(/\s/g, '')).toBe('98/28');
  });

  it('keeps the wider viewBox so the wordmark is not cropped', () => {
    renderWithRoot(<CubeFullLogo />);
    const svg = screen.getByTestId('CubeFullLogo').querySelector('svg');

    expect(svg).toHaveAttribute('viewBox', '0 0 98 28');
  });
});
