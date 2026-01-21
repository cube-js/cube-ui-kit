import { Key, RefObject, useRef, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { DownIcon, MoreIcon } from '../../../icons';
import { Button } from '../../actions/Button';
import { ItemAction } from '../../actions/ItemAction';
import { Menu, MenuTrigger } from '../../actions/Menu';
import { Layout } from '../../content/Layout';
import { Paragraph } from '../../content/Paragraph';
import { Space } from '../../layout/Space';

import { Tab, Tabs } from './Tabs';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CubeTabsRef } from './Tabs';

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    /* State */
    activeKey: {
      control: 'text',
      description: 'Controlled active tab key',
      table: {
        type: { summary: 'Key' },
      },
    },
    defaultActiveKey: {
      control: 'text',
      description: 'Initial active tab key for uncontrolled mode',
      table: {
        type: { summary: 'Key' },
      },
    },

    /* Presentation */
    type: {
      control: 'radio',
      options: ['default', 'file', 'panel', 'radio'],
      description: 'Visual style variant',
      table: {
        type: { summary: "'default' | 'file' | 'panel' | 'radio'" },
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'radio',
      options: ['normal', 'large'],
      description: 'Tab size',
      table: {
        type: { summary: "'normal' | 'large'" },
        defaultValue: { summary: 'normal' },
      },
    },

    /* Behavior */
    prerender: {
      control: 'boolean',
      description: 'If true, all tab panels are rendered but hidden',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    keepMounted: {
      control: 'boolean',
      description: 'If true, visited tab panels stay in DOM',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },

    /* Content */
    label: {
      control: 'text',
      description: 'Accessible label for the tab list',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Tabs' },
      },
    },
    prefix: {
      control: { type: null },
      description: 'Content rendered before the tab list',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    suffix: {
      control: { type: null },
      description: 'Content rendered after the tab list',
      table: {
        type: { summary: 'ReactNode' },
      },
    },

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback when active tab changes',
      table: {
        type: { summary: '(key: Key) => void' },
      },
    },
    onDelete: {
      control: { type: null },
      description:
        'Callback when tab delete button is clicked. Presence enables delete buttons.',
      table: {
        type: { summary: '(key: Key) => void' },
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Basic tabs with content panels
 */
export const Default: Story = {
  render: (args) => (
    <Tabs {...args} defaultActiveKey="tab1">
      <Tab key="tab1" title="Overview">
        <Paragraph>
          This is the overview panel. Tabs provide a way to organize content
          into multiple sections, showing one section at a time.
        </Paragraph>
      </Tab>
      <Tab key="tab2" title="Settings">
        <Paragraph>
          Settings panel content. Users can navigate between tabs using keyboard
          or mouse.
        </Paragraph>
      </Tab>
      <Tab key="tab3" title="Advanced">
        <Paragraph>
          Advanced options panel. React Aria provides full accessibility support
          including keyboard navigation.
        </Paragraph>
      </Tab>
    </Tabs>
  ),
};

/**
 * Default visual style with selection indicator below tabs (default)
 */
export const DefaultType: Story = {
  render: (args) => (
    <Tabs {...args} type="default" defaultActiveKey="tab1">
      <Tab key="tab1" title="Tab 1">
        <Paragraph>
          Default tabs have a selection indicator below the active tab.
        </Paragraph>
      </Tab>
      <Tab key="tab2" title="Tab 2">
        <Paragraph>
          The active tab shows a colored indicator line below it.
        </Paragraph>
      </Tab>
      <Tab key="tab3" title="Tab 3">
        <Paragraph>Hover states use a light purple background.</Paragraph>
      </Tab>
    </Tabs>
  ),
};

/**
 * File-style tabs with fill highlight on selection and delimiter between tabs.
 * Useful for file editor interfaces where multiple documents can be open.
 */
export const FileType: Story = {
  render: (args) => (
    <Tabs {...args} type="file" defaultActiveKey="file1">
      <Tab key="file1" title="index.ts">
        <Paragraph>
          File tabs have a fill highlight when selected and a delimiter between
          tabs.
        </Paragraph>
      </Tab>
      <Tab key="file2" title="utils.ts">
        <Paragraph>
          The selected tab shows a purple tinted background.
        </Paragraph>
      </Tab>
      <Tab key="file3" title="types.ts">
        <Paragraph>Each tab is separated by a 1px border delimiter.</Paragraph>
      </Tab>
    </Tabs>
  ),
};

/**
 * Panel-style tabs with border bottom highlight on selection and delimiter between tabs.
 * Uses a subtle border indicator instead of fill for selection.
 */
export const PanelType: Story = {
  render: (args) => (
    <Tabs {...args} type="panel" defaultActiveKey="panel1">
      <Tab key="panel1" title="Overview">
        <Paragraph>
          Panel tabs use a border bottom highlight instead of fill for
          selection.
        </Paragraph>
      </Tab>
      <Tab key="panel2" title="Details">
        <Paragraph>
          The selected tab shows a purple border at the bottom.
        </Paragraph>
      </Tab>
      <Tab key="panel3" title="Settings">
        <Paragraph>
          Panel tabs have a light background and consistent text color.
        </Paragraph>
      </Tab>
    </Tabs>
  ),
};

/**
 * Radio visual style - compact button-like tabs in a pill container
 */
export const RadioType: Story = {
  render: (args) => (
    <Tabs {...args} type="radio" defaultActiveKey="tab1" width="50x">
      <Tab key="tab1" title="Daily" />
      <Tab key="tab2" title="Weekly" />
      <Tab key="tab3" title="Monthly" />
    </Tabs>
  ),
};

/**
 * Radio type with content panels
 */
export const RadioTypeWithPanels: Story = {
  render: (args) => (
    <Tabs {...args} type="radio" defaultActiveKey="tab1">
      <Tab key="tab1" title="Daily">
        <Paragraph>Daily statistics and reports.</Paragraph>
      </Tab>
      <Tab key="tab2" title="Weekly">
        <Paragraph>Weekly aggregated data.</Paragraph>
      </Tab>
      <Tab key="tab3" title="Monthly">
        <Paragraph>Monthly summary and trends.</Paragraph>
      </Tab>
    </Tabs>
  ),
};

/**
 * Large size tabs for emphasis
 */
export const LargeSize: Story = {
  render: (args) => (
    <Tabs {...args} size="large" defaultActiveKey="tab1">
      <Tab key="tab1" title="Dashboard">
        <Paragraph>
          Large tabs use the t2m typography preset for more prominence.
        </Paragraph>
      </Tab>
      <Tab key="tab2" title="Analytics">
        <Paragraph>Use large tabs for main navigation sections.</Paragraph>
      </Tab>
      <Tab key="tab3" title="Reports">
        <Paragraph>Reports content goes here.</Paragraph>
      </Tab>
    </Tabs>
  ),
};

/**
 * Tabs with a disabled tab
 */
export const DisabledTab: Story = {
  render: (args) => (
    <Tabs {...args} defaultActiveKey="tab1">
      <Tab key="tab1" title="Active Tab">
        <Paragraph>This tab is active and clickable.</Paragraph>
      </Tab>
      <Tab key="tab2" isDisabled title="Disabled Tab">
        <Paragraph>This content is inaccessible.</Paragraph>
      </Tab>
      <Tab key="tab3" title="Another Tab">
        <Paragraph>This tab is also clickable.</Paragraph>
      </Tab>
    </Tabs>
  ),
};

/**
 * Controlled tabs with external state management
 */
export const Controlled: Story = {
  render: function ControlledStory(args) {
    const [activeKey, setActiveKey] = useState<string>('tab1');

    return (
      <Space flow="column" gap="2x">
        <Space gap="1x">
          <Button onPress={() => setActiveKey('tab1')}>Go to Tab 1</Button>
          <Button onPress={() => setActiveKey('tab2')}>Go to Tab 2</Button>
          <Button onPress={() => setActiveKey('tab3')}>Go to Tab 3</Button>
        </Space>

        <Tabs
          {...args}
          activeKey={activeKey}
          onChange={(key) => setActiveKey(String(key))}
        >
          <Tab key="tab1" title="Tab 1">
            <Paragraph>Currently active: {activeKey}</Paragraph>
          </Tab>
          <Tab key="tab2" title="Tab 2">
            <Paragraph>Currently active: {activeKey}</Paragraph>
          </Tab>
          <Tab key="tab3" title="Tab 3">
            <Paragraph>Currently active: {activeKey}</Paragraph>
          </Tab>
        </Tabs>
      </Space>
    );
  },
};

/**
 * Tabs with prefix and suffix content
 */
export const WithPrefixAndSuffix: Story = {
  render: (args) => (
    <Tabs
      {...args}
      size="large"
      defaultActiveKey="tab1"
      prefix={<Button size="small">Menu</Button>}
      suffix={<Button size="small">Add New</Button>}
    >
      <Tab key="tab1" title="Items">
        <Paragraph>List of items here.</Paragraph>
      </Tab>
      <Tab key="tab2" title="Archived">
        <Paragraph>Archived items here.</Paragraph>
      </Tab>
    </Tabs>
  ),
};

/**
 * Deletable tabs with onDelete callback
 */
export const Deletable: Story = {
  render: function DeletableStory(args) {
    const [tabs, setTabs] = useState([
      { key: 'tab1', title: 'Tab 1', content: 'Content for Tab 1' },
      { key: 'tab2', title: 'Tab 2', content: 'Content for Tab 2' },
      { key: 'tab3', title: 'Tab 3', content: 'Content for Tab 3' },
    ]);
    const [activeKey, setActiveKey] = useState('tab1');

    const handleDelete = (key: Key) => {
      setTabs((prev) => prev.filter((tab) => tab.key !== key));

      if (activeKey === key) {
        const remaining = tabs.filter((tab) => tab.key !== key);

        if (remaining.length > 0) {
          setActiveKey(remaining[0].key);
        }
      }
    };

    return (
      <Tabs
        {...args}
        activeKey={activeKey}
        onChange={(key) => setActiveKey(String(key))}
        onDelete={handleDelete}
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} title={tab.title}>
            <Paragraph>{tab.content}</Paragraph>
          </Tab>
        ))}
      </Tabs>
    );
  },
};

