import { IconEdit } from '@tabler/icons-react';

import {
  hoverWithPointer,
  render,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { ItemActionProvider } from '../ItemActionContext';

import { ItemAction } from './ItemAction';

describe('<ItemAction />', () => {
  describe('loading state', () => {
    it('should not run the action again while loading', async () => {
      const onPress = vi.fn();

      render(
        <ItemAction isLoading onPress={onPress}>
          Connect
        </ItemAction>,
      );

      const action = screen.getByRole('button');

      await userEvent.click(action);

      expect(onPress).not.toHaveBeenCalled();
      expect(action).toBeDisabled();
      expect(action).toHaveAttribute('data-loading');
      expect(action).toHaveAttribute('data-disabled');
    });

    it('should stay disabled while loading even with isDisabled={false}', async () => {
      const onPress = vi.fn();

      // A computed `isDisabled` is indistinguishable from an explicit `false`,
      // so letting it win would silently bring the double press back.
      render(
        <ItemAction isLoading isDisabled={false} onPress={onPress}>
          Connect
        </ItemAction>,
      );

      await userEvent.click(screen.getByRole('button'));

      expect(onPress).not.toHaveBeenCalled();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should press again once loading ends', async () => {
      const onPress = vi.fn();

      const { rerender } = render(
        <ItemAction isLoading onPress={onPress}>
          Connect
        </ItemAction>,
      );

      rerender(
        <ItemAction isLoading={false} onPress={onPress}>
          Connect
        </ItemAction>,
      );

      await userEvent.click(screen.getByRole('button'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should give the spinner the icon padding on a label-only action', () => {
      render(<ItemAction isLoading>Connect</ItemAction>);

      // The spinner takes the icon slot, so it needs the icon's padding even
      // though the action has no `icon` of its own.
      expect(screen.getByRole('button')).toHaveAttribute('data-has-icon');
    });

    it('should show the tooltip while loading', async () => {
      const onPress = vi.fn();

      renderWithRoot(
        <ItemAction
          isLoading
          icon={<IconEdit />}
          tooltip="Edit"
          onPress={onPress}
        />,
      );

      const action = screen.getByRole('button', { name: 'Edit' });

      expect(action).not.toBeDisabled();
      expect(action).toHaveAttribute('aria-disabled', 'true');

      await hoverWithPointer(action);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Edit');
      });

      await userEvent.click(action);

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should use the native attribute when there is no tooltip', () => {
      render(<ItemAction isDisabled>Label</ItemAction>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show the tooltip while disabled', async () => {
      renderWithRoot(
        <ItemAction isDisabled icon={<IconEdit />} tooltip="Edit" />,
      );

      const action = screen.getByRole('button', { name: 'Edit' });

      // The native attribute makes the browser drop the events the tooltip
      // trigger listens to, so a disabled action with a tooltip is marked
      // with `aria-disabled` instead.
      expect(action).not.toBeDisabled();
      expect(action).toHaveAttribute('aria-disabled', 'true');
      expect(action).toHaveAttribute('data-disabled');

      await hoverWithPointer(action);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Edit');
      });
    });

    it('should stay inert while disabled with a tooltip', async () => {
      const onPress = vi.fn();

      renderWithRoot(
        <ItemAction
          isDisabled
          icon={<IconEdit />}
          tooltip="Edit"
          onPress={onPress}
        />,
      );

      const action = screen.getByRole('button', { name: 'Edit' });

      await userEvent.click(action);

      action.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');

      expect(onPress).not.toHaveBeenCalled();
    });

    it('should let isDisabled={false} override a disabled row', async () => {
      const onPress = vi.fn();

      render(
        <ItemActionProvider isDisabled>
          <ItemAction isDisabled={false} onPress={onPress}>
            Label
          </ItemAction>
        </ItemActionProvider>,
      );

      await userEvent.click(screen.getByRole('button'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
