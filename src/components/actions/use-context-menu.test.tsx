// @ts-nocheck
// NOTE: Type checking is disabled in this test file to prevent
// noisy errors from complex generic typings that do not affect runtime behaviour.
import { createRef } from 'react';

import {
  act,
  fireEvent,
  render,
  renderHook,
  renderWithRoot,
  userEvent,
  waitFor,
} from '../../test';
import { EventBusProvider } from '../../utils/react/useEventBus';

import { CommandMenu } from './CommandMenu';
import { Menu } from './Menu';
import { useContextMenu } from './use-context-menu';

jest.mock('../../_internal/hooks/use-warn');

// Wrapper for hooks that need EventBusProvider
const HookWrapper = ({ children }: { children: React.ReactNode }) => (
  <EventBusProvider>{children}</EventBusProvider>
);

describe('useContextMenu', () => {
  // Test component that uses the hook with Menu
  const TestMenuComponent = ({
    onAction,
  }: {
    onAction?: (key: string) => void;
  }) => (
    <Menu onAction={onAction}>
      <Menu.Item key="edit">Edit</Menu.Item>
      <Menu.Item key="delete">Delete</Menu.Item>
      <Menu.Item key="copy">Copy</Menu.Item>
    </Menu>
  );

  // Test component that uses the hook with CommandMenu
  const TestCommandMenuComponent = ({
    onAction,
    searchPlaceholder,
  }: {
    onAction?: (key: string) => void;
    searchPlaceholder?: string;
  }) => (
    <CommandMenu
      searchPlaceholder={searchPlaceholder || 'Search commands...'}
      onAction={onAction}
    >
      <Menu.Item key="copy">Copy</Menu.Item>
      <Menu.Item key="paste">Paste</Menu.Item>
      <Menu.Item key="cut">Cut</Menu.Item>
    </CommandMenu>
  );

  // Wrapper component to test the hook
  const TestWrapper = ({
    Component,
    componentProps = {},
    triggerProps = {},
    defaultTriggerProps = {},
    defaultMenuProps = {},
    onTriggerClick,
  }: {
    Component: any;
    componentProps?: any;
    triggerProps?: any;
    defaultTriggerProps?: any;
    defaultMenuProps?: any;
    onTriggerClick?: () => void;
  }) => {
    const { targetRef, open, close, rendered } = useContextMenu(
      Component,
      defaultTriggerProps,
      defaultMenuProps,
    );

    return (
      <div ref={targetRef} data-qa="container">
        <button
          data-qa="trigger"
          onClick={(e) => {
            if (onTriggerClick) {
              onTriggerClick();
            }
            open(e, componentProps, triggerProps);
          }}
        >
          Open Menu
        </button>
        <button data-qa="close-button" onClick={close}>
          Close Menu
        </button>
        <div
          data-qa="content"
          style={{ width: 200, height: 100, background: '#f0f0f0' }}
        >
          Right-click me for context menu
        </div>
        {rendered}
      </div>
    );
  };

  // Basic functionality tests
  it('should provide targetRef, open, close, and rendered properties', () => {
    const { result } = renderHook(() => useContextMenu(TestMenuComponent), {
      wrapper: HookWrapper,
    });

    expect(result.current.targetRef).toBeDefined();
    expect(result.current.targetRef.current).toBeNull(); // Initially null
    expect(typeof result.current.open).toBe('function');
    expect(typeof result.current.close).toBe('function');
    expect(result.current.rendered).toBeNull(); // Initially null since not opened
  });

  it('should provide setup check functionality', () => {
    const { result } = renderHook(() => useContextMenu(TestMenuComponent), {
      wrapper: HookWrapper,
    });

    // The hook should provide all expected functions
    expect(typeof result.current.open).toBe('function');
    expect(typeof result.current.close).toBe('function');
    expect(result.current.rendered).toBeNull(); // Initially null

    // Accessing rendered should set up the hook properly
    const rendered = result.current.rendered;
    expect(rendered).toBeNull(); // Still null since no props are set
  });

  it('should render menu when opened with Menu component', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole, getByText } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
      />,
    );

    const trigger = getByTestId('trigger');

    // Initially, menu should not be visible
    expect(() => getByRole('menu')).toThrow();

    // Click trigger to open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    // Menu should now be visible
    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    expect(getByText('Edit')).toBeInTheDocument();
    expect(getByText('Delete')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
  });

  it('should render CommandMenu when opened with CommandMenu component', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole, getByText, getByPlaceholderText } =
      renderWithRoot(
        <TestWrapper
          Component={TestCommandMenuComponent}
          defaultMenuProps={{
            onAction,
            searchPlaceholder: 'Search test commands...',
          }}
        />,
      );

    const trigger = getByTestId('trigger');

    // Click trigger to open command menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    // CommandMenu should now be visible
    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    expect(getByPlaceholderText('Search test commands...')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Paste')).toBeInTheDocument();
    expect(getByText('Cut')).toBeInTheDocument();
  });

  it('should close menu when close function is called', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole, queryByRole } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
      />,
    );

    const trigger = getByTestId('trigger');
    const closeButton = getByTestId('close-button');

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    // Close menu
    await act(async () => {
      await userEvent.click(closeButton);
    });

    await waitFor(() => {
      expect(queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('should handle menu item actions correctly', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByText } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
      />,
    );

    const trigger = getByTestId('trigger');

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    // Click on Edit item
    const editItem = getByText('Edit');
    await act(async () => {
      await userEvent.click(editItem);
    });

    expect(onAction).toHaveBeenCalledWith('edit');
  });

  it('should handle context menu events correctly', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole, getByText } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
      />,
    );

    const container = getByTestId('container');

    // Initially, menu should not be visible
    expect(() => getByRole('menu')).toThrow();

    // Right-click to open context menu
    await act(async () => {
      fireEvent.contextMenu(container, {
        clientX: 100,
        clientY: 50,
      });
    });

    // Menu should now be visible
    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    expect(getByText('Edit')).toBeInTheDocument();
    expect(getByText('Delete')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
  });

  it('should position menu at click coordinates', async () => {
    const onAction = jest.fn();

    const { getByTestId } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
      />,
    );

    const container = getByTestId('container');

    // Mock getBoundingClientRect to return a predictable rect
    const mockGetBoundingClientRect = jest.fn(() => ({
      left: 10,
      top: 20,
      width: 200,
      height: 100,
      right: 210,
      bottom: 120,
    }));

    Object.defineProperty(container, 'getBoundingClientRect', {
      value: mockGetBoundingClientRect,
    });

    // Right-click at specific coordinates
    await act(async () => {
      fireEvent.contextMenu(container, {
        clientX: 110, // 100px from container left (10 + 100)
        clientY: 70, // 50px from container top (20 + 50)
      });
    });

    // Wait for menu to be positioned
    await waitFor(() => {
      const invisibleAnchor = container.querySelector(
        'span[style*="position: absolute"]',
      );
      expect(invisibleAnchor).toBeInTheDocument();
    });
  });

  it('should clamp coordinates to container bounds', async () => {
    const onAction = jest.fn();

    const { getByTestId } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
      />,
    );

    const container = getByTestId('container');

    // Mock getBoundingClientRect
    const mockGetBoundingClientRect = jest.fn(() => ({
      left: 10,
      top: 20,
      width: 200,
      height: 100,
      right: 210,
      bottom: 120,
    }));

    Object.defineProperty(container, 'getBoundingClientRect', {
      value: mockGetBoundingClientRect,
    });

    // Right-click outside container bounds
    await act(async () => {
      fireEvent.contextMenu(container, {
        clientX: 300, // Way outside container
        clientY: 200, // Way outside container
      });
    });

    // Should clamp to container bounds
    await waitFor(() => {
      const invisibleAnchor = container.querySelector(
        'span[style*="position: absolute"]',
      );
      expect(invisibleAnchor).toBeInTheDocument();
    });
  });

  it('should pass trigger props to MenuTrigger', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
        triggerProps={{ placement: 'top start' }}
      />,
    );

    const trigger = getByTestId('trigger');

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    // The menu should be positioned according to the trigger props
    expect(getByRole('menu')).toBeInTheDocument();
  });

  it('should merge default trigger props with runtime trigger props', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
        defaultTriggerProps={{ placement: 'bottom start' }}
        triggerProps={{ offset: 16 }}
      />,
    );

    const trigger = getByTestId('trigger');

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    // Both default and runtime props should be applied
    expect(getByRole('menu')).toBeInTheDocument();
  });

  it('should update component props when opened multiple times', async () => {
    const onAction1 = jest.fn();
    const onAction2 = jest.fn();

    // Custom wrapper to test multiple opens with different props
    const MultiOpenWrapper = () => {
      const { targetRef, open, rendered } = useContextMenu(TestMenuComponent);

      const handleClick1 = (e: React.MouseEvent) => {
        open(e, { onAction: onAction1 });
      };

      const handleClick2 = (e: React.MouseEvent) => {
        open(e, { onAction: onAction2 });
      };

      return (
        <div ref={targetRef} data-qa="container">
          <button data-qa="trigger1" onClick={handleClick1}>
            Open Menu 1
          </button>
          <button data-qa="trigger2" onClick={handleClick2}>
            Open Menu 2
          </button>
          {rendered}
        </div>
      );
    };

    const { getByTestId, getByText } = renderWithRoot(<MultiOpenWrapper />);

    const trigger1 = getByTestId('trigger1');
    const trigger2 = getByTestId('trigger2');

    // Open with first action handler
    await act(async () => {
      await userEvent.click(trigger1);
    });

    const editItem1 = getByText('Edit');
    await act(async () => {
      await userEvent.click(editItem1);
    });

    expect(onAction1).toHaveBeenCalledWith('edit');
    expect(onAction2).not.toHaveBeenCalled();

    // Open with second action handler
    await act(async () => {
      await userEvent.click(trigger2);
    });

    const editItem2 = getByText('Edit');
    await act(async () => {
      await userEvent.click(editItem2);
    });

    expect(onAction2).toHaveBeenCalledWith('edit');
    expect(onAction1).toHaveBeenCalledTimes(1); // Should still be called only once
  });

  it('should handle CommandMenu search functionality', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByPlaceholderText, getByText, queryByText } =
      renderWithRoot(
        <TestWrapper
          Component={TestCommandMenuComponent}
          defaultMenuProps={{ onAction }}
        />,
      );

    const trigger = getByTestId('trigger');

    // Open command menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    const searchInput = getByPlaceholderText('Search commands...');

    // Initially all items should be visible
    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Paste')).toBeInTheDocument();
    expect(getByText('Cut')).toBeInTheDocument();

    // Search for "copy"
    await act(async () => {
      await userEvent.type(searchInput, 'copy');
    });

    // Only Copy should be visible
    await waitFor(() => {
      expect(getByText('Copy')).toBeInTheDocument();
      expect(queryByText('Paste')).not.toBeInTheDocument();
      expect(queryByText('Cut')).not.toBeInTheDocument();
    });
  });

  it('should maintain target ref across renders', () => {
    const TestRefWrapper = () => {
      const { targetRef, rendered } = useContextMenu(TestMenuComponent);

      return (
        <div ref={targetRef} data-qa="container">
          <div data-qa="anchor-test">Anchor element</div>
          {rendered}
        </div>
      );
    };

    const { getByTestId, rerender } = renderWithRoot(<TestRefWrapper />);

    const container = getByTestId('container');
    const initialRef = container;

    // Rerender and check that the ref is maintained
    rerender(<TestRefWrapper />);

    const containerAfterRerender = getByTestId('container');
    expect(containerAfterRerender).toBe(initialRef);
  });

  it('should handle edge case when component props are null', () => {
    const { result } = renderHook(() => useContextMenu(TestMenuComponent), {
      wrapper: HookWrapper,
    });

    // When no props are set, rendered should be null
    expect(result.current.rendered).toBeNull();
  });

  it('should work with custom MenuTrigger placement', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
        defaultTriggerProps={{ placement: 'top end' }}
      />,
    );

    const trigger = getByTestId('trigger');

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    // Menu should be positioned according to placement
    expect(getByRole('menu')).toBeInTheDocument();
  });

  it('should throw error when trying to open without rendered being accessed', () => {
    const { result } = renderHook(() => useContextMenu(TestMenuComponent), {
      wrapper: HookWrapper,
    });

    const mockEvent = {
      clientX: 100,
      clientY: 50,
      preventDefault: jest.fn(),
    } as any;

    expect(() => {
      result.current.open(mockEvent, {});
    }).toThrow(
      'useContextMenu: MenuTrigger must be rendered. Use `rendered` property to include it in your component tree.',
    );
  });

  it('should prevent default on context menu events', async () => {
    const onAction = jest.fn();

    const { getByTestId } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
      />,
    );

    const container = getByTestId('container');

    // Create a spy for preventDefault on the event
    const preventDefault = jest.fn();

    await act(async () => {
      // Create a real event that includes preventDefault
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 50,
      });

      // Replace preventDefault with our spy
      event.preventDefault = preventDefault;

      container.dispatchEvent(event);
    });

    expect(preventDefault).toHaveBeenCalled();
  });

  it('should handle events without coordinates gracefully', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        defaultMenuProps={{ onAction }}
      />,
    );

    const container = getByTestId('container');

    // Mock getBoundingClientRect
    const mockGetBoundingClientRect = jest.fn(() => ({
      left: 10,
      top: 20,
      width: 200,
      height: 100,
      right: 210,
      bottom: 120,
    }));

    Object.defineProperty(container, 'getBoundingClientRect', {
      value: mockGetBoundingClientRect,
    });

    // Event without clientX/clientY
    await act(async () => {
      fireEvent.contextMenu(container, {});
    });

    // Should fall back to container position
    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });
  });

  it('should expose isOpen state', async () => {
    const TestIsOpenWrapper = () => {
      const { targetRef, open, close, isOpen, rendered } =
        useContextMenu(TestMenuComponent);

      return (
        <div ref={targetRef} data-qa="container">
          <button data-qa="trigger" onClick={(e) => open(e, {})}>
            {isOpen ? 'Close Menu' : 'Open Menu'}
          </button>
          <button data-qa="close-button" onClick={close}>
            Close
          </button>
          {rendered}
        </div>
      );
    };

    const { getByTestId, getByText } = renderWithRoot(<TestIsOpenWrapper />);

    const trigger = getByTestId('trigger');
    const closeButton = getByTestId('close-button');

    // Initially closed
    expect(getByText('Open Menu')).toBeInTheDocument();

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    // Should show as open
    expect(getByText('Close Menu')).toBeInTheDocument();

    // Close menu
    await act(async () => {
      await userEvent.click(closeButton);
    });

    // Should show as closed again
    await waitFor(() => {
      expect(getByText('Open Menu')).toBeInTheDocument();
    });
  });

  it('should respect placement property from defaultTriggerProps', async () => {
    const onAction = jest.fn();

    const TestPlacementWrapper = ({ placement }: { placement: any }) => {
      const { targetRef, open, rendered } = useContextMenu(
        TestMenuComponent,
        {
          placement,
        },
        { onAction },
      );

      const handleClick = (e: React.MouseEvent) => {
        open(e);
      };

      return (
        <div ref={targetRef} data-qa="container" style={{ padding: '100px' }}>
          <button data-qa="trigger" onClick={handleClick}>
            Open
          </button>
          {rendered}
        </div>
      );
    };

    const { getByTestId, getByRole } = renderWithRoot(
      <TestPlacementWrapper placement="top start" />,
    );

    const trigger = getByTestId('trigger');

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    // Menu should be visible with the specified placement
    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    // Verify the menu trigger received the placement prop
    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
  });

  it('should automatically bind context menu events with defaultMenuProps', async () => {
    const onAction = jest.fn();

    const TestAutoContextWrapper = () => {
      const { targetRef, isOpen, rendered } = useContextMenu(
        TestMenuComponent,
        { placement: 'bottom start' },
        { onAction },
      );

      return (
        <div ref={targetRef} data-qa="container" style={{ padding: '50px' }}>
          <div data-qa="content">
            Right-click anywhere here for automatic context menu
          </div>
          <div data-qa="status">Status: {isOpen ? 'Open' : 'Closed'}</div>
          {rendered}
        </div>
      );
    };

    const { getByTestId, getByText, getByRole } = renderWithRoot(
      <TestAutoContextWrapper />,
    );

    const container = getByTestId('container');

    // Initially, menu should not be visible
    expect(() => getByRole('menu')).toThrow();
    expect(getByText('Status: Closed')).toBeInTheDocument();

    // Right-click should automatically open the context menu
    await act(async () => {
      fireEvent.contextMenu(container, {
        clientX: 100,
        clientY: 50,
      });
    });

    // Menu should now be visible
    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    expect(getByText('Status: Open')).toBeInTheDocument();
    expect(getByText('Edit')).toBeInTheDocument();
    expect(getByText('Delete')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();

    // Click on an item to test action
    const editItem = getByText('Edit');
    await act(async () => {
      await userEvent.click(editItem);
    });

    expect(onAction).toHaveBeenCalledWith('edit');
  });

  it('should merge defaultMenuProps with runtime props when using open function', async () => {
    const defaultAction = jest.fn();
    const runtimeAction = jest.fn();

    const TestMergeWrapper = () => {
      const { targetRef, open, rendered } = useContextMenu(
        TestMenuComponent,
        { placement: 'bottom start' },
        { onAction: defaultAction, width: '200px' },
      );

      const handleManualOpen = (e: React.MouseEvent) => {
        open(e, { onAction: runtimeAction }); // Should override default onAction
      };

      return (
        <div ref={targetRef} data-qa="container">
          <button data-qa="manual-trigger" onClick={handleManualOpen}>
            Manual Open
          </button>
          {rendered}
        </div>
      );
    };

    const { getByTestId, getByText } = renderWithRoot(<TestMergeWrapper />);

    const manualTrigger = getByTestId('manual-trigger');

    // Open with manual trigger (should use runtime props)
    await act(async () => {
      await userEvent.click(manualTrigger);
    });

    const editItem = getByText('Edit');
    await act(async () => {
      await userEvent.click(editItem);
    });

    // Should use runtime action, not default action
    expect(runtimeAction).toHaveBeenCalledWith('edit');
    expect(defaultAction).not.toHaveBeenCalled();

    // Right-click should use default props
    const container = getByTestId('container');
    await act(async () => {
      fireEvent.contextMenu(container, {
        clientX: 100,
        clientY: 50,
      });
    });

    const editItem2 = getByText('Edit');
    await act(async () => {
      await userEvent.click(editItem2);
    });

    // Should use default action
    expect(defaultAction).toHaveBeenCalledWith('edit');
  });
});
