import { createRef } from 'react';

import { render, screen } from '../../../test';

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

  it('claims no grid area, so a grid places it in the next cell', () => {
    // A named area that no grid defines puts the divider in a stray column.
    render(<Divider />);

    expect(
      getComputedStyle(screen.getByRole('separator')).getPropertyValue(
        'grid-area',
      ),
    ).not.toContain('divider');
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