/**
 * Navigation-only tabs without panel content
 */
export const NavigationOnly: Story = {
  render: function NavigationOnlyStory(args) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
      <Space flow="column" gap="2x">
        <Tabs
          {...args}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(String(key))}
        >
          <Tab key="overview" title="Overview" />
          <Tab key="settings" title="Settings" />
          <Tab key="users" title="Users" />
        </Tabs>

        <Paragraph>
          Current view: <strong>{activeTab}</strong>
        </Paragraph>
      </Space>
    );
  },
};

/**
 * Explicit panels using Tabs.List and Tabs.Panel
 */
export const ExplicitPanels: Story = {
  render: (args) => (
    <Tabs {...args} defaultActiveKey="panel1">
      <Tabs.List>
        <Tab key="panel1" title="First Panel" />
        <Tab key="panel2" title="Second Panel" />
        <Tab key="panel3" title="Third Panel" />
      </Tabs.List>
      <Tabs.Panel key="panel1">
        <Paragraph>
          Using explicit Tabs.Panel allows for more control over panel placement
          and styling.
        </Paragraph>
      </Tabs.Panel>
      <Tabs.Panel key="panel2">
        <Paragraph>Second panel content with explicit API.</Paragraph>
      </Tabs.Panel>
      <Tabs.Panel key="panel3">
        <Paragraph>Third panel using the separated panels pattern.</Paragraph>
      </Tabs.Panel>
    </Tabs>
  ),
};

