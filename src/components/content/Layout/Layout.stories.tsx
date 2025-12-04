import { useState } from 'react';

import { Button, ItemButton } from '../../actions';
import { Block } from '../../Block';
import { Space } from '../../layout/Space';
import { Card } from '../Card/Card';
import { Text } from '../Text';
import { Title } from '../Title';

import { GridLayout, Layout } from './index';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Layout> = {
  title: 'Content/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Layout>;

export const Default: Story = {
  render: () => (
    <Layout height="100dvh">
      <Layout.Header title="Dashboard" subtitle="Overview of your data" />
      <Layout.Content padding="2x">
        <Text>Main content area</Text>
      </Layout.Content>
      <Layout.Footer>
        <Text preset="t4" color="#dark-03">
          © 2024 Company
        </Text>
      </Layout.Footer>
    </Layout>
  ),
};

export const WithToolbar: Story = {
  render: () => (
    <Layout height="100dvh">
      <Layout.Toolbar>
        <Space>
          <Title level={4}>App Name</Title>
        </Space>
        <Space>
          <Button>Settings</Button>
          <Button type="primary">Profile</Button>
        </Space>
      </Layout.Toolbar>
      <Layout.Content padding="2x">
        <Text>Main content with toolbar above</Text>
      </Layout.Content>
    </Layout>
  ),
};

export const WithBreadcrumbs: Story = {
  render: () => (
    <Layout height="100dvh">
      <Layout.Header
        title="Analytics"
        breadcrumbs={[
          ['Home', '/'],
          ['Reports', '/reports'],
        ]}
        extra={
          <Button.Group>
            <Button>Export</Button>
            <Button type="primary">New Report</Button>
          </Button.Group>
        }
      />
      <Layout.Content padding="2x">
        <Text>Analytics content</Text>
      </Layout.Content>
    </Layout>
  ),
};

export const WithSidePanel: Story = {
  render: function WithSidePanelStory() {
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    return (
      <Layout height="100dvh">
        <Layout.Panel
          side="left"
          size={200}
          isOpen={isPanelOpen}
          onOpenChange={setIsPanelOpen}
        >
          <Layout.PanelHeader
            isClosable
            title="Navigation"
            onClose={() => setIsPanelOpen(false)}
          />
          <Layout.Content padding="1x">
            <Space direction="vertical" gap="0.5x">
              <Button type="neutral" width="100%">
                Dashboard
              </Button>
              <Button type="neutral" width="100%">
                Reports
              </Button>
              <Button type="neutral" width="100%">
                Settings
              </Button>
            </Space>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Toolbar>
          <Space>
            <Button onPress={() => setIsPanelOpen(!isPanelOpen)}>
              Toggle Panel
            </Button>
            <Title level={4}>App</Title>
          </Space>
        </Layout.Toolbar>
        <Layout.Content padding="2x">
          <Text>Main content area</Text>
        </Layout.Content>
      </Layout>
    );
  },
};

export const ResizablePanel: Story = {
  render: function ResizablePanelStory() {
    const [size, setSize] = useState(250);

    return (
      <Layout height="100dvh">
        <Layout.Panel
          isResizable
          side="left"
          size={size}
          minSize={150}
          maxSize={400}
          onSizeChange={setSize}
        >
          <Layout.PanelHeader title="Resizable" />
          <Layout.Content padding="1x">
            <Text>Drag the edge to resize (current: {size}px)</Text>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Content padding="2x">
          <Text>Main content area</Text>
        </Layout.Content>
      </Layout>
    );
  },
};

export const PanelWithTransition: Story = {
  render: function PanelWithTransitionStory() {
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    return (
      <Layout height="100dvh">
        <Layout.Panel
          hasTransition
          side="left"
          size={250}
          isOpen={isPanelOpen}
          onOpenChange={setIsPanelOpen}
        >
          <Layout.PanelHeader
            isClosable
            title="Details"
            onClose={() => setIsPanelOpen(false)}
          />
          <Layout.Content padding="1x">
            <Text>Panel content with slide transition</Text>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Toolbar>
          <Button onPress={() => setIsPanelOpen(!isPanelOpen)}>
            {isPanelOpen ? 'Close' : 'Open'} Panel
          </Button>
        </Layout.Toolbar>
        <Layout.Content padding="2x">
          <Text>Main content area</Text>
        </Layout.Content>
      </Layout>
    );
  },
};

export const ScrollableContent: Story = {
  render: () => (
    <Layout height="100dvh">
      <Layout.Header title="Scrollable Content" />
      <Layout.Content padding="2x" scrollbar="thin">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} style={{ padding: '8px' }}>
            <Text>
              Line {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing
              elit.
            </Text>
          </div>
        ))}
      </Layout.Content>
    </Layout>
  ),
};

