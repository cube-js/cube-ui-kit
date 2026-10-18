import { tasty } from '@tenphi/tasty';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode, StrictMode, useEffect, useRef, useState } from 'react';

import { Button } from '../../actions/Button/Button';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';
import { Root } from '../../Root';

import { GridLayout, Layout } from './index';

const renderWithRoot = (children: React.ReactNode) => {
  return render(<Root>{children}</Root>);
};

describe('Layout', () => {
  it('renders Layout with children', () => {
    renderWithRoot(
      <Layout>
        <div data-qa="Child">Content</div>
      </Layout>,
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders Layout with header', () => {
    renderWithRoot(
      <Layout>
        <Layout.Header title="Test Title" />
      </Layout>,
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders Layout with header subtitle', () => {
    renderWithRoot(
      <Layout>
        <Layout.Header title="Title" subtitle="Subtitle text" />
      </Layout>,
    );

    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('renders Layout with toolbar', () => {
    renderWithRoot(
      <Layout>
        <Layout.Toolbar>
          <button>Action</button>
        </Layout.Toolbar>
      </Layout>,
    );

    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders Layout with footer', () => {
    renderWithRoot(
      <Layout>
        <Layout.Footer>
          <span>Footer content</span>
        </Layout.Footer>
      </Layout>,
    );

    expect(screen.getByRole('contentinfo')).toHaveTextContent('Footer content');
  });

  it('gives a footer inside a panel no landmark role', () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <Layout.Footer>Panel footer</Layout.Footer>
        </Layout.Panel>
        <Layout.Footer>Page footer</Layout.Footer>
      </Layout>,
    );

    expect(screen.getByRole('contentinfo')).toHaveTextContent('Page footer');
  });

  it('gives a footer of a nested Layout no landmark role', () => {
    renderWithRoot(
      <Layout>
        <Layout.Content>
          <Layout>
            <Layout.Footer>Nested footer</Layout.Footer>
          </Layout>
        </Layout.Content>
        <Layout.Footer>Page footer</Layout.Footer>
      </Layout>,
    );

    expect(screen.getByRole('contentinfo')).toHaveTextContent('Page footer');
  });

  it('lets an explicit role override the footer role', () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <Layout.Footer role="group" aria-label="Panel actions">
            Panel footer
          </Layout.Footer>
        </Layout.Panel>
      </Layout>,
    );

    expect(
      screen.getByRole('group', { name: 'Panel actions' }),
    ).toHaveTextContent('Panel footer');
  });

  it('renders Layout with content', () => {
    renderWithRoot(
      <Layout>
        <Layout.Content>
          <div>Content text</div>
        </Layout.Content>
      </Layout>,
    );

    expect(screen.getByText('Content text')).toBeInTheDocument();
  });

  it('renders Layout.Panel', () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <div>Panel text</div>
        </Layout.Panel>
      </Layout>,
    );

    expect(screen.getByText('Panel text')).toBeInTheDocument();
  });

  it('leaves dialog panels in their external portal', async () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel side="right" mode="dialog" isDialogOpen>
          Dialog content
        </Layout.Panel>
      </Layout>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Dialog content');
    expect(screen.getByTestId('Layout').contains(dialog)).toBe(false);
  });

  it('renders Layout.PanelHeader', () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <Layout.PanelHeader title="Panel Title" />
        </Layout.Panel>
      </Layout>,
    );

    expect(screen.getByText('Panel Title')).toBeInTheDocument();
  });

  it('renders Layout.PanelHeader with close button', () => {
    const onClose = vi.fn();

    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <Layout.PanelHeader isClosable title="Panel" onClose={onClose} />
        </Layout.Panel>
      </Layout>,
    );

    const closeButton = screen.getByLabelText('Close panel');
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onOpenChange when close button is clicked', async () => {
    const onOpenChange = vi.fn();

    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200} onOpenChange={onOpenChange}>
          <Layout.PanelHeader isClosable title="Panel" />
        </Layout.Panel>
      </Layout>,
    );

    const closeButton = screen.getByLabelText('Close panel');
    await userEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls both onClose and onOpenChange when close button is clicked', async () => {
    const onClose = vi.fn();
    const onOpenChange = vi.fn();

    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200} onOpenChange={onOpenChange}>
          <Layout.PanelHeader isClosable title="Panel" onClose={onClose} />
        </Layout.Panel>
      </Layout>,
    );

    const closeButton = screen.getByLabelText('Close panel');
    await userEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes uncontrolled panel when close button is clicked', async () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200} defaultIsOpen={true}>
          <Layout.PanelHeader isClosable title="Panel" />
          <div>Panel content</div>
        </Layout.Panel>
      </Layout>,
    );

    expect(screen.getByText('Panel content')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close panel');
    await userEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    });
  });

  it('does not render closed panel without transition', () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200} isOpen={false}>
          <div>Panel content</div>
        </Layout.Panel>
      </Layout>,
    );

    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
  });
});