/**
 * Prerender mode - all panels rendered but hidden
 */
export const Prerender: Story = {
  render: (args) => (
    <Tabs {...args} prerender defaultActiveKey="tab1">
      <Tab key="tab1" title="Tab 1">
        <Paragraph>
          With prerender enabled, all tab panels are rendered on mount but
          hidden with display: none.
        </Paragraph>
      </Tab>
      <Tab key="tab2" title="Tab 2">
        <Paragraph>
          This panel exists in the DOM even when not visible.
        </Paragraph>
      </Tab>
      <Tab key="tab3" title="Tab 3">
        <Paragraph>
          Useful when tab content needs to maintain state or when you want
          faster tab switching.
        </Paragraph>
      </Tab>
    </Tabs>
  ),
};

/**
 * Keep mounted mode - visited panels stay in DOM
 */
export const KeepMounted: Story = {
  render: (args) => (
    <Tabs {...args} keepMounted defaultActiveKey="tab1">
      <Tab key="tab1" title="Tab 1">
        <Paragraph>
          With keepMounted, panels stay in the DOM once visited.
        </Paragraph>
      </Tab>
      <Tab key="tab2" title="Tab 2">
        <Paragraph>
          Visit this tab, then switch away. The content will remain mounted.
        </Paragraph>
      </Tab>
      <Tab key="tab3" title="Tab 3">
        <Paragraph>
          Useful for preserving form state or component state across tab
          switches.
        </Paragraph>
      </Tab>
    </Tabs>
  ),
};

