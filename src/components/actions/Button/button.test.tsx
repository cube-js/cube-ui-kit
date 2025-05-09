import { IconCopy } from '@tabler/icons-react';

import { render, screen } from '../../../test';

import { Button } from './Button';

describe('<Button />', () => {
  it('should add data-qa', () => {
    render(<Button data-qa="test">label</Button>);

    expect(screen.getByTestId('test')).toBeInTheDocument();
  });

  it('should have data-is-loading', () => {
    render(
      <Button isLoading data-qa="ApplyDbConnection">
        Apply
      </Button>,
    );

    expect(screen.getByTestId('ApplyDbConnection')).toHaveAttribute(
      'data-is-loading',
      '',
    );
  });

  it('should have data-is-loading after rerender', () => {
    const { rerender } = render(
      <Button isLoading={false} data-qa="ApplyDbConnection">
        Apply
      </Button>,
    );

    rerender(
      <Button isLoading data-qa="ApplyDbConnection">
        Apply
      </Button>,
    );

    expect(screen.getByTestId('ApplyDbConnection')).toHaveAttribute(
      'data-is-loading',
      '',
    );
  });

  it.each([
    ['none', {}],
    ['icon', { icon: <IconCopy /> }],
  ])(`should warn if %s specified`, (_, value) => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(<Button {...value} />);

    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it.each([
    ['aria-label', { 'aria-label': 'test' }],
    ['aria-labelledby', { 'aria-labelledby': 'test' }],
    ['label', { label: 'test' }],
    ['children', { children: 'test' }],
    ['aria-label and children', { 'aria-label': 'test', children: 'test' }],
    ['label and children', { label: 'test', children: 'test' }],
    ['icon and children', { icon: <IconCopy />, children: 'test' }],
    ['icon and label', { icon: <IconCopy />, label: 'test' }],
    ['icon and aria-label', { icon: <IconCopy />, 'aria-label': 'test' }],
    // prettier-ignore
    ['icon and aria-labelledby', { icon: <IconCopy />, 'aria-labelledby': 'test' }],
    // prettier-ignore
    ['rightIcon and children', { rightIcon: <IconCopy />, children: 'test' }],
    ['rightIcon and label', { rightIcon: <IconCopy />, label: 'test' }],
    // prettier-ignore
    ['rightIcon and aria-label', { rightIcon: <IconCopy />, 'aria-label': 'test' }],
    // prettier-ignore
    ['rightIcon and aria-labelledby', { rightIcon: <IconCopy />, 'aria-labelledby': 'test' }],
  ])('should not warn if %s is provided', (_, value) => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(<Button {...value} />);

    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});
