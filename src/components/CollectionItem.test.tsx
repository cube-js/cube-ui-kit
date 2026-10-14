import { ReactNode } from 'react';
import { RouterProvider } from 'react-aria';
import { Item as StatelyItem, useListState } from 'react-stately';

import { act, render, renderWithRoot, userEvent } from '../test';

import { Menu } from './actions/Menu/Menu';
import { CollectionItem } from './CollectionItem';
import { ComboBox } from './fields/ComboBox/ComboBox';
import { ListBox } from './fields/ListBox/ListBox';
import { Select } from './fields/Select/Select';
import { Root } from './Root';

import type { CollectionElement } from '@react-types/shared';
import type { NavigationAdapter } from '../providers/navigation.types';

vi.mock('../_internal/hooks/use-warn');

const destinations: Record<string, unknown> = {
  href: '/unexpected',
  to: '/unexpected',
  navigationOptions: { replace: true },
  routerOptions: { replace: true },
  target: '_self',
  rel: 'noopener',
  download: 'unexpected.csv',
  ping: '/unexpected-ping',
  referrerPolicy: 'no-referrer',
  hrefLang: 'en',
};

function SelectionField({
  kind,
  children,
  onSelectionChange,
  collection,
}: {
  kind: 'ListBox' | 'ComboBox' | 'Select';
  children: CollectionElement<unknown>;
  onSelectionChange: (key: unknown) => void;
  collection?: unknown;
}) {
  const props = { label: 'Colors', onSelectionChange, collection };

  if (kind === 'ComboBox') return <ComboBox {...props}>{children}</ComboBox>;
  if (kind === 'Select') return <Select {...props}>{children}</Select>;

  return <ListBox {...props}>{children}</ListBox>;
}

