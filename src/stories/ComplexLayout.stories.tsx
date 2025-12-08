import { useState } from 'react';

import { Button, ItemButton } from '../components/actions';
import { Card } from '../components/content/Card/Card';
import { Layout } from '../components/content/Layout';
import { Text } from '../components/content/Text';
import { Title } from '../components/content/Title';
import { Space } from '../components/layout/Space';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Layout> = {
  title: 'Guides/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Layout>;

/**
 * Layout with header, content, and footer.
 */
export const HeaderContentFooter: Story = {
  render: () => (
    <Layout border height="300px">
      <Layout.Header title="Dashboard" />
      <Layout.Content>
        <Text>Content between header and footer.</Text>
      </Layout.Content>
      <Layout.Footer>
        <Text preset="t4" color="#dark-03">
          Status: Ready
        </Text>
        <Button type="primary">Save</Button>
      </Layout.Footer>
    </Layout>
  ),
};

/**
 * Navigation sidebar using Layout.Panel.
 */
export const SidebarLayout: Story = {
  render: function SidebarLayoutStory() {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <Layout border height="400px">
        <Layout.Panel
          side="left"
          size={200}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        >
          <Layout.PanelHeader
            isClosable
            title="Menu"
            onClose={() => setIsOpen(false)}
          />
          <Layout.Content padding=".5x">
            <Space direction="vertical" gap="1bw">
              <ItemButton type="neutral">Dashboard</ItemButton>
              <ItemButton type="neutral">Settings</ItemButton>
              <ItemButton type="neutral">Profile</ItemButton>
            </Space>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Toolbar>
          <Button onPress={() => setIsOpen(!isOpen)}>Toggle Menu</Button>
        </Layout.Toolbar>
        <Layout.Content>
          <Text>Main content area</Text>
        </Layout.Content>
      </Layout>
    );
  },
};

/**
 * Toolbar with left and right sections.
 */
export const ToolbarLeftRight: Story = {
  render: () => (
    <Layout border height="200px">
      <Layout.Toolbar>
        <Title level={4}>App Name</Title>
        <Button type="primary">Action</Button>
      </Layout.Toolbar>
      <Layout.Content>
        <Text>Content below toolbar</Text>
      </Layout.Content>
    </Layout>
  ),
};

/**
 * Toolbar with left, center, and right sections using Space.
 */
export const ToolbarLeftCenterRight: Story = {
  render: () => (
    <Layout border height="200px">
      <Layout.Toolbar>
        <Space>
          <Button>Back</Button>
        </Space>
        <Title level={4}>Page Title</Title>
        <Space>
          <Button>Help</Button>
          <Button type="primary">Save</Button>
        </Space>
      </Layout.Toolbar>
      <Layout.Content>
        <Text>Content below toolbar</Text>
      </Layout.Content>
    </Layout>
  ),
};

/**
 * Header with breadcrumbs navigation and action buttons.
 */
export const HeaderWithBreadcrumbs: Story = {
  render: () => (
    <Layout border height="300px">
      <Layout.Header
        title="User Details"
        breadcrumbs={[
          ['Home', '/'],
          ['Users', '/users'],
        ]}
        extra={
          <Space>
            <Button>Edit</Button>
            <Button type="primary">Save</Button>
          </Space>
        }
      />
      <Layout.Content>
        <Text>User details content</Text>
      </Layout.Content>
    </Layout>
  ),
};

/**
 * Footer with action buttons using invertOrder for primary action on right.
 */
export const FooterWithActions: Story = {
  render: () => (
    <Layout border height="250px">
      <Layout.Header title="Edit Form" />
      <Layout.Content>
        <Text>Form content here</Text>
      </Layout.Content>
      <Layout.Footer invertOrder>
        <Button.Group flow="row-reverse">
          <Button type="primary">Submit</Button>
          <Button>Cancel</Button>
        </Button.Group>
        <Text preset="t4" color="#dark-03">
          Draft saved
        </Text>
      </Layout.Footer>
    </Layout>
  ),
};

/**
 * Resizable side panel with min/max constraints.
 */
export const ResizablePanel: Story = {
  render: function ResizablePanelStory() {
    const [size, setSize] = useState(250);

    return (
      <Layout border height="400px">
        <Layout.Panel
          isResizable
          side="left"
          size={size}
          minSize={150}
          maxSize={400}
          onSizeChange={setSize}
        >
          <Layout.PanelHeader title="Explorer" />
          <Layout.Content padding="1x">
            <Text>Panel width: {size}px</Text>
            <Text preset="t3" color="#dark-02">
              Drag the edge to resize
            </Text>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Content>
          <Text>Main content area</Text>
        </Layout.Content>
      </Layout>
    );
  },
};

/**
 * Sticky panel that floats over content without pushing it.
 */
export const StickyPanel: Story = {
  render: function StickyPanelStory() {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <Layout border height="400px">
        <Layout.Panel
          mode="sticky"
          side="right"
          size={220}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        >
          <Layout.PanelHeader
            isClosable
            title="Quick Actions"
            onClose={() => setIsOpen(false)}
          />
          <Layout.Content>
            <Text>Floating panel - content stays in place</Text>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Toolbar>
          <Button onPress={() => setIsOpen(!isOpen)}>
            {isOpen ? 'Hide' : 'Show'} Panel
          </Button>
        </Layout.Toolbar>
        <Layout.Content>
          <Text>
            Main content is NOT pushed by the sticky panel. Main content is NOT
            pushed by the sticky panel.
          </Text>
        </Layout.Content>
      </Layout>
    );
  },
};

