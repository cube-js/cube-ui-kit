import { fireEvent } from '@testing-library/react';

import { act, renderWithRoot, userEvent, waitFor } from '../../../test';

import { Tab, Tabs } from './Tabs';

jest.mock('../../../_internal/hooks/use-warn');

describe('<Tabs />', () => {
  describe('Basic Rendering', () => {
    it('should render tabs and content', () => {
      const { getByRole, getByText } = renderWithRoot(
        <Tabs defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
        </Tabs>,
      );

      expect(getByRole('tablist')).toBeInTheDocument();
      expect(getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
      expect(getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
      expect(getByText('Content 1')).toBeInTheDocument();
    });

    it('should add data-qa attribute', () => {
      const { getByTestId } = renderWithRoot(
        <Tabs qa="test-tabs" defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content
          </Tab>
        </Tabs>,
      );

      expect(getByTestId('test-tabs')).toBeInTheDocument();
    });

    it('should add data-qa to individual tabs', () => {
      const { getByTestId } = renderWithRoot(
        <Tabs defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1" qa="custom-tab">
            Content
          </Tab>
        </Tabs>,
      );

      expect(getByTestId('custom-tab')).toBeInTheDocument();
    });
  });

  describe('Tab Selection', () => {
    it('should select defaultActiveKey on mount', () => {
      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab2">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
        </Tabs>,
      );

      expect(getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(getByRole('tab', { name: 'Tab 1' })).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });

    it('should switch tabs on click', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <Tabs defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
        </Tabs>,
      );

      expect(getByText('Content 1')).toBeInTheDocument();

      const tab2 = getByRole('tab', { name: 'Tab 2' });

      await userEvent.click(tab2);

      // In React Aria, clicking a tab immediately selects it
      expect(getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(getByText('Content 2')).toBeInTheDocument();
    });

    it('should call onChange when tab is selected', async () => {
      const onChange = jest.fn();
      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1" onChange={onChange}>
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
        </Tabs>,
      );

      await userEvent.click(getByRole('tab', { name: 'Tab 2' }));

      expect(onChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Controlled Mode', () => {
    it('should respect controlled activeKey prop', () => {
      const { getByRole, rerender } = renderWithRoot(
        <Tabs activeKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
        </Tabs>,
      );

      expect(getByRole('tab', { name: 'Tab 1' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      rerender(
        <Tabs activeKey="tab2">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
        </Tabs>,
      );

      expect(getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
  });

  describe('Disabled Tabs', () => {
    it('should disable tab when isDisabled is true', () => {
      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" isDisabled title="Tab 2">
            Content 2
          </Tab>
        </Tabs>,
      );

      expect(getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('should not switch to disabled tab on click', async () => {
      const onChange = jest.fn();
      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1" onChange={onChange}>
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" isDisabled title="Tab 2">
            Content 2
          </Tab>
        </Tabs>,
      );

      await userEvent.click(getByRole('tab', { name: 'Tab 2' }));

      expect(onChange).not.toHaveBeenCalled();
      expect(getByRole('tab', { name: 'Tab 1' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate with arrow keys', async () => {
      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
          <Tab key="tab3" title="Tab 3">
            Content 3
          </Tab>
        </Tabs>,
      );

      const tab1 = getByRole('tab', { name: 'Tab 1' });

      await act(async () => {
        tab1.focus();
      });

      // React Aria uses automatic activation - arrow keys both move focus AND select
      await userEvent.keyboard('{ArrowRight}');

      // Tab 2 should now be selected (automatic activation)
      expect(getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('should skip disabled tabs during keyboard navigation', async () => {
      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" isDisabled title="Tab 2">
            Content 2
          </Tab>
          <Tab key="tab3" title="Tab 3">
            Content 3
          </Tab>
        </Tabs>,
      );

      const tab1 = getByRole('tab', { name: 'Tab 1' });

      await act(async () => {
        tab1.focus();
      });

      await userEvent.keyboard('{ArrowRight}');

      // Should skip disabled tab2 and select tab3
      expect(getByRole('tab', { name: 'Tab 3' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
  });

  describe('Delete Functionality', () => {
    it('should show delete button when onDelete is provided', () => {
      const onDelete = jest.fn();
      const { getByLabelText } = renderWithRoot(
        <Tabs defaultActiveKey="tab1" onDelete={onDelete}>
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      expect(getByLabelText('Delete tab')).toBeInTheDocument();
    });

    it('should call onDelete when delete button is clicked', async () => {
      const onDelete = jest.fn();
      const { getByLabelText } = renderWithRoot(
        <Tabs defaultActiveKey="tab1" onDelete={onDelete}>
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      await userEvent.click(getByLabelText('Delete tab'));

      expect(onDelete).toHaveBeenCalledWith('tab1');
    });
  });

  describe('Prefix and Suffix', () => {
    it('should render prefix and suffix content', () => {
      const { getByText } = renderWithRoot(
        <Tabs
          defaultActiveKey="tab1"
          prefix={<button>Menu</button>}
          suffix={<button>Add</button>}
        >
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      expect(getByText('Menu')).toBeInTheDocument();
      expect(getByText('Add')).toBeInTheDocument();
    });
  });

  describe('Visual Variants', () => {
    it('should render with radio type', () => {
      const { getByTestId, getByRole } = renderWithRoot(
        <Tabs type="radio" defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      // Both TabsElement and individual tabs use data-type="radio" value modifier
      const tabsElement = getByTestId('Tabs');
      const tab = getByRole('tab');

      expect(tabsElement).toHaveAttribute('data-type', 'radio');
      expect(tab).toHaveAttribute('data-type', 'radio');
    });

    it('should render with large size', () => {
      const { container } = renderWithRoot(
        <Tabs size="large" defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      expect(
        container.querySelector('[data-size="large"]'),
      ).toBeInTheDocument();
    });
  });

  describe('Tabs-only Mode (No Panels)', () => {
    it('should render without panels when tabs have no children', () => {
      const { getByRole, queryByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
        </Tabs>,
      );

      expect(getByRole('tablist')).toBeInTheDocument();
      expect(queryByRole('tabpanel')).not.toBeInTheDocument();
    });
  });

  describe('Explicit Panels API', () => {
    it('should render with Tabs.List and Tabs.Panel', () => {
      const { getByRole, getByText } = renderWithRoot(
        <Tabs defaultActiveKey="tab1">
          <Tabs.List>
            <Tab key="tab1" title="Tab 1" />
            <Tab key="tab2" title="Tab 2" />
          </Tabs.List>
          <Tabs.Panel key="tab1">Panel 1 Content</Tabs.Panel>
          <Tabs.Panel key="tab2">Panel 2 Content</Tabs.Panel>
        </Tabs>,
      );

      expect(getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
      expect(getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
      expect(getByText('Panel 1 Content')).toBeInTheDocument();
    });

    it('should switch panels when using explicit API', async () => {
      const { getByRole, getByText, queryByText } = renderWithRoot(
        <Tabs defaultActiveKey="tab1">
          <Tabs.List>
            <Tab key="tab1" title="Tab 1" />
            <Tab key="tab2" title="Tab 2" />
          </Tabs.List>
          <Tabs.Panel key="tab1">Panel 1</Tabs.Panel>
          <Tabs.Panel key="tab2">Panel 2</Tabs.Panel>
        </Tabs>,
      );

      expect(getByText('Panel 1')).toBeInTheDocument();
      // Panel 2 is not rendered initially (not in DOM)
      expect(queryByText('Panel 2')).not.toBeInTheDocument();

      await userEvent.click(getByRole('tab', { name: 'Tab 2' }));

      expect(getByText('Panel 2')).toBeInTheDocument();
    });
  });

  describe('Panel Rendering Modes', () => {
    it('should prerender all panels when prerender is true', () => {
      const { container } = renderWithRoot(
        <Tabs prerender defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
        </Tabs>,
      );

      // Both panels should be in DOM
      expect(container.textContent).toContain('Content 1');
      expect(container.textContent).toContain('Content 2');
    });

    it('should keep mounted panels after visit when keepMounted is true', async () => {
      const { getByRole, container } = renderWithRoot(
        <Tabs keepMounted defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
          <Tab key="tab2" title="Tab 2">
            Content 2
          </Tab>
        </Tabs>,
      );

      // Initially only tab1 content
      expect(container.textContent).toContain('Content 1');
      expect(container.textContent).not.toContain('Content 2');

      // Switch to tab2
      await userEvent.click(getByRole('tab', { name: 'Tab 2' }));

      expect(container.textContent).toContain('Content 2');

      // Switch back to tab1 - tab2 should remain mounted
      await userEvent.click(getByRole('tab', { name: 'Tab 1' }));

      // Both should be in DOM now
      expect(container.textContent).toContain('Content 1');
      expect(container.textContent).toContain('Content 2');
    });
  });

  describe('Functional Panel Rendering (renderPanel)', () => {
    it('should render active panel content using renderPanel', () => {
      const { getByText, queryByText } = renderWithRoot(
        <Tabs
          defaultActiveKey="tab1"
          renderPanel={(key) => {
            switch (key) {
              case 'tab1':
                return <div>Lazy Content 1</div>;
              case 'tab2':
                return <div>Lazy Content 2</div>;
              default:
                return null;
            }
          }}
        >
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
        </Tabs>,
      );

      // Active panel content should be visible
      expect(getByText('Lazy Content 1')).toBeInTheDocument();
      // Inactive panel should not be in DOM (default behavior)
      expect(queryByText('Lazy Content 2')).not.toBeInTheDocument();
    });

    it('should only call renderPanel for active tab (lazy evaluation)', async () => {
      const renderFn = jest.fn((key) => <div>Content {key}</div>);

      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1" renderPanel={renderFn}>
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
          <Tab key="tab3" title="Tab 3" />
        </Tabs>,
      );

      // Initially only tab1 should be rendered
      expect(renderFn).toHaveBeenCalledWith('tab1');
      expect(renderFn).not.toHaveBeenCalledWith('tab2');
      expect(renderFn).not.toHaveBeenCalledWith('tab3');

      renderFn.mockClear();

      // Switch to tab2
      await userEvent.click(getByRole('tab', { name: 'Tab 2' }));

      // Now tab2 should be called
      expect(renderFn).toHaveBeenCalledWith('tab2');
    });

    it('should re-render active panel by default (no caching)', async () => {
      const renderFn = jest.fn((key) => <div>Content {key}</div>);

      const { rerender } = renderWithRoot(
        <Tabs keepMounted activeKey="tab1" renderPanel={renderFn}>
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
        </Tabs>,
      );

      // tab1 should be rendered initially
      expect(renderFn).toHaveBeenCalledWith('tab1');
      const initialCallCount = renderFn.mock.calls.length;

      // Rerender without changes - tab1 should be called again (no caching)
      rerender(
        <Tabs keepMounted activeKey="tab1" renderPanel={renderFn}>
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
        </Tabs>,
      );

      // tab1 should be called again (no caching by default)
      expect(renderFn.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should cache panel content when panelCacheKeys is provided', async () => {
      const renderFn = jest.fn((key) => <div>Content {key}</div>);

      const { getByRole, rerender } = renderWithRoot(
        <Tabs
          keepMounted
          activeKey="tab1"
          renderPanel={renderFn}
          panelCacheKeys={{ tab1: 'v1', tab2: 'v1' }}
        >
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
        </Tabs>,
      );

      // tab1 should be rendered initially
      expect(renderFn).toHaveBeenCalledWith('tab1');

      renderFn.mockClear();

      // Rerender with same cache key - tab1 should NOT be called (cached)
      rerender(
        <Tabs
          keepMounted
          activeKey="tab1"
          renderPanel={renderFn}
          panelCacheKeys={{ tab1: 'v1', tab2: 'v1' }}
        >
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
        </Tabs>,
      );

      // tab1 should NOT be called (cached)
      expect(renderFn).not.toHaveBeenCalledWith('tab1');

      // Switch to tab2
      await userEvent.click(getByRole('tab', { name: 'Tab 2' }));

      // tab2 should be called (first visit)
      expect(renderFn).toHaveBeenCalledWith('tab2');

      renderFn.mockClear();

      // Switch back to tab1 - both should use cached content
      await userEvent.click(getByRole('tab', { name: 'Tab 1' }));

      // Neither should be called - both cached
      expect(renderFn).not.toHaveBeenCalledWith('tab1');
      expect(renderFn).not.toHaveBeenCalledWith('tab2');
    });

    it('should invalidate cache when panelCacheKeys change', async () => {
      const renderFn = jest.fn((key) => <div>Content {key}</div>);

      const { rerender } = renderWithRoot(
        <Tabs
          keepMounted
          activeKey="tab1"
          renderPanel={renderFn}
          panelCacheKeys={{ tab1: 'v1' }}
        >
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
        </Tabs>,
      );

      // tab1 should be rendered initially
      expect(renderFn).toHaveBeenCalledWith('tab1');

      renderFn.mockClear();

      // Rerender with same cache key - tab1 should use cache
      rerender(
        <Tabs
          keepMounted
          activeKey="tab1"
          renderPanel={renderFn}
          panelCacheKeys={{ tab1: 'v1' }}
        >
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
        </Tabs>,
      );

      // tab1 should NOT be called (cached, same cache key)
      expect(renderFn).not.toHaveBeenCalledWith('tab1');

      renderFn.mockClear();

      // Rerender with different cache key for tab1 - should invalidate cache
      rerender(
        <Tabs
          keepMounted
          activeKey="tab1"
          renderPanel={renderFn}
          panelCacheKeys={{ tab1: 'v2' }}
        >
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
        </Tabs>,
      );

      // tab1 should be re-rendered (cache key changed)
      expect(renderFn).toHaveBeenCalledWith('tab1');
    });

    it('should work with prerender option', () => {
      const renderFn = jest.fn((key) => <div>Content {key}</div>);

      renderWithRoot(
        <Tabs prerender defaultActiveKey="tab1" renderPanel={renderFn}>
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
        </Tabs>,
      );

      // With prerender, all tabs should be rendered
      expect(renderFn).toHaveBeenCalledWith('tab1');
      expect(renderFn).toHaveBeenCalledWith('tab2');
    });
  });

  describe('ARIA Attributes', () => {
    it('should have correct aria-label on tablist', () => {
      const { getByRole } = renderWithRoot(
        <Tabs label="Navigation Tabs" defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      expect(getByRole('tablist')).toHaveAttribute(
        'aria-label',
        'Navigation Tabs',
      );
    });

    it('should link tabs to panels with aria-controls', () => {
      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1">
          <Tab key="tab1" title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      const tab = getByRole('tab');
      const panel = getByRole('tabpanel');

      expect(tab).toHaveAttribute('aria-controls', panel.id);
      expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    });
  });

  describe('Title Editing', () => {
    it('should enter edit mode on double-click when isEditable', async () => {
      const user = userEvent.setup();
      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1" onTitleChange={jest.fn()}>
          <Tab key="tab1" isEditable title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      const tab = getByRole('tab');
      const titleSpan = tab.querySelector('span');

      expect(titleSpan).toBeInTheDocument();

      await user.dblClick(titleSpan!);

      // Wait for edit mode (uses chainRaf internally)
      await waitFor(() => {
        expect(getByRole('textbox')).toBeInTheDocument();
      });

      expect(getByRole('textbox')).toHaveValue('Tab 1');
    });

    it('should call onTitleChange when Enter is pressed', async () => {
      const user = userEvent.setup();
      const handleTitleChange = jest.fn();
      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1" onTitleChange={handleTitleChange}>
          <Tab key="tab1" isEditable title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      const tab = getByRole('tab');
      const titleSpan = tab.querySelector('span');

      await user.dblClick(titleSpan!);

      // Wait for edit mode
      await waitFor(() => {
        expect(getByRole('textbox')).toBeInTheDocument();
      });

      const input = getByRole('textbox') as HTMLInputElement;

      // Change value using fireEvent and press Enter
      await act(async () => {
        fireEvent.change(input, { target: { value: 'New Title' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      expect(handleTitleChange).toHaveBeenCalledWith('tab1', 'New Title');
    });

    it('should cancel editing when Escape is pressed', async () => {
      const user = userEvent.setup();
      const handleTitleChange = jest.fn();
      const { getByRole, queryByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1" onTitleChange={handleTitleChange}>
          <Tab key="tab1" isEditable title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      const tab = getByRole('tab');
      const titleSpan = tab.querySelector('span');

      await user.dblClick(titleSpan!);

      // Wait for edit mode
      await waitFor(() => {
        expect(getByRole('textbox')).toBeInTheDocument();
      });

      const input = getByRole('textbox');

      await act(async () => {
        await user.type(input, 'Changed{Escape}');
      });

      await waitFor(() => {
        expect(queryByRole('textbox')).not.toBeInTheDocument();
      });

      expect(handleTitleChange).not.toHaveBeenCalled();
    });

    it('should not submit empty title', async () => {
      const user = userEvent.setup();
      const handleTitleChange = jest.fn();
      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1" onTitleChange={handleTitleChange}>
          <Tab key="tab1" isEditable title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      const tab = getByRole('tab');
      const titleSpan = tab.querySelector('span');

      await user.dblClick(titleSpan!);

      // Wait for edit mode
      await waitFor(() => {
        expect(getByRole('textbox')).toBeInTheDocument();
      });

      const input = getByRole('textbox');

      await act(async () => {
        await user.clear(input);
        await user.type(input, '   {Enter}');
      });

      expect(handleTitleChange).not.toHaveBeenCalled();
    });

    it('should trim title on submit', async () => {
      const user = userEvent.setup();
      const handleTitleChange = jest.fn();
      const { getByRole } = renderWithRoot(
        <Tabs defaultActiveKey="tab1" onTitleChange={handleTitleChange}>
          <Tab key="tab1" isEditable title="Tab 1">
            Content 1
          </Tab>
        </Tabs>,
      );

      const tab = getByRole('tab');
      const titleSpan = tab.querySelector('span');

      await user.dblClick(titleSpan!);

      // Wait for edit mode
      await waitFor(() => {
        expect(getByRole('textbox')).toBeInTheDocument();
      });

      const input = getByRole('textbox') as HTMLInputElement;

      // Change value with whitespace and press Enter - should trim
      await act(async () => {
        fireEvent.change(input, { target: { value: '  Trimmed Title  ' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      expect(handleTitleChange).toHaveBeenCalledWith('tab1', 'Trimmed Title');
    });
  });
});