/**
 * File type with delete functionality - file editor style tabs
 */
export const FileDeletable: Story = {
  render: function FileDeletableStory(args) {
    const [tabs, setTabs] = useState([
      { key: 'file1', title: 'index.ts', content: 'Index file content' },
      { key: 'file2', title: 'utils.ts', content: 'Utility functions' },
      { key: 'file3', title: 'types.ts', content: 'Type definitions' },
    ]);
    const [activeKey, setActiveKey] = useState('file1');

    const handleDelete = (key: Key) => {
      setTabs((prev) => prev.filter((tab) => tab.key !== key));

      if (activeKey === key) {
        const remaining = tabs.filter((tab) => tab.key !== key);

        if (remaining.length > 0) {
          setActiveKey(remaining[0].key);
        }
      }
    };

    return (
      <Tabs
        {...args}
        type="file"
        activeKey={activeKey}
        onChange={(key) => setActiveKey(String(key))}
        onDelete={handleDelete}
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} title={tab.title}>
            <Paragraph>{tab.content}</Paragraph>
          </Tab>
        ))}
      </Tabs>
    );
  },
};

/**
 * Scrollable tabs with tiny scrollbar - demonstrates horizontal scrolling
 */
export const ScrollableTabs: Story = {
  render: (args) => (
    <Tabs
      prefix={<Button size="small">Menu</Button>}
      suffix={<Button size="small">Add New</Button>}
      {...args}
      defaultActiveKey="tab1"
      styles={{ width: '500px' }}
    >
      {Array.from({ length: 15 }, (_, i) => (
        <Tab key={`tab${i + 1}`} title={`Tab ${i + 1}`}>
          <Paragraph>Content for Tab {i + 1}</Paragraph>
        </Tab>
      ))}
    </Tabs>
  ),
};

/**
 * Tabs with custom actions menu - demonstrates adding menus to tabs with Delete and Duplicate actions
 */
