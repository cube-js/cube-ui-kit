import {
  hoverWithPointer,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { ItemButton } from '../../actions/ItemButton';

import { Item } from './Item';

describe('<Item />', () => {
  describe('disabled state', () => {
    it('should announce the disabled state without the native attribute', () => {
      renderWithRoot(
        <Item isDisabled qa="Item">
          Label
        </Item>,
      );

      const item = screen.getByTestId('Item');

      // A `div` cannot carry a meaningful `disabled` attribute.
      expect(item).not.toHaveAttribute('disabled');
      expect(item).toHaveAttribute('aria-disabled', 'true');
      expect(item).toHaveAttribute('data-disabled');
    });

    it('should show the tooltip while disabled', async () => {
      renderWithRoot(
        <Item isDisabled tooltip="Available on a higher plan" qa="Item">
          Label
        </Item>,
      );

      await hoverWithPointer(screen.getByTestId('Item'));

      await waitFor(() => {
        expect(
          screen.getByText('Available on a higher plan'),
        ).toBeInTheDocument();
      });
    });

    it('should not run activation handlers while disabled', async () => {
      const onClick = vi.fn();

      renderWithRoot(
        <Item isDisabled qa="Item" onClick={onClick}>
          Label
        </Item>,
      );

      // The attribute never stopped anything on a `div`, so the item is kept
      // inert by dropping the handlers instead.
      await userEvent.click(screen.getByTestId('Item'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });
});

describe('<ItemButton />', () => {
  describe('disabled state', () => {
    it('should use the native attribute when there is no tooltip', () => {
      renderWithRoot(
        <ItemButton isDisabled qa="Item">
          Label
        </ItemButton>,
      );

      expect(screen.getByTestId('Item')).toBeDisabled();
    });

    it('should show the tooltip while disabled', async () => {
      renderWithRoot(
        <ItemButton isDisabled tooltip="Available on a higher plan" qa="Item">
          Label
        </ItemButton>,
      );

      const item = screen.getByTestId('Item');

      // The native attribute makes the browser drop the events the tooltip
      // trigger listens to, so the disabled state is expressed with
      // `aria-disabled` instead.
      expect(item).not.toBeDisabled();
      expect(item).toHaveAttribute('aria-disabled', 'true');
      expect(item).toHaveAttribute('data-disabled');

      await hoverWithPointer(item);

      await waitFor(() => {
        expect(
          screen.getByText('Available on a higher plan'),
        ).toBeInTheDocument();
      });
    });

    it('should stay inert while disabled with a tooltip', async () => {
      const onPress = vi.fn();
      const onClick = vi.fn();

      renderWithRoot(
        <ItemButton
          isDisabled
          tooltip="Available on a higher plan"
          qa="Item"
          onPress={onPress}
          onClick={onClick}
        >
          Label
        </ItemButton>,
      );

      await userEvent.click(screen.getByTestId('Item'));

      expect(onPress).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
