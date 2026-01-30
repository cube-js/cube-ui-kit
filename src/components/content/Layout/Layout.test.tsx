import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { tasty } from '../../../tasty';
import { Root } from '../../Root';

import { GridLayout, Layout } from './index';

const renderWithRoot = (children: React.ReactNode) => {
  return render(<Root>{children}</Root>);
};

describe('Layout', () => {
  it('renders Layout with children', () => {
    renderWithRoot(
      <Layout>
        <div data-qa="child">Content</div>
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

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
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
    const onClose = jest.fn();

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
    const onOpenChange = jest.fn();

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
    const onClose = jest.fn();
    const onOpenChange = jest.fn();

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
    // Title appears twice - once in breadcrumbs and once in title
    expect(screen.getAllByText('Current Page')).toHaveLength(2);
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
    const onSizeChange = jest.fn();

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
    const onSizeChange = jest.fn();

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
});

describe('Layout.Panel validation', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