/**
 * Overlay panel with backdrop that dismisses on click, Escape, or focus change.
 */
export const OverlayPanel: Story = {
  render: function OverlayPanelStory() {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <Layout border height="400px">
        <Layout.Panel
          mode="overlay"
          side="right"
          size={280}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        >
          <Layout.PanelHeader
            isClosable
            title="Details"
            onClose={() => setIsOpen(false)}
          />
          <Layout.Content>
            <Text>Click backdrop, press Escape, or focus content to close</Text>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Toolbar>
          <Button type="primary" onPress={() => setIsOpen(true)}>
            Open Overlay Panel
          </Button>
        </Layout.Toolbar>
        <Layout.Content>
          <Text>Background content is dimmed when panel is open</Text>
        </Layout.Content>
      </Layout>
    );
  },
};

/**
 * Panel rendered as a dialog overlay instead of inline.
 */
export const DialogModePanel: Story = {
  render: function DialogModePanelStory() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Layout border height="400px">
        <Layout.Panel
          mode="dialog"
          side="left"
          size={300}
          isDialogOpen={isOpen}
          onDialogOpenChange={setIsOpen}
        >
          <Layout.PanelHeader
            isClosable
            title="Settings"
            onClose={() => setIsOpen(false)}
          />
          <Layout.Content>
            <Text>Panel content as dialog overlay</Text>
          </Layout.Content>
          <Layout.Footer invertOrder>
            <Button type="primary" onPress={() => setIsOpen(false)}>
              Done
            </Button>
          </Layout.Footer>
        </Layout.Panel>
        <Layout.Toolbar>
          <Button type="primary" onPress={() => setIsOpen(true)}>
            Open Settings
          </Button>
        </Layout.Toolbar>
        <Layout.Content>
          <Text>Click the button to open panel as dialog</Text>
        </Layout.Content>
      </Layout>
    );
  },
};

/**
 * Layout nested inside another layout.
 */
export const NestedLayout: Story = {
  render: () => (
    <Layout border height="400px">
      <Layout.Header title="Outer Layout" />
      <Layout flow="row">
        <Layout width="180px" border="right">
          <Layout.Content>
            <Text>Sidebar</Text>
          </Layout.Content>
        </Layout>
        <Layout>
          <Layout.Toolbar>Inner Toolbar</Layout.Toolbar>
          <Layout.Content>
            <Text>Inner content area</Text>
          </Layout.Content>
        </Layout>
      </Layout>
    </Layout>
  ),
};

/**
 * Resizable panes using Layout.Pane component.
 */
export const ResizablePane: Story = {
  render: function ResizablePaneStory() {
    const [leftSize, setLeftSize] = useState(200);

    return (
      <Layout border height="400px">
        <Layout.Header title="Resizable Panes" />
        <Layout.Flex>
          <Layout.Pane
            isResizable
            resizeEdge="right"
            size={leftSize}
            minSize={120}
            maxSize={350}
            onSizeChange={setLeftSize}
          >
            <Title level={5}>Left Pane</Title>
            <Text>Width: {leftSize}px</Text>
          </Layout.Pane>
          <Layout.Content width="min 150px">
            <Title level={5}>Content</Title>
            <Text>Fills remaining space</Text>
          </Layout.Content>
        </Layout.Flex>
      </Layout>
    );
  },
};

/**
 * Grid-based dashboard layout using Layout.Grid.
 */
export const GridDashboard: Story = {
  render: () => (
    <Layout border height="400px">
      <Layout.Header title="Dashboard" />
      <Layout.Grid
        columns="repeat(2, 1fr)"
        rows="repeat(2, 1fr)"
        gap="1x"
        padding="1x"
      >
        <Card>
          <Title level={5}>Metrics</Title>
          <Text>Card 1</Text>
        </Card>
        <Card>
          <Title level={5}>Charts</Title>
          <Text>Card 2</Text>
        </Card>
        <Card>
          <Title level={5}>Activity</Title>
          <Text>Card 3</Text>
        </Card>
        <Card>
          <Title level={5}>Stats</Title>
          <Text>Card 4</Text>
        </Card>
      </Layout.Grid>
    </Layout>
  ),
};

/**
 * Container for horizontally centered content with constrained width.
 */
export const ContainerLayout: Story = {
  render: () => (
    <Layout border height="400px">
      <Layout.Header title="Article Page" />
      <Layout.Container innerStyles={{ width: '80%', gap: '1x' }}>
        <Title level={4}>Understanding Layout Components</Title>
        <Text>
          The Container component centers content horizontally while
          constraining its maximum width. This creates a comfortable reading
          experience for text-heavy pages like articles, documentation, or
          forms.
        </Text>
        <Text>
          The content has a minimum width of 40x (320px) and maximum width of
          120x (960px), ensuring it never gets too narrow on small screens or
          too wide on large displays.
        </Text>
        <Space>
          <Button>Previous</Button>
          <Button type="primary">Next</Button>
        </Space>
      </Layout.Container>
    </Layout>
  ),
};

/**
 * Center for content centered both horizontally and vertically.
 */
export const CenterLayout: Story = {
  render: () => (
    <Layout border height="400px">
      <Layout.Center innerStyles={{ width: '60%', gap: '1x' }}>
        <Title level={2}>No Results Found</Title>
        <Text>
          We couldn&apos;t find any items matching your search criteria.
        </Text>
        <Button type="primary">Clear Filters</Button>
      </Layout.Center>
    </Layout>
  ),
};
