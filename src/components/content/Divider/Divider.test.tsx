import { createRef } from 'react';

import { render, screen } from '../../../test';
import { readWithScreenReader } from '../../../test/screen-reader';

import { Divider } from './Divider';

describe('<Divider />', () => {
  it('is an <hr> separator by default', () => {
    render(<Divider />);

    const divider = screen.getByRole('separator');

    expect(divider.tagName).toBe('HR');
    expect(divider).toHaveAttribute('data-qa', 'Divider');
    expect(divider).not.toHaveAttribute('aria-orientation');
  });

  it('applies its style props', () => {
    // They used to be dropped with the rest of the non-DOM props.
    render(<Divider margin="1em 0" width="50%" />);

    const style = getComputedStyle(screen.getByRole('separator'));

    expect(style.margin).toBe('1em 0px');
    expect(style.width).toBe('50%');
  });

  it('lets a style prop win over the same key in styles', () => {
    render(<Divider margin="1em 0" styles={{ margin: '2em', width: '50%' }} />);

    const style = getComputedStyle(screen.getByRole('separator'));

    expect(style.margin).toBe('1em 0px');
    expect(style.width).toBe('50%');
  });

  it('is a vertical separator with orientation="vertical"', () => {
    render(<Divider orientation="vertical" />);

    const divider = screen.getByRole('separator');

    // React Aria leaves `aria-orientation` off an `<hr>`.
    expect(divider.tagName).toBe('DIV');
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('is named by its text', () => {
    render(<Divider>or</Divider>);

    expect(screen.getByRole('separator', { name: 'or' })).toBeInTheDocument();
  });

  it('keeps a text of 0', () => {
    render(<Divider>{0}</Divider>);

    expect(screen.getByRole('separator', { name: '0' })).toBeInTheDocument();
  });

  it('reads its text once, as the name', async () => {
    // Element children used to be read again after the name.
    render(
      <Divider>
        <strong>or</strong>
      </Divider>,
    );

    const phrases = await readWithScreenReader();

    expect(phrases.filter((phrase) => phrase.includes('or'))).toEqual([
      expect.stringMatching(/^separator, or/),
    ]);
  });

  it('keeps a name given by aria-label or aria-labelledby', () => {
    render(
      <>
        <span id="external">Older entries</span>
        <Divider aria-label="Payment">or</Divider>
        <Divider aria-labelledby="external">or</Divider>
      </>,
    );

    expect(
      screen.getByRole('separator', { name: 'Payment' }),
    ).not.toHaveAttribute('aria-labelledby');
    expect(
      screen.getByRole('separator', { name: 'Older entries' }),
    ).toBeInTheDocument();
  });

  it('forwards its ref to the separator', () => {
    const ref = createRef<HTMLElement>();

    render(<Divider ref={ref} />);

    expect(ref.current).toBe(screen.getByRole('separator'));
  });
});
