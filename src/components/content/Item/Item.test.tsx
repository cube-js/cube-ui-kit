import { createRef } from 'react';

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
  describe('current theme', () => {
    it('should render the item shape by default', () => {
      renderWithRoot(
        <Item qa="Current" theme="current">
          label
        </Item>,
      );

      const item = screen.getByTestId('Current');

      expect(item).toHaveAttribute('data-theme', 'current');
      expect(item).toHaveAttribute('data-type', 'item');
    });

    it('should compose with every type', () => {
      renderWithRoot(
        <Item qa="Current" theme="current" type="outline">
          label
        </Item>,
      );

      const item = screen.getByTestId('Current');

      expect(item).toHaveAttribute('data-theme', 'current');
      expect(item).toHaveAttribute('data-type', 'outline');
    });
  });

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
        <Item isDisabled qa="Item" {...{ onClick }}>
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

describe('wrapDescription', () => {
  const description = 'Can view every dashboard, but cannot edit them';

  it.each([
    ['an item', {}, false],
    ['an item with the prop', { wrapDescription: true }, true],
    ['a card', { type: 'card' as const }, true],
    ['a header', { type: 'header' as const }, true],
    [
      'a card with the prop off',
      { type: 'card' as const, wrapDescription: false },
      false,
    ],
  ])('wraps the description of %s: %s', (_, props, wraps) => {
    renderWithRoot(
      <Item qa="Item" description={description} {...props}>
        Viewer
      </Item>,
    );

    const item = screen.getByTestId('Item');

    if (wraps) {
      expect(item).toHaveAttribute('data-wrap-description');
    } else {
      expect(item).not.toHaveAttribute('data-wrap-description');
    }
  });

  it('has nothing to wrap without a description', () => {
    renderWithRoot(
      <Item wrapDescription qa="Item">
        Viewer
      </Item>,
    );

    expect(screen.getByTestId('Item')).not.toHaveAttribute(
      'data-wrap-description',
    );
  });
});

describe('labelRef', () => {
  // `labelRef` used to fall through to the element's DOM attributes
  // (`labelref="[object Object]"`) and never reach the label.
  it('points at the label of an Item and an ItemButton', () => {
    const itemRef = createRef<HTMLElement>();
    const buttonRef = createRef<HTMLElement>();

    renderWithRoot(
      <>
        <Item qa="Item" labelRef={itemRef}>
          Item label
        </Item>
        <ItemButton qa="Button" labelRef={buttonRef}>
          Button label
        </ItemButton>
      </>,
    );

    expect(itemRef.current).toHaveAttribute('data-element', 'Label');
    expect(itemRef.current).toHaveTextContent('Item label');
    expect(buttonRef.current).toHaveTextContent('Button label');
    expect(screen.getByTestId('Item')).not.toHaveAttribute('labelref');
    expect(screen.getByTestId('Button')).not.toHaveAttribute('labelref');
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