export const TinyScrollbar: Story = {
  render: () => (
    <Layout height="100dvh">
      <Layout.Header title="Tiny Scrollbar" />
      <Layout.Content padding="2x" scrollbar="tiny">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} style={{ padding: '8px' }}>
            <Text>
              Line {i + 1}: Hover over the content to see the scrollbar
              indicator.
            </Text>
          </div>
        ))}
      </Layout.Content>
    </Layout>
  ),
};

export const FooterWithInvertedOrder: Story = {
  render: () => (
    <Layout height="100dvh">
      <Layout.Header title="Footer Actions" />
      <Layout.Content padding="2x">
        <Text>Content area</Text>
      </Layout.Content>
      <Layout.Footer invertOrder>
        <Button.Group flow="row-reverse">
          <Button type="primary">Save</Button>
          <Button>Cancel</Button>
        </Button.Group>
        <Text color="#dark-03">Draft saved automatically</Text>
      </Layout.Footer>
    </Layout>
  ),
};

export const GridLayoutExample: Story = {
  render: () => (
    <GridLayout
      height="100dvh"
      columns="repeat(2, 1fr)"
      rows="auto auto 1fr"
      gap="2x"
      padding="2x"
    >
      <Layout.Header gridColumn="1 / 3" title="Grid Dashboard" />
      <Card gridColumn="1 / 3">Full-width card</Card>
      <Card>Left card</Card>
      <Card>Right card</Card>
    </GridLayout>
  ),
};

export const AllPanelSides: Story = {
  render: () => (
    <GridLayout
      height="100dvh"
      columns="1fr 1fr"
      rows="1fr 1fr"
      gap="1x"
      padding="1x"
      fill="#border"
    >
      <Layout fill="#white" contentPadding="2x">
        <Layout.Panel
          isResizable
          side="left"
          defaultSize={100}
          minSize={60}
          maxSize={160}
        >
          <Layout.PanelHeader title="Left" />
          <Layout.Content>
            <Text>Panel content</Text>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Content>
          <Text>side=&quot;left&quot;</Text>
        </Layout.Content>
      </Layout>

      <Layout fill="#white">
        <Layout.Panel
          isResizable
          side="right"
          defaultSize={100}
          minSize={60}
          maxSize={160}
        >
          <Layout.PanelHeader title="Right" />
          <Layout.Content>
            <Text>Panel content</Text>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Content>
          <Text>side=&quot;right&quot;</Text>
        </Layout.Content>
      </Layout>

      <Layout fill="#white">
        <Layout.Panel
          isResizable
          side="top"
          defaultSize={80}
          minSize={50}
          maxSize={120}
        >
          <Layout.PanelHeader title="Top" />
          <Layout.Content>
            <Text>Panel content</Text>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Content>
          <Text>side=&quot;top&quot;</Text>
        </Layout.Content>
      </Layout>

      <Layout fill="#white">
        <Layout.Panel
          isResizable
          side="bottom"
          defaultSize={80}
          minSize={50}
          maxSize={120}
        >
          <Layout.PanelHeader title="Bottom" />
          <Layout.Content>
            <Text>Panel content</Text>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Content>
          <Text>side=&quot;bottom&quot;</Text>
        </Layout.Content>
      </Layout>
    </GridLayout>
  ),
};

