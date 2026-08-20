import { IconCopy } from '@tabler/icons-react';

import {
  hoverWithPointer,
  render,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';

import { Button } from './Button';

describe('<Button />', () => {
  it('should add data-qa', () => {
    render(<Button data-qa="Test">label</Button>);

    expect(screen.getByTestId('Test')).toBeInTheDocument();
  });

  it('should have data-loading', () => {
    render(
      <Button isLoading data-qa="ApplyDbConnection">
        Apply
      </Button>,
    );

    expect(screen.getByTestId('ApplyDbConnection')).toHaveAttribute(
      'data-loading',
      '',
    );
  });

  it('should have data-loading after rerender', () => {
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
      'data-loading',
      '',
    );
  });

  it.each([
    ['none', {}],
    ['icon', { icon: <IconCopy /> }],
  ])(`should warn if %s specified`, (_, value) => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

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
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<Button {...value} />);

    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  describe('current theme', () => {
    it('should render the outline shape by default', () => {
      render(
        <Button qa="Current" theme="current">
          label
        </Button>,
      );

      const button = screen.getByTestId('Current');

      expect(button).toHaveAttribute('data-theme', 'current');
      expect(button).toHaveAttribute('data-type', 'outline');
    });

    it('should compose with every type', () => {
      render(
        <Button qa="Current" theme="current" type="primary">
          label
        </Button>,
      );

      const button = screen.getByTestId('Current');

      expect(button).toHaveAttribute('data-theme', 'current');
      expect(button).toHaveAttribute('data-type', 'primary');
    });
  });

  describe('disabled state', () => {
    it('should use the native attribute when there is no tooltip', () => {
      render(<Button isDisabled>Label</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show the tooltip while disabled', async () => {
      renderWithRoot(
        <Button isDisabled tooltip="Not enough permissions">
          Label
        </Button>,
      );

      const button = screen.getByRole('button');

      // The native attribute makes the browser drop the events the tooltip
      // trigger listens to, so a disabled button with a tooltip is marked
      // with `aria-disabled` instead.
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('data-disabled');

      await hoverWithPointer(button);

      await waitFor(() => {
        expect(screen.getByText('Not enough permissions')).toBeInTheDocument();
      });
    });

    it('should stay inert while disabled with a tooltip', async () => {
      const onPress = vi.fn();

      renderWithRoot(
        <Button isDisabled tooltip="Not enough permissions" onPress={onPress}>
          Label
        </Button>,
      );

      await userEvent.click(screen.getByRole('button'));

      expect(onPress).not.toHaveBeenCalled();
    });

    it('should let the keyboard reach the tooltip while disabled', async () => {
      renderWithRoot(
        <Button isDisabled tooltip="Not enough permissions">
          Label
        </Button>,
      );

      // Staying in the tab order is the point: the tooltip carries the reason
      // the button is unavailable, so keyboard users have to be able to read it.
      await userEvent.tab();

      expect(screen.getByRole('button')).toHaveFocus();

      await waitFor(() => {
        expect(screen.getByText('Not enough permissions')).toBeInTheDocument();
      });
    });

    it('should mark a disabled link with aria-disabled', () => {
      render(
        <Button isDisabled to="/somewhere" qa="Link">
          Label
        </Button>,
      );

      // `disabled` is not a valid attribute on an anchor, so the state can only
      // be announced through ARIA.
      const link = screen.getByTestId('Link');

      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).not.toHaveAttribute('disabled');
    });
  });
});