export const WithActionsMenu: Story = {
  render: function WithActionsMenuRender(args) {
    const [tabs, setTabs] = useState([
      { id: 'tab1', title: 'Tab 1', content: 'Content for Tab 1' },
      { id: 'tab2', title: 'Tab 2', content: 'Content for Tab 2' },
      { id: 'tab3', title: 'Tab 3', content: 'Content for Tab 3' },
    ]);
    const [activeKey, setActiveKey] = useState<string>('tab1');

    const handleDuplicate = (tabId: string) => {
      const tabToDuplicate = tabs.find((t) => t.id === tabId);
      if (!tabToDuplicate) return;

      const newId = `tab${Date.now()}`;
      const newTab = {
        id: newId,
        title: `${tabToDuplicate.title} (copy)`,
        content: `${tabToDuplicate.content} (duplicated)`,
      };

      const index = tabs.findIndex((t) => t.id === tabId);
      const newTabs = [...tabs];
      newTabs.splice(index + 1, 0, newTab);
      setTabs(newTabs);
      setActiveKey(newId);
    };

    const handleDelete = (tabId: string) => {
      const newTabs = tabs.filter((t) => t.id !== tabId);
      setTabs(newTabs);

      // If we deleted the active tab, select the first remaining tab
      if (activeKey === tabId && newTabs.length > 0) {
        setActiveKey(newTabs[0].id);
      }
    };

    const createTabMenu = (tabId: string) => (
      <MenuTrigger>
        <ItemAction icon={<DownIcon />} aria-label="Tab actions" />
        <Menu
          onAction={(action) => {
            if (action === 'duplicate') {
              handleDuplicate(tabId);
            } else if (action === 'delete') {
              handleDelete(tabId);
            }
          }}
        >
          <Menu.Item key="duplicate">Duplicate</Menu.Item>
          <Menu.Item key="delete" theme="danger">
            Delete
          </Menu.Item>
        </Menu>
      </MenuTrigger>
    );

    return (
      <Tabs
        showActionsOnHover
        {...args}
        type="file"
        activeKey={activeKey}
        onChange={(key) => setActiveKey(String(key))}
      >
        {tabs.map((tab) => (
          <Tab key={tab.id} title={tab.title} actions={createTabMenu(tab.id)}>
            {tab.content}
          </Tab>
        ))}
      </Tabs>
    );
  },
};

/**
 * Editable tabs with title editing - demonstrates inline tab renaming via double-click or menu action
 */
export const WithEditableTabs: Story = {
  render: function WithEditableTabsRender(args) {
    const tabsRef = useRef<CubeTabsRef>(null);
    const [tabs, setTabs] = useState([
      { id: 'tab1', title: 'Tab 1', content: 'Content for Tab 1' },
      { id: 'tab2', title: 'Tab 2', content: 'Content for Tab 2' },
      { id: 'tab3', title: 'Tab 3', content: 'Content for Tab 3' },
    ]);
    const [activeKey, setActiveKey] = useState<string>('tab1');

    const handleTitleChange = (tabId: string, newTitle: string) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, title: newTitle } : t)),
      );
    };

    const handleDuplicate = (tabId: string) => {
      const tabToDuplicate = tabs.find((t) => t.id === tabId);
      if (!tabToDuplicate) return;

      const newId = `tab${Date.now()}`;
      const newTab = {
        id: newId,
        title: `${tabToDuplicate.title} (copy)`,
        content: `${tabToDuplicate.content} (duplicated)`,
      };

      const index = tabs.findIndex((t) => t.id === tabId);
      const newTabs = [...tabs];
      newTabs.splice(index + 1, 0, newTab);
      setTabs(newTabs);
      setActiveKey(newId);
    };

    const handleDelete = (tabId: string) => {
      const newTabs = tabs.filter((t) => t.id !== tabId);
      setTabs(newTabs);

      if (activeKey === tabId && newTabs.length > 0) {
        setActiveKey(newTabs[0].id);
      }
    };

    const createTabMenu = (tabId: string) => (
      <MenuTrigger>
        <ItemAction icon={<DownIcon />} aria-label="Tab actions" />
        <Menu
          onAction={(action) => {
            if (action === 'rename') {
              tabsRef.current?.startEditing(tabId);
            } else if (action === 'duplicate') {
              handleDuplicate(tabId);
            } else if (action === 'delete') {
              handleDelete(tabId);
            }
          }}
        >
          <Menu.Item key="rename">Rename</Menu.Item>
          <Menu.Item key="duplicate">Duplicate</Menu.Item>
          <Menu.Item key="delete" theme="danger">
            Delete
          </Menu.Item>
        </Menu>
      </MenuTrigger>
    );

    return (
      <Tabs
        ref={tabsRef}
        showActionsOnHover
        {...args}
        type="file"
        activeKey={activeKey}
        onChange={(key) => setActiveKey(String(key))}
        onTitleChange={(key, newTitle) =>
          handleTitleChange(String(key), newTitle)
        }
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            isEditable
            title={tab.title}
            width="max 30x"
            actions={createTabMenu(tab.id)}
          >
            {tab.content}
          </Tab>
        ))}
      </Tabs>
    );
  },
};