export const NestedLayouts: Story = {
  render: () => (
    <Layout height="100dvh">
      <Layout.Header title="Nested Layouts" />
      <Layout flow="row">
        <Layout width="200px" border="right">
          <Layout.Content>
            <Text>Left sidebar</Text>
          </Layout.Content>
        </Layout>
        <Layout>
          <Layout.Toolbar>Inner toolbar</Layout.Toolbar>
          <Layout.Content>Main content</Layout.Content>
        </Layout>
      </Layout>
    </Layout>
  ),
};

export const MultiplePanels: Story = {
  render: function MultiplePanelsStory() {
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);

    return (
      <Layout height="100dvh">
        <Layout.Panel hasTransition side="left" size={180} isOpen={leftOpen}>
          <Layout.PanelHeader
            isClosable
            title="Left"
            onClose={() => setLeftOpen(false)}
          />
          <Layout.Content padding="1x">
            <Text>Left panel</Text>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Panel hasTransition side="right" size={180} isOpen={rightOpen}>
          <Layout.PanelHeader
            isClosable
            title="Right"
            onClose={() => setRightOpen(false)}
          />
          <Layout.Content padding="1x">
            <Text>Right panel</Text>
          </Layout.Content>
        </Layout.Panel>
        <Layout.Toolbar>
          <Button onPress={() => setLeftOpen(!leftOpen)}>Left</Button>
          <Button onPress={() => setRightOpen(!rightOpen)}>Right</Button>
        </Layout.Toolbar>
        <Layout.Content padding="2x">
          <Text>Main content between two panels</Text>
        </Layout.Content>
      </Layout>
    );
  },
};

export const HorizontalScrollableContent: Story = {
  render: () => (
    <Space width="500px" gap="0">
      <Layout.Block fill="#light" placeSelf="center">
        Fixed Left
      </Layout.Block>
      <Layout.Content scrollbar="tiny" placeContent="center">
        <Text nowrap>
          This is a very long line of text that should not wrap and will cause
          horizontal scrolling when it exceeds the container width →→→→→→→→→→→
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua →→→→→→→→
        </Text>
      </Layout.Content>
      <Layout.Block fill="#light" placeSelf="center">
        Fixed Right
      </Layout.Block>
    </Space>
  ),
};

export const CompleteApplicationShell: Story = {
  render: function CompleteApplicationShellStory() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
      <Layout height="100dvh">
        <Layout.Panel
          hasTransition
          isResizable
          side="right"
          defaultSize={240}
          isOpen={sidebarOpen}
          minSize={180}
          maxSize={350}
          onOpenChange={setSidebarOpen}
        >
          <Layout.PanelHeader
            isClosable
            title="Navigation"
            onClose={() => setSidebarOpen(false)}
          />
          <Layout.Content padding="1x" scrollbar="tiny" gap=".5x">
            {['Dashboard', 'Analytics', 'Reports', 'Users', 'Settings'].map(
              (item) => (
                <ItemButton key={item} type="neutral" width="100%">
                  {item}
                </ItemButton>
              ),
            )}
          </Layout.Content>
        </Layout.Panel>

        <Layout.Header
          title="Dashboard"
          level={2}
          breadcrumbs={[
            ['Home', '/'],
            ['Analytics', '/analytics'],
          ]}
          subtitle="Real-time overview of your metrics"
          suffix={
            <Button
              type="neutral"
              aria-label="Toggle sidebar"
              onPress={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </Button>
          }
          extra={
            <>
              <Button flexShrink={1} width="min 0">
                Export
              </Button>
              <Button type="primary" flexShrink={1} width="min 0">
                Create Report
              </Button>
            </>
          }
        />

        <Layout.Content gap="1x">
          {Array.from({ length: 10 }, (_, i) => (
            <Card key={i}>
              <Title level={5}>Card {i + 1}</Title>
              <Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </Text>
            </Card>
          ))}
        </Layout.Content>

        <Layout.Footer>
          <Text preset="t4" color="#dark-03">
            © 2024 Your Company
          </Text>
          <Space>
            <Button type="link" size="small">
              Privacy
            </Button>
            <Button type="link" size="small">
              Terms
            </Button>
          </Space>
        </Layout.Footer>
      </Layout>
    );
  },
};