describe('GridLayout', () => {
  it('renders GridLayout with children', () => {
    renderWithRoot(
      <GridLayout columns="1fr 1fr" gap="2x">
        <div>Grid content</div>
      </GridLayout>,
    );

    expect(screen.getByText('Grid content')).toBeInTheDocument();
  });

  it('has all Layout sub-components', () => {
    expect(GridLayout.Toolbar).toBeDefined();
    expect(GridLayout.Header).toBeDefined();
    expect(GridLayout.Footer).toBeDefined();
    expect(GridLayout.Content).toBeDefined();
    expect(GridLayout.Block).toBeDefined();
    expect(GridLayout.Panel).toBeDefined();
    expect(GridLayout.PanelHeader).toBeDefined();
  });
});

describe('Layout.Header breadcrumbs', () => {
  it('renders breadcrumbs', () => {
    renderWithRoot(
      <Layout>
        <Layout.Header
          title="Current Page"
          breadcrumbs={[
            ['Home', '/'],
            ['Parent', '/parent'],
          ]}
        />
      </Layout>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Parent')).toBeInTheDocument();
    // Title appears only once - as the heading (not in breadcrumbs)
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });
});

describe('Layout.Panel resize handler', () => {
  it('renders resize handler when isResizable is true', () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel isResizable side="left" size={200}>
          <div>Panel content</div>
        </Layout.Panel>
      </Layout>,
    );

    const resizeHandler = screen.getByRole('separator');
    expect(resizeHandler).toBeInTheDocument();
    expect(resizeHandler).toHaveAttribute('aria-label', 'Resize left panel');
    expect(resizeHandler).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('has proper aria attributes for horizontal panels', () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel isResizable side="top" size={100}>
          <div>Panel content</div>
        </Layout.Panel>
      </Layout>,
    );

    const resizeHandler = screen.getByRole('separator');
    expect(resizeHandler).toHaveAttribute('aria-orientation', 'horizontal');
    expect(resizeHandler).toHaveAttribute('aria-label', 'Resize top panel');
  });

  it('resize handler is focusable', async () => {
    renderWithRoot(
      <Layout>
        <Layout.Panel isResizable side="left" size={200}>
          <div>Panel content</div>
        </Layout.Panel>
      </Layout>,
    );

    const resizeHandler = screen.getByRole('separator');
    expect(resizeHandler).toHaveAttribute('tabindex', '0');

    await userEvent.tab();
    expect(resizeHandler).toHaveFocus();
  });

  it('calls onSizeChange when double-clicking resize handler', async () => {
    const onSizeChange = vi.fn();

    renderWithRoot(
      <Layout>
        <Layout.Panel
          isResizable
          side="left"
          size={300}
          defaultSize={200}
          onSizeChange={onSizeChange}
        >
          <div>Panel content</div>
        </Layout.Panel>
      </Layout>,
    );

    const resizeHandler = screen.getByRole('separator');
    await userEvent.dblClick(resizeHandler);

    expect(onSizeChange).toHaveBeenCalledWith(200);
  });

  it('resets to defaultSize clamped by minSize on double-click', async () => {
    const onSizeChange = vi.fn();

    renderWithRoot(
      <Layout>
        <Layout.Panel
          isResizable
          side="left"
          size={300}
          defaultSize={100}
          minSize={150}
          onSizeChange={onSizeChange}
        >
          <div>Panel content</div>
        </Layout.Panel>
      </Layout>,
    );

    const resizeHandler = screen.getByRole('separator');
    await userEvent.dblClick(resizeHandler);

    // Should be clamped to minSize
    expect(onSizeChange).toHaveBeenCalledWith(150);
  });
});

