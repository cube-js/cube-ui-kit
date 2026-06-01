// NOTE: Type checking is disabled in this test file to prevent
// noisy errors from complex generic typings that do not affect runtime behaviour.
import { act, renderWithRoot, userEvent, waitFor } from '../../test';

import { Menu } from './Menu';
import { useAnchoredMenu } from './use-anchored-menu';

vi.mock('../../_internal/hooks/use-warn');

describe('useAnchoredMenu', () => {
  const TestMenuComponent = ({
    onAction,
  }: {
    onAction?: (key: string) => void;
  }) => (
    <Menu onAction={onAction}>
      <Menu.Item key="edit">Edit</Menu.Item>
      <Menu.Item key="delete">Delete</Menu.Item>
    </Menu>
  );

  // Menu with a SubMenuTrigger nested inside. Hovering the submenu trigger must
  // NOT close the parent menu.
  const TestSubMenuComponent = ({
    onAction,
  }: {
    onAction?: (key: string) => void;
  }) => (
    <Menu onAction={onAction}>
      <Menu.Item key="edit">Edit</Menu.Item>
      <Menu.SubMenuTrigger>
        <Menu.Item key="more">More</Menu.Item>
        <Menu onAction={onAction}>
          <Menu.Item key="nested-1">Nested 1</Menu.Item>
          <Menu.Item key="nested-2">Nested 2</Menu.Item>
        </Menu>
      </Menu.SubMenuTrigger>
    </Menu>
  );

  const TestWrapper = ({
    Component,
    defaultTriggerProps = {},
    defaultMenuProps = {},
    componentProps = {},
  }: {
    Component: any;
    defaultTriggerProps?: any;
    defaultMenuProps?: any;
    componentProps?: any;
  }) => {
    const { anchorRef, open, rendered } = useAnchoredMenu(
      Component,
      defaultTriggerProps,
      defaultMenuProps,
    );

    return (
      <div>
        <button
          ref={anchorRef as React.RefObject<HTMLButtonElement>}
          data-qa="Trigger"
          onClick={() => open(componentProps)}
        >
          Open Menu
        </button>
        {rendered}
      </div>
    );
  };

  it('opens the menu with the provided component', async () => {
    const onAction = vi.fn();

    const { getByTestId, getByRole, getByText } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
      />,
    );

    await act(async () => {
      await userEvent.click(getByTestId('Trigger'));
    });

    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    expect(getByText('Edit')).toBeInTheDocument();
    expect(getByText('Delete')).toBeInTheDocument();
  });

  it('keeps the anchored menu open when a nested submenu opens on hover', async () => {
    const onAction = vi.fn();

    const { getByTestId, getByText, queryByText } = renderWithRoot(
      <TestWrapper
        Component={TestSubMenuComponent}
        defaultMenuProps={{ onAction }}
      />,
    );

    await act(async () => {
      await userEvent.click(getByTestId('Trigger'));
    });

    await waitFor(() => {
      expect(getByText('More')).toBeInTheDocument();
    });

    // Wait for the submenu trigger to be wired up.
    await waitFor(() => {
      const moreItem = getByText('More').closest('li');
      expect(moreItem).toHaveAttribute('data-has-submenu', 'true');
    });

    // Hover the submenu trigger to open the nested submenu.
    await userEvent.hover(getByText('More'));

    await waitFor(
      () => {
        expect(getByText('Nested 1')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // The parent menu must still be open — the nested submenu opening must not
    // have triggered `usePopoverSync`'s peer-close.
    expect(queryByText('Edit')).toBeInTheDocument();
    expect(queryByText('More')).toBeInTheDocument();
    expect(getByText('Nested 2')).toBeInTheDocument();
  });
});