export const FlexSubComponent: Story = {
  render: () => (
    <Layout height="300px">
      <Layout.Header title="Layout.Flex Example" />
      <Layout.Flex
        flow="row"
        gap="1x"
        placeItems="center"
        placeContent="center"
        padding="1x"
      >
        <Card width="100px" height="80px">
          Item 1
        </Card>
        <Card width="100px" height="80px">
          Item 2
        </Card>
        <Card width="100px" height="80px">
          Item 3
        </Card>
      </Layout.Flex>
    </Layout>
  ),
};

export const FlexWithScrolling: Story = {
  render: () => (
    <Layout height="200px">
      <Layout.Header title="Scrollable Flex Container" />
      <Layout.Flex flow="row" gap="1x" placeItems="start" padding="1x">
        {Array.from({ length: 20 }, (_, i) => (
          <Card key={i} width="100px" height="100px" flexShrink={0}>
            Item {i + 1}
          </Card>
        ))}
      </Layout.Flex>
    </Layout>
  ),
};

export const GridSubComponent: Story = {
  render: () => (
    <Layout height="400px">
      <Layout.Header title="Layout.Grid Example" />
      <Layout.Grid
        columns="repeat(3, 1fr)"
        rows="repeat(2, 1fr)"
        gap="1x"
        flexGrow={1}
      >
        <Card>Cell 1</Card>
        <Card>Cell 2</Card>
        <Card>Cell 3</Card>
        <Card>Cell 4</Card>
        <Card>Cell 5</Card>
        <Card>Cell 6</Card>
      </Layout.Grid>
    </Layout>
  ),
};

export const GridWithTemplate: Story = {
  render: () => (
    <Layout height="400px">
      <Layout.Header title="Grid with Template" />
      <Layout.Grid
        template={`
          "header header header" auto
          "sidebar main main" 1fr
          "footer footer footer" auto
          / 200px 1fr 1fr
        `}
        gap="1x"
      >
        <Card gridArea="header">Header</Card>
        <Card gridArea="sidebar">Sidebar</Card>
        <Card gridArea="main">Main Content</Card>
        <Card gridArea="footer">Footer</Card>
      </Layout.Grid>
    </Layout>
  ),
};

export const GridWithScrolling: Story = {
  render: () => (
    <Layout height="300px">
      <Layout.Header title="Scrollable Grid" />
      <Layout.Grid gap="1x" flow="column" padding="1x">
        {Array.from({ length: 16 }, (_, i) => (
          <Card key={i} width="100px" height="80px" whiteSpace="nowrap">
            Card {i + 1}
          </Card>
        ))}
      </Layout.Grid>
    </Layout>
  ),
};

/**
 * Layout automatically applies height: 100% when it detects it has collapsed
 * to 0 height. This happens when the Layout is placed in a container without
 * a defined height and no explicit height prop is provided.
 *
 * This story demonstrates the auto-height behavior where the Layout is inside
 * a container that has height defined, so it stretches to fill it.
 */
export const AutoHeight: Story = {
  render: () => (
    <Block height="300px" border="1bw dashed #dark-04" padding="1x">
      <Text preset="t4" color="#dark-03">
        Parent container with height: 300px
      </Text>
      <Layout fill="#light">
        <Layout.Header title="Auto-Height Layout" />
        <Layout.Content padding="2x">
          <Text>
            This Layout has no explicit height prop but stretches to fill the
            parent container because the parent has a defined height.
          </Text>
        </Layout.Content>
      </Layout>
    </Block>
  ),
};