describe('Layout nested isolation', () => {
  it('nested Layout panels do not affect parent layout', () => {
    // This test verifies that LayoutContextReset properly isolates nested Layouts
    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <div>Parent panel content</div>
          <Layout>
            <Layout.Panel side="right" size={150}>
              <div>Nested panel content</div>
            </Layout.Panel>
          </Layout>
        </Layout.Panel>
        <Layout.Content>
          <div>Main content</div>
        </Layout.Content>
      </Layout>,
    );

    // Both panels should render without throwing
    expect(screen.getByText('Parent panel content')).toBeInTheDocument();
    expect(screen.getByText('Nested panel content')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('nested Layout can use same side as parent without conflict', () => {
    // Parent has left panel, nested Layout should be able to have left panel too
    // because LayoutContextReset isolates the contexts
    renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <div>Parent left panel</div>
          <Layout>
            <Layout.Panel side="left" size={100}>
              <div>Nested left panel</div>
            </Layout.Panel>
          </Layout>
        </Layout.Panel>
      </Layout>,
    );

    expect(screen.getByText('Parent left panel')).toBeInTheDocument();
    expect(screen.getByText('Nested left panel')).toBeInTheDocument();
  });

  it('styled (tasty-wrapped) panels are correctly detected', () => {
    // Panels wrapped with tasty() should still be detected as panels
    // because detection uses prop-based checking, not component reference
    const StyledPanel = tasty(Layout.Panel, {
      styles: { fill: '#purple-03' },
    });

    renderWithRoot(
      <Layout>
        <StyledPanel side="left" size={200}>
          <div>Styled panel content</div>
        </StyledPanel>
        <Layout.Content>
          <div>Main content</div>
        </Layout.Content>
      </Layout>,
    );

    expect(screen.getByText('Styled panel content')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('styled (tasty-wrapped) panel renders with correct panel structure', () => {
    // Verify the wrapped panel is rendered as a proper Layout.Panel
    // (with data-qa="LayoutPanel" and data-side attribute)
    const StyledPanel = tasty(Layout.Panel, {
      styles: { fill: '#purple-03' },
    });

    renderWithRoot(
      <Layout>
        <StyledPanel side="right" size={250}>
          <div>Panel content</div>
        </StyledPanel>
      </Layout>,
    );

    // Panel should have data-qa="LayoutPanel" (from PanelElement)
    const panel = screen.getByTestId('LayoutPanel');
    expect(panel).toBeInTheDocument();

    // Panel should have data-side="right" attribute
    expect(panel).toHaveAttribute('data-side', 'right');

    // Panel content should be inside the panel, not in the Inner content area
    expect(panel).toContainElement(screen.getByText('Panel content'));

    // The Layout Inner element should NOT contain the panel content
    // (panels render outside the Inner element)
    const layoutInner = document.querySelector('[data-element="Inner"]');
    expect(layoutInner).not.toContainElement(screen.getByText('Panel content'));
  });

  it('custom wrapper components work with Layout.Panel via portals', () => {
    // Test that Layout.Panel works when wrapped in a custom component
    // This is enabled by the portal-based rendering approach
    function SidebarPanel({ children }: { children: React.ReactNode }) {
      return (
        <Layout.Panel side="left" size={250}>
          <Layout.PanelHeader title="Sidebar" />
          {children}
        </Layout.Panel>
      );
    }

    renderWithRoot(
      <Layout>
        <SidebarPanel>
          <div>Sidebar content</div>
        </SidebarPanel>
        <Layout.Content>
          <div>Main content</div>
        </Layout.Content>
      </Layout>,
    );

    // Panel should render correctly
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Sidebar content')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();

    // Verify the panel is portaled to the PanelContainer (outside Inner)
    const panel = screen.getByTestId('LayoutPanel');
    const panelContainer = document.querySelector(
      '[data-element="PanelContainer"]',
    );
    const layoutInner = document.querySelector('[data-element="Inner"]');

    expect(panelContainer).toContainElement(panel);
    expect(layoutInner).not.toContainElement(panel);
  });

  it('nested layouts with resizable panels work independently', () => {
    // Test that resizable panels in nested layouts don't interfere with each other
    renderWithRoot(
      <Layout>
        <Layout.Panel isResizable side="left" size={200}>
          <div>Parent panel</div>
          <Layout>
            <Layout.Panel isResizable side="right" size={150}>
              <div>Nested panel</div>
            </Layout.Panel>
            <Layout.Content>
              <div>Nested content</div>
            </Layout.Content>
          </Layout>
        </Layout.Panel>
        <Layout.Content>
          <div>Parent content</div>
        </Layout.Content>
      </Layout>,
    );

    // Both panels should render with resize handlers
    const resizeHandlers = screen.getAllByRole('separator');
    expect(resizeHandlers).toHaveLength(2);

    // Both panels should render correctly
    expect(screen.getByText('Parent panel')).toBeInTheDocument();
    expect(screen.getByText('Nested panel')).toBeInTheDocument();
    expect(screen.getByText('Parent content')).toBeInTheDocument();
    expect(screen.getByText('Nested content')).toBeInTheDocument();

    // Verify each panel is in its own Layout's PanelContainer
    const panelContainers = document.querySelectorAll(
      '[data-element="PanelContainer"]',
    );
    expect(panelContainers).toHaveLength(2);

    // Each panel container should have exactly one panel
    const panels = screen.getAllByTestId('LayoutPanel');
    expect(panels).toHaveLength(2);

    // Parent panel should be in the first (outer) panel container
    expect(panelContainers[0]).toContainElement(panels[0]);
    // Nested panel should be in the second (inner) panel container
    expect(panelContainers[1]).toContainElement(panels[1]);
  });

  it('panels render correctly after portal container becomes ready', () => {
    // This test verifies that the portal container ready state mechanism works
    // Panels should wait for the container to be ready before rendering via portal
    const { rerender } = renderWithRoot(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <div>Panel content</div>
        </Layout.Panel>
        <Layout.Content>
          <div>Main content</div>
        </Layout.Content>
      </Layout>,
    );

    // Panel should render correctly on initial mount
    expect(screen.getByText('Panel content')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();

    // Panel should be in the PanelContainer (portaled correctly)
    const panelContainer = document.querySelector(
      '[data-element="PanelContainer"]',
    );
    const panel = screen.getByTestId('LayoutPanel');
    expect(panelContainer).toContainElement(panel);

    // Panel content should NOT be inside the Inner element
    const layoutInner = document.querySelector('[data-element="Inner"]');
    expect(layoutInner).not.toContainElement(panel);

    // Rerender to verify stability
    rerender(
      <Layout>
        <Layout.Panel side="left" size={200}>
          <div>Panel content</div>
        </Layout.Panel>
        <Layout.Content>
          <div>Main content</div>
        </Layout.Content>
      </Layout>,
    );

    // Should still be rendered correctly after rerender
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });
});

describe('Layout overlay panel focus', () => {
  // An overlay panel is portalled out of Inner but stays a React child of it,
  // so its focus events bubble to Inner's onFocus. Only focus entering the
  // main content should dismiss it, not focus in another panel.
  function OverlayLayout({
    defaultOpen = true,
    onOpenChange,
    children,
  }: {
    defaultOpen?: boolean;
    onOpenChange: (isOpen: boolean) => void;
    children?: ReactNode;
  }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <Layout>
        {/* Mounted before the overlay panel, so it sits under its backdrop and
            comes before it in tab order. */}
        <Layout.Panel qa="NavPanel" side="left" size={200}>
          <Button>Nav action</Button>
        </Layout.Panel>
        <Layout.Panel
          qa="OverlayPanel"
          side="right"
          size={240}
          mode="overlay"
          isOpen={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            onOpenChange(open);
          }}
        >
          <input aria-label="Panel field" />
          <Button>Panel action</Button>
          {children}
        </Layout.Panel>
        <Layout.Content>
          <Button onPress={() => setIsOpen(true)}>Open panel</Button>
          <Button>Main action</Button>
        </Layout.Content>
      </Layout>
    );
  }

  it('stays open when focus moves to controls inside it', async () => {
    const onOpenChange = vi.fn();

    renderWithRoot(<OverlayLayout onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByLabelText('Panel field'));
    expect(onOpenChange).not.toHaveBeenCalled();
    await userEvent.keyboard('abc');

    const action = screen.getByRole('button', { name: 'Panel action' });
    await userEvent.click(action);

    expect(action).toHaveFocus();
    expect(screen.getByLabelText('Panel field')).toHaveValue('abc');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it.each(['popover', 'modal'] as const)(
    'stays open when focus moves inside a %s opened from it',
    async (type) => {
      const onOpenChange = vi.fn();

      // Opened on mount, so only the dialog's own focus reaches the Layout,
      // never the trigger's.
      renderWithRoot(
        <OverlayLayout onOpenChange={onOpenChange}>
          <DialogTrigger defaultOpen type={type}>
            <Button>Open dialog</Button>
            <Dialog aria-label="Details">
              <input aria-label="Dialog field" />
            </Dialog>
          </DialogTrigger>
        </OverlayLayout>,
      );

      // The dialog focuses itself as it opens.
      expect(onOpenChange).not.toHaveBeenCalled();

      const dialogField = await screen.findByLabelText('Dialog field');
      await userEvent.click(dialogField);

      expect(dialogField).toHaveFocus();
      expect(screen.getByTestId('OverlayPanel')).toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    },
  );

  it('stays open when focus moves into another panel of the same Layout', async () => {
    const onOpenChange = vi.fn();

    renderWithRoot(
      <OverlayLayout defaultOpen={false} onOpenChange={onOpenChange} />,
    );

    // Opened from the main content, the usual flow, so focus reaches the
    // panel from there and only the Shift+Tab below leaves the panel.
    await userEvent.click(screen.getByRole('button', { name: 'Open panel' }));
    await userEvent.click(screen.getByLabelText('Panel field'));
    expect(onOpenChange).not.toHaveBeenCalled();

    // Shift+Tab leaves the overlay panel for the nav panel behind its backdrop.
    await userEvent.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'Nav action' })).toHaveFocus();
    expect(screen.getByTestId('OverlayPanel')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // The restore lands in the main content, which dismisses overlay panels, so
  // the panel must have unregistered by then.
  it('returns focus to an opener in the main content and closes once', async () => {
    const onOpenChange = vi.fn();

    renderWithRoot(
      <OverlayLayout defaultOpen={false} onOpenChange={onOpenChange} />,
    );
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));

    await userEvent.click(screen.getByRole('button', { name: 'Open panel' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Panel field')).toHaveFocus(),
    );
    await userEvent.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Open panel' })).toHaveFocus(),
    );
    expect(onOpenChange.mock.calls).toEqual([[false]]);
  });

  it('dismisses when focus moves into the main content', async () => {
    const onOpenChange = vi.fn();

    renderWithRoot(<OverlayLayout onOpenChange={onOpenChange} />);

    await act(async () =>
      screen.getByRole('button', { name: 'Panel action' }).focus(),
    );
    await act(async () =>
      screen.getByRole('button', { name: 'Main action' }).focus(),
    );

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    await waitFor(() =>
      expect(screen.queryByTestId('OverlayPanel')).not.toBeInTheDocument(),
    );
  });
});

describe.each([false, true])(
  'Layout overlay panel focus on open and close (hasTransition: %s)',
  (hasTransition) => {
    function ToggleLayout({
      onOpenChange = () => {},
      mode = 'overlay',
      defaultOpen = false,
      onCloseFocus,
      children,
    }: {
      onOpenChange?: (isOpen: boolean) => void;
      mode?: 'overlay' | 'default';
      defaultOpen?: boolean;
      onCloseFocus?: () => void;
      children?: ReactNode;
    }) {
      const [isOpen, setIsOpen] = useState(defaultOpen);

      return (
        <>
          <Button onPress={() => setIsOpen(true)}>Open panel</Button>
          <Layout hasTransition={hasTransition}>
            <Layout.Panel
              qa="OverlayPanel"
              side="right"
              size={240}
              mode={mode}
              isOpen={isOpen}
              onOpenChange={(open) => {
                setIsOpen(open);
                onOpenChange(open);
                if (!open) onCloseFocus?.();
              }}
            >
              <Layout.PanelHeader isClosable title="Details" />
              {children ?? <input aria-label="Panel field" />}
            </Layout.Panel>
            <Layout.Content>
              <Button>Main action</Button>
            </Layout.Content>
          </Layout>
        </>
      );
    }

    // The Layout measures itself in the first frame and leaves an open
    // panel's page focus alone until then.
    async function renderReady(ui: ReactNode) {
      const utils = renderWithRoot(ui);

      await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));

      return utils;
    }

    async function open() {
      await userEvent.click(screen.getByRole('button', { name: 'Open panel' }));
    }

    it('moves focus to the first control when it opens', async () => {
      await renderReady(<ToggleLayout />);
      await open();

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Close panel' }),
        ).toHaveFocus(),
      );
    });

    it.each([
      [
        'Escape',
        async () => {
          await userEvent.keyboard('{Escape}');
        },
      ],
      [
        'the close button',
        async () => {
          await userEvent.click(
            screen.getByRole('button', { name: 'Close panel' }),
          );
        },
      ],
      [
        'a backdrop click',
        async () => {
          const backdrop = screen.getByTestId('PanelOverlay');

          // With a transition it takes presses once the panel has slid in.
          await waitFor(() => expect(backdrop).toHaveAttribute('data-visible'));
          await userEvent.click(backdrop);
        },
      ],
    ])('returns focus to the opener when %s closes it', async (_, close) => {
      const onOpenChange = vi.fn();

      await renderReady(<ToggleLayout onOpenChange={onOpenChange} />);
      await open();
      await userEvent.click(screen.getByLabelText('Panel field'));
      await close();

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Open panel' }),
        ).toHaveFocus(),
      );
      // The restore dismisses nothing a second time.
      expect(onOpenChange.mock.calls).toEqual([[false]]);
    });

    it('keeps focus a control inside took as it opened, and still returns it', async () => {
      await renderReady(
        <ToggleLayout>
          <input aria-label="Panel field" />
          <AutoFocused />
        </ToggleLayout>,
      );
      await open();

      expect(screen.getByLabelText('Search')).toHaveFocus();

      await userEvent.keyboard('{Escape}');

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Open panel' }),
        ).toHaveFocus(),
      );
    });

    it('returns focus after a native autoFocus field took it on open', async () => {
      await renderReady(
        <ToggleLayout>
          {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- the case under test */}
          <input autoFocus aria-label="Search" />
        </ToggleLayout>,
      );
      await open();

      expect(screen.getByLabelText('Search')).toHaveFocus();

      await userEvent.keyboard('{Escape}');

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Open panel' }),
        ).toHaveFocus(),
      );
    });

    it('moves focus into the next panel when one press swaps panels', async () => {
      function TwoPanels() {
        const [open, setOpen] = useState<'nav' | 'details' | null>(null);

        return (
          <>
            <Button onPress={() => setOpen('nav')}>Open panel</Button>
            <Layout hasTransition={hasTransition}>
              <Layout.Panel
                side="left"
                size={200}
                mode="overlay"
                isOpen={open === 'nav'}
                onOpenChange={(isOpen) => !isOpen && setOpen(null)}
              >
                <Button onPress={() => setOpen('details')}>Show details</Button>
              </Layout.Panel>
              <Layout.Panel
                side="right"
                size={200}
                mode="overlay"
                isOpen={open === 'details'}
                onOpenChange={(isOpen) => !isOpen && setOpen(null)}
              >
                <input aria-label="Details field" />
              </Layout.Panel>
              <Layout.Content>Main</Layout.Content>
            </Layout>
          </>
        );
      }

      await renderReady(<TwoPanels />);
      await open();
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Show details' }),
        ).toHaveFocus(),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Show details' }),
      );

      await waitFor(() =>
        expect(screen.getByLabelText('Details field')).toHaveFocus(),
      );
    });

    it.each([false, true])(
      'returns focus when the panel unmounts while open (StrictMode: %s)',
      async (isStrict) => {
        function Conditional() {
          const [isShown, setIsShown] = useState(false);

          return (
            <>
              <Button onPress={() => setIsShown(true)}>Open panel</Button>
              <Layout hasTransition={hasTransition}>
                {isShown ? (
                  <Layout.Panel side="right" size={240} mode="overlay" isOpen>
                    <Button onPress={() => setIsShown(false)}>Done</Button>
                  </Layout.Panel>
                ) : null}
                <Layout.Content>Main</Layout.Content>
              </Layout>
            </>
          );
        }

        await renderReady(
          isStrict ? (
            <StrictMode>
              <Conditional />
            </StrictMode>
          ) : (
            <Conditional />
          ),
        );
        await open();
        await waitFor(() =>
          expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus(),
        );
        await userEvent.click(screen.getByRole('button', { name: 'Done' }));

        await waitFor(() =>
          expect(
            screen.getByRole('button', { name: 'Open panel' }),
          ).toHaveFocus(),
        );
      },
    );

    it('leaves page focus alone for a panel open on first render', async () => {
      await renderReady(
        <>
          <Button autoFocus>Pre</Button>
          <ToggleLayout defaultOpen />
        </>,
      );

      expect(screen.getByRole('button', { name: 'Pre' })).toHaveFocus();
    });

    it('does not move focus for a default-mode panel', async () => {
      await renderReady(<ToggleLayout mode="default" />);
      await open();

      expect(screen.getByRole('button', { name: 'Open panel' })).toHaveFocus();
    });

    it('keeps focus the consumer moves on close', async () => {
      const onOpenChange = vi.fn();

      await renderReady(
        <ToggleLayout
          onOpenChange={onOpenChange}
          onCloseFocus={() =>
            screen.getByRole('button', { name: 'Main action' }).focus()
          }
        />,
      );
      await open();
      await userEvent.click(screen.getByLabelText('Panel field'));
      await userEvent.keyboard('{Escape}');

      expect(screen.getByRole('button', { name: 'Main action' })).toHaveFocus();
      // That focus enters the main content, but the panel closes only once.
      expect(onOpenChange.mock.calls).toEqual([[false]]);
    });
  },
);

