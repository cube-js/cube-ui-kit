import { IconDots, IconEdit } from '@tabler/icons-react';

import {
  hoverWithPointer,
  render,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { ItemActionProvider } from '../ItemActionContext';
import { Menu } from '../Menu/Menu';
import { MenuTrigger } from '../Menu/MenuTrigger';

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
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');

      expect(onPress).not.toHaveBeenCalled();
      expect(action).toHaveAttribute('aria-disabled', 'true');
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

      const action = screen.getByRole('button');

      await userEvent.click(action);

      expect(onPress).not.toHaveBeenCalled();
      expect(action).toHaveAttribute('aria-disabled', 'true');
    });

    it('should keep focus when it starts loading', async () => {
      const { rerender } = render(<ItemAction>Connect</ItemAction>);

      await userEvent.tab();

      rerender(<ItemAction isLoading>Connect</ItemAction>);

      const action = screen.getByRole('button');

      // The native attribute would make the browser move focus to the body,
      // losing a keyboard user's place mid-press.
      expect(action).not.toBeDisabled();
      expect(action).toHaveFocus();
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

    it('should not fade twice when loading inside a disabled row', () => {
      render(
        <ItemActionProvider isDisabled>
          <ItemAction isLoading isDisabled={false}>
            Connect
          </ItemAction>
        </ItemActionProvider>,
      );

      // The row has already faded the color the action paints from.
      expect(screen.getByRole('button')).toHaveAttribute(
        'data-inherit-disabled',
      );
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

      expect(action).toHaveFocus();

      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');

      expect(onPress).not.toHaveBeenCalled();
    });

    it.each([['{ArrowDown}'], ['{Enter}'], [' ']])(
      'should not open its menu with %s while disabled with a tooltip',
      async (key) => {
        renderWithRoot(
          <MenuTrigger>
            <ItemAction isDisabled icon={<IconDots />} tooltip="More" />
            <Menu aria-label="Actions">
              <Menu.Item key="copy">Copy</Menu.Item>
            </Menu>
          </MenuTrigger>,
        );

        await userEvent.tab();

        expect(screen.getByRole('button', { name: 'More' })).toHaveFocus();

        await userEvent.keyboard(key);

        // `MenuTrigger` hands the trigger its own key handler, which ignores
        // the trigger's disabled state; without the native attribute it has to
        // be dropped.
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      },
    );

    it('should keep an action disabled by its row natively disabled', () => {
      render(
        <ItemActionProvider isDisabled>
          <ItemAction icon={<IconEdit />} tooltip="Edit" />
        </ItemActionProvider>,
      );

      // A disabled row or field takes its actions out of the tab order, as a
      // disabled fieldset does.
      expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
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