// Component that tracks and displays its own render count
function RenderCountPanel({
  tabKey,
  countsRef,
}: {
  tabKey: string;
  countsRef: RefObject<Record<string, number>>;
}) {
  // Increment the count on each render
  countsRef.current[tabKey] = (countsRef.current[tabKey] || 0) + 1;
  const count = countsRef.current[tabKey];

  return (
    <div data-qa={`panel-${tabKey}`}>
      <strong>
        {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)} Content
      </strong>
      <p data-qa={`render-count-${tabKey}`}>
        This panel has been rendered <strong>{count}</strong> time
        {count !== 1 ? 's' : ''}.
      </p>
      <p>
        {tabKey === 'tab1' &&
          'The active tab always gets fresh content on each render.'}
        {tabKey === 'tab2' &&
          'Inactive tabs use cached content - no re-render!'}
        {tabKey === 'tab3' &&
          'Switch between tabs to see the caching in action.'}
      </p>
    </div>
  );
}

/**
 * Use `renderPanel` for optimized lazy rendering of tab content.
 * This prevents expensive content from being evaluated on every render -
 * only the active tab's content is computed, while inactive tabs use cached content.
 *
 * **How it works:**
 * - When you switch to a tab, its `renderPanel` function is called
 * - When you switch away, the content is cached
 * - Switching back to a previously visited tab uses the cached content
 * - Use `panelCacheKeys` to invalidate specific panels when dependencies change
 *
 * Run the play function to see the render counts update as tabs are navigated.
 */