/**
 * When a Layout collapses to 0 height (no parent height, no height prop),
 * and the auto-height fallback (100%) still results in 0 height,
 * the Layout shows a development warning and sets a minimum height.
 *
 * This warning is only visible in development mode or when `_forceShowDevWarning`
 * is enabled (used here for storybook which runs in production mode).
 */
export const CollapsedWithWarning: Story = {
  render: () => (
    <Block border="1bw dashed #dark-04" padding="1x">
      <Text preset="t4" color="#dark-03">
        Parent container with no height defined
      </Text>
      <Layout _forceShowDevWarning fill="#light">
        <Layout.Header title="Collapsed Layout" />
        <Layout.Content padding="2x">
          <Text>This content is hidden when collapsed</Text>
        </Layout.Content>
      </Layout>
    </Block>
  ),
};

/**
 * Layout.Pane allows creating resizable inline sections within a layout.
 * Unlike Layout.Panel (which is absolutely positioned), Pane participates
 * in the normal flex/grid flow and can be resized via drag handles.
 */
export const ResizablePanes: Story = {
  render: function ResizablePanesRender() {
    const [leftSize, setLeftSize] = useState(250);
    const [middleSize, setMiddleSize] = useState(400);

    return (
      <Layout height="100dvh">
        <Layout.Header
          title="Resizable Panes"
          subtitle="Drag the handles between panes to resize"
        />
        <Layout.Flex>
          <Layout.Pane
            isResizable
            resizeEdge="right"
            size={leftSize}
            minSize={150}
            maxSize={400}
            fill={{ '': '#white', 'drag | focused': '#purple.08' }}
            onSizeChange={setLeftSize}
          >
            <Title level={5}>Left Pane</Title>
            <Text>Width: {leftSize}px</Text>
            <Text preset="t3" color="#dark-02">
              Drag the right edge to resize. Double-click to reset.
            </Text>
          </Layout.Pane>

          <Layout.Pane
            isResizable
            resizeEdge="right"
            size={middleSize}
            minSize={200}
            fill={{ '': '#white', 'drag | focused': '#purple.08' }}
            onSizeChange={setMiddleSize}
          >
            <Title level={5}>Middle Pane</Title>
            <Text>Width: {middleSize}px</Text>
            <Text preset="t3" color="#dark-02">
              This pane has no maximum size constraint.
            </Text>
          </Layout.Pane>

          <Layout.Content fill="#light" width="min 150px">
            <Title level={5}>Flexible Content</Title>
            <Text>This area fills the remaining space.</Text>
          </Layout.Content>
        </Layout.Flex>
      </Layout>
    );
  },
};

/**
 * Panes can also be resized vertically using the bottom edge.
 */
export const VerticalResizablePanes: Story = {
  render: function VerticalResizablePanesRender() {
    const [topSize, setTopSize] = useState(200);

    return (
      <Layout height="100dvh">
        <Layout.Header title="Vertical Panes" />
        <Layout.Flex flow="column" flexShrink={1}>
          <Layout.Pane
            isResizable
            resizeEdge="bottom"
            size={topSize}
            minSize={100}
            maxSize={400}
            fill="#light"
            onSizeChange={setTopSize}
          >
            <Title level={5}>Top Pane</Title>
            <Text>Height: {topSize}px</Text>
            <Text preset="t3" color="#dark-02">
              Drag the bottom edge to resize.
            </Text>
          </Layout.Pane>

          <Layout.Content fill="#white" flexShrink={0}>
            <Title level={5}>Bottom Content</Title>
            <Text>This area fills the remaining vertical space.</Text>
          </Layout.Content>
        </Layout.Flex>
      </Layout>
    );
  },
};