describe('value-selection collection items', () => {
  it.each(
    (['ListBox', 'ComboBox', 'Select'] as const).flatMap((kind) =>
      (['selection', 'menu', 'stately'] as const).flatMap((factory) =>
        ['to', 'href'].map((destination) => ({ kind, factory, destination })),
      ),
    ),
  )(
    '$kind preserves $factory option click callbacks when $destination is stripped',
    async ({ kind, factory, destination }) => {
      const ItemFactory =
        factory === 'menu'
          ? Menu.Item
          : factory === 'stately'
            ? StatelyItem
            : CollectionItem;

      async function selectOption(navigationProps: Record<string, unknown>) {
        const onClick = vi.fn();
        const onSelectionChange = vi.fn();
        const navigate = vi.fn();
        const view = renderWithRoot(
          <RouterProvider navigate={navigate}>
            <SelectionField kind={kind} onSelectionChange={onSelectionChange}>
              <ItemFactory key="red" {...navigationProps} {...{ onClick }}>
                Red
              </ItemFactory>
            </SelectionField>
          </RouterProvider>,
        );

        if (kind === 'ComboBox') {
          await userEvent.type(view.getByRole('combobox'), 'Re');
        } else if (kind === 'Select') {
          await userEvent.click(view.getByRole('button', { name: 'Colors' }));
        }

        const option = view.getByRole('option', { name: 'Red' });
        expect(option).not.toHaveAttribute('href');
        await userEvent.click(option);
        expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('red');
        expect(navigate).not.toHaveBeenCalled();
        view.unmount();

        return onClick.mock.calls.length;
      }

      const baselineCalls = await selectOption({});
      expect(baselineCalls).toBeGreaterThan(0);
      expect(await selectOption({ [destination]: '/unexpected' })).toBe(
        baselineCalls,
      );
    },
  );

  it.each(
    (['ListBox', 'ComboBox', 'Select'] as const).flatMap((kind) =>
      (['menu', 'stately'] as const).flatMap((factory) =>
        (['li', 'a'] as const).flatMap((tag) =>
          (['click', 'Enter'] as const).map((activation) => ({
            kind,
            factory,
            tag,
            activation,
          })),
        ),
      ),
    ),
  )(
    '$kind selects a $factory $tag option with $activation',
    async ({ kind, factory, tag, activation }) => {
      const onSelectionChange = vi.fn();
      const navigate = vi.fn();
      const ItemFactory = factory === 'menu' ? Menu.Item : StatelyItem;
      const view = renderWithRoot(
        <RouterProvider navigate={navigate}>
          <SelectionField kind={kind} onSelectionChange={onSelectionChange}>
            <ItemFactory
              key="red"
              {...destinations}
              {...{ as: tag, 'data-href': '/synthetic-unexpected' }}
            >
              Red
            </ItemFactory>
          </SelectionField>
        </RouterProvider>,
      );

      if (kind === 'ComboBox') {
        await userEvent.type(view.getByRole('combobox'), 'Re');
      } else if (kind === 'Select') {
        await userEvent.click(view.getByRole('button', { name: 'Colors' }));
      }

      const option = view.getByRole('option', { name: 'Red' });
      expect(option).not.toHaveAttribute('href');
      expect(option).not.toHaveAttribute('data-href');

      if (activation === 'click') {
        await userEvent.click(option);
      } else if (kind === 'ComboBox') {
        await userEvent.keyboard('{ArrowDown}{Enter}');
      } else {
        await act(async () => option.focus());
        await userEvent.keyboard('{Enter}');
      }

      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('red');
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it.each(['ListBox', 'Select'] as const)(
    'normalizes a supplied %s collection without changing the original nodes',
    async (kind) => {
      const onSelectionChange = vi.fn();
      let originalCollection: ReturnType<typeof useListState>['collection'];

      function CustomCollection() {
        const state = useListState({
          children: (
            <StatelyItem key="red" href="/unexpected">
              Red
            </StatelyItem>
          ),
        });
        originalCollection = state.collection;

        return (
          <SelectionField
            kind={kind}
            onSelectionChange={onSelectionChange}
            collection={state.collection}
          >
            <CollectionItem key="fallback">Fallback</CollectionItem>
          </SelectionField>
        );
      }

      const view = renderWithRoot(<CustomCollection />);
      if (kind === 'Select') {
        await userEvent.click(view.getByRole('button', { name: 'Colors' }));
      }
      const option = view.getByRole('option', { name: 'Red' });
      expect(option).not.toHaveAttribute('href');
      await userEvent.click(option);
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('red');
      expect(originalCollection!.getItem('red')?.props.href).toBe(
        '/unexpected',
      );
    },
  );

  it.each(['ListBox', 'ComboBox', 'Select'] as const)(
    '%s selects an untyped option with navigation props instead of following it',
    async (kind) => {
      const onSelectionChange = vi.fn();
      const navigate = vi.fn();
      const props = { label: 'Colors', onSelectionChange };
      let field: ReactNode;

      if (kind === 'ComboBox') {
        field = (
          <ComboBox {...props}>
            <ComboBox.Item key="red" {...destinations} as="a">
              Red
            </ComboBox.Item>
          </ComboBox>
        );
      } else if (kind === 'Select') {
        field = (
          <Select {...props}>
            <Select.Item key="red" {...destinations} as="a">
              Red
            </Select.Item>
          </Select>
        );
      } else {
        field = (
          <ListBox {...props}>
            <ListBox.Item key="red" {...destinations} as="a">
              Red
            </ListBox.Item>
          </ListBox>
        );
      }

      const view = renderWithRoot(
        <RouterProvider navigate={navigate}>{field}</RouterProvider>,
      );

      if (kind === 'ComboBox') {
        await userEvent.type(view.getByRole('combobox'), 'Re');
      } else if (kind === 'Select') {
        await userEvent.click(view.getByRole('button', { name: 'Colors' }));
      }

      const option = view.getByRole('option', { name: 'Red' });

      expect(option).not.toHaveAttribute('href');
      expect(option).not.toHaveAttribute('to');
      expect(option).not.toHaveAttribute('target');
      expect(option).not.toHaveAttribute('download');
      await userEvent.click(option);
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('red');
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it.each(
    (['dynamic', 'section'] as const).flatMap((kind) =>
      (['selection', 'menu', 'stately'] as const).map((factory) => ({
        kind,
        factory,
      })),
    ),
  )(
    'keeps $factory $kind options selectable when untyped data contains destinations',
    async ({ kind, factory }) => {
      const onSelectionChange = vi.fn();
      const items = [{ id: 'red', label: 'Red', ...destinations }];
      const ItemFactory =
        factory === 'menu'
          ? Menu.Item
          : factory === 'stately'
            ? StatelyItem
            : ListBox.Item;
      const view = renderWithRoot(
        kind === 'dynamic' ? (
          <ListBox
            label="Colors"
            items={items}
            onSelectionChange={onSelectionChange}
          >
            {(item) => (
              <ItemFactory key={item.id} {...item} as="a">
                {item.label}
              </ItemFactory>
            )}
          </ListBox>
        ) : (
          <ListBox label="Colors" onSelectionChange={onSelectionChange}>
            <ListBox.Section title="Colors">
              <ItemFactory key="red" {...destinations} {...{ as: 'a' }}>
                Red
              </ItemFactory>
            </ListBox.Section>
          </ListBox>
        ),
      );

      const option = view.getByRole('option', { name: 'Red' });
      expect(option).not.toHaveAttribute('href');
      await userEvent.click(option);
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('red');
    },
  );

  it('keeps navigation on Menu.Item and preserves collection item statics', async () => {
    const onClick = vi.fn();
    const navigate = vi.fn();
    const navigation: NavigationAdapter = {
      useNavigate: () => navigate,
      useHref: (to) =>
        typeof to === 'string'
          ? to
          : [to.pathname ?? '', to.search ?? '', to.hash ?? ''].join(''),
    };
    const view = render(
      <Root navigation={navigation}>
        <Menu aria-label="Workbooks">
          <Menu.Item key="workbooks" to="/workbooks" onClick={onClick}>
            Workbooks
          </Menu.Item>
        </Menu>
      </Root>,
    );

    const item = view.getByRole('menuitem', { name: 'Workbooks' });
    expect(item).toHaveAttribute('href', '/workbooks');
    await userEvent.click(item);
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/workbooks', undefined);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(CollectionItem.Action).toBe(Menu.Item.Action);
    expect(CollectionItem.Badge).toBe(Menu.Item.Badge);
  });
});