export const LazyRenderingWithRenderPanel: Story = {
  render: (args) => {
    // Use a ref to track render counts without causing re-renders
    const countsRef = useRef<Record<string, number>>({});

    return (
      <Space gap="2x" flow="column">
        <Paragraph>
          This example demonstrates lazy rendering with <code>renderPanel</code>{' '}
          and <code>panelCacheKeys</code>. Each panel shows how many times it
          has been rendered. With caching enabled, each tab renders only once!
        </Paragraph>

        <Tabs
          {...args}
          keepMounted
          defaultActiveKey="tab1"
          renderPanel={(key) => (
            <RenderCountPanel tabKey={String(key)} countsRef={countsRef} />
          )}
          // Enable caching for all panels with a static cache key
          panelCacheKeys={{
            tab1: 'cached',
            tab2: 'cached',
            tab3: 'cached',
          }}
        >
          <Tab key="tab1" title="Tab 1" />
          <Tab key="tab2" title="Tab 2" />
          <Tab key="tab3" title="Tab 3" />
        </Tabs>
      </Space>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for initial render
    await new Promise((r) => setTimeout(r, 500));

    // Helper to extract render count from text
    const getRenderCount = (element: HTMLElement): number => {
      const match = element.textContent?.match(/(\d+)\s*time/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Get tabs
    const tab1 = canvas.getByRole('tab', { name: 'Tab 1' });
    const tab2 = canvas.getByRole('tab', { name: 'Tab 2' });
    const tab3 = canvas.getByRole('tab', { name: 'Tab 3' });

    // Verify Tab 1 is initially active and has been rendered exactly once
    expect(canvas.getByTestId('panel-tab1')).toBeInTheDocument();
    expect(getRenderCount(canvas.getByTestId('render-count-tab1'))).toBe(1);

    // Switch to Tab 2
    await userEvent.click(tab2);
    await new Promise((r) => setTimeout(r, 300));

    // Tab 2 should now be rendered exactly once
    expect(canvas.getByTestId('panel-tab2')).toBeInTheDocument();
    expect(getRenderCount(canvas.getByTestId('render-count-tab2'))).toBe(1);

    // Tab 1 should still be 1 (cached)
    expect(getRenderCount(canvas.getByTestId('render-count-tab1'))).toBe(1);

    // Switch to Tab 3
    await userEvent.click(tab3);
    await new Promise((r) => setTimeout(r, 300));

    // Tab 3 should now be rendered exactly once
    expect(canvas.getByTestId('panel-tab3')).toBeInTheDocument();
    expect(getRenderCount(canvas.getByTestId('render-count-tab3'))).toBe(1);

    // Switch back to Tab 1 - should use cached content
    await userEvent.click(tab1);
    await new Promise((r) => setTimeout(r, 300));

    // All tabs should still have count of 1 (all cached)
    expect(getRenderCount(canvas.getByTestId('render-count-tab1'))).toBe(1);
    expect(getRenderCount(canvas.getByTestId('render-count-tab2'))).toBe(1);
    expect(getRenderCount(canvas.getByTestId('render-count-tab3'))).toBe(1);

    // Switch to Tab 2 again - should use cached content
    await userEvent.click(tab2);
    await new Promise((r) => setTimeout(r, 300));

    // All tabs should still have count of 1 (all cached)
    expect(getRenderCount(canvas.getByTestId('render-count-tab1'))).toBe(1);
    expect(getRenderCount(canvas.getByTestId('render-count-tab2'))).toBe(1);
    expect(getRenderCount(canvas.getByTestId('render-count-tab3'))).toBe(1);
  },
};

/**
 * With `keepMounted` enabled, visited tabs stay in the DOM but still use
 * cached content. Combined with `renderPanel`, this provides optimal
 * performance for tabs with expensive content.
 */
export const LazyRenderingWithKeepMounted: Story = {
  render: (args) => {
    return (
      <Tabs
        {...args}
        keepMounted
        defaultActiveKey="tab1"
        renderPanel={(key) => {
          switch (key) {
            case 'tab1':
              return (
                <div>
                  <strong>Dashboard</strong>
                  <p>Your main dashboard with charts and statistics.</p>
                </div>
              );
            case 'tab2':
              return (
                <div>
                  <strong>Settings</strong>
                  <p>
                    Configure your preferences here. State is preserved when
                    switching tabs.
                  </p>
                </div>
              );
            case 'tab3':
              return (
                <div>
                  <strong>Reports</strong>
                  <p>
                    Generate and view reports. Complex data tables would load
                    lazily.
                  </p>
                </div>
              );
            default:
              return null;
          }
        }}
      >
        <Tab key="tab1" title="Dashboard" />
        <Tab key="tab2" title="Settings" />
        <Tab key="tab3" title="Reports" />
      </Tabs>
    );
  },
};

/**
 * Tabs inside a Layout - demonstrates that tab panels stretch to fill remaining space.
 * The Layout has a fixed height, and the Tabs component is inside Layout.Content.
 * Each tab panel contains a nested Layout with a colored background to visualize stretching.
 */
export const InsideLayout: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <Layout height="400px" fill="#light-02">
      <Tabs {...args} defaultActiveKey="tab1">
        <Tab key="tab1" title="Dashboard">
          <Layout fill="#purple.15">
            <Layout.Content>
              <Paragraph>
                This is the Dashboard panel. The purple background should fill
                all remaining space below the tabs bar.
              </Paragraph>
            </Layout.Content>
          </Layout>
        </Tab>
        <Tab key="tab2" title="Analytics">
          <Layout fill="#success.15">
            <Layout.Content>
              <Paragraph>
                This is the Analytics panel. The green background should also
                stretch to fill all available space.
              </Paragraph>
            </Layout.Content>
          </Layout>
        </Tab>
        <Tab key="tab3" title="Settings">
          <Layout fill="#warning.15">
            <Layout.Content>
              <Paragraph>
                This is the Settings panel. The yellow background demonstrates
                consistent stretching behavior across all tabs.
              </Paragraph>
            </Layout.Content>
          </Layout>
        </Tab>
      </Tabs>
    </Layout>
  ),
};