function AutoFocused() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return <input ref={ref} aria-label="Search" />;
}

describe('Layout.Panel validation', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws error when two panels are on the same side', () => {
    expect(() =>
      renderWithRoot(
        <Layout>
          <Layout.Panel side="left" size={200}>
            Panel 1
          </Layout.Panel>
          <Layout.Panel side="left" size={200}>
            Panel 2
          </Layout.Panel>
        </Layout>,
      ),
    ).toThrow('Layout: Only one panel per side is allowed');
  });

  it('throws error when mixing horizontal and vertical panels (left + top)', () => {
    expect(() =>
      renderWithRoot(
        <Layout>
          <Layout.Panel side="left" size={200}>
            Left Panel
          </Layout.Panel>
          <Layout.Panel side="top" size={100}>
            Top Panel
          </Layout.Panel>
        </Layout>,
      ),
    ).toThrow('Layout: Panels from different axes cannot be combined');
  });

  it('throws error when mixing horizontal and vertical panels (right + bottom)', () => {
    expect(() =>
      renderWithRoot(
        <Layout>
          <Layout.Panel side="right" size={200}>
            Right Panel
          </Layout.Panel>
          <Layout.Panel side="bottom" size={100}>
            Bottom Panel
          </Layout.Panel>
        </Layout>,
      ),
    ).toThrow('Layout: Panels from different axes cannot be combined');
  });

  it('allows left and right panels together', () => {
    expect(() =>
      renderWithRoot(
        <Layout>
          <Layout.Panel side="left" size={200}>
            Left Panel
          </Layout.Panel>
          <Layout.Panel side="right" size={200}>
            Right Panel
          </Layout.Panel>
        </Layout>,
      ),
    ).not.toThrow();
  });

  it('allows top and bottom panels together', () => {
    expect(() =>
      renderWithRoot(
        <Layout>
          <Layout.Panel side="top" size={100}>
            Top Panel
          </Layout.Panel>
          <Layout.Panel side="bottom" size={100}>
            Bottom Panel
          </Layout.Panel>
        </Layout>,
      ),
    ).not.toThrow();
  });
});

describe('Layout collapse warning', () => {
  // jsdom reports `offsetHeight: 0` for every element, so every Layout rendered
  // in a jsdom spec looks collapsed two frames after mount. That made the
  // warning - and, while it replaced `children`, the disappearance of the
  // component under test - a property of the test environment rather than of
  // the layout. Both tests below are the regression: CUB-4300.
  afterEach(() => {
    localStorage.removeItem('UIKIT_DEBUG');
  });

  it('keeps children mounted while the warning is shown', async () => {
    renderWithRoot(
      <Layout _forceShowDevWarning>
        <div data-qa="Child">Content</div>
      </Layout>,
    );

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    // The diagnostic is overlaid, not substituted. Unmounting the subtree turns
    // a wrong guess about height into an outage.
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('does not warn under NODE_ENV=test', () => {
    renderWithRoot(
      <Layout>
        <div data-qa="Child">Content</div>
      </Layout>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('warns when UIKIT_DEBUG opts back in', async () => {
    localStorage.setItem('UIKIT_DEBUG', 'true');

    renderWithRoot(
      <Layout>
        <div data-qa="Child">Content</div>
      </Layout>,
    );

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
