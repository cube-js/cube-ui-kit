import { useState } from 'react';

import { Button, ItemButton } from '../../actions';
import { Space } from '../../layout/Space';
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
      rows="auto 1fr"
      gap="2x"
      padding="2x"
    >
      <Layout.Header title="Grid Dashboard" />
      <div
        style={{
          gridColumn: '1 / 3',
          background: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
        }}
      >
        <Text>Full-width card</Text>
      </div>
      <div
        style={{
          background: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
        }}
      >
        <Text>Left card</Text>
      </div>
      <div
        style={{
          background: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
        }}
      >
        <Text>Right card</Text>
      </div>
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
          <Layout.Content padding="1x">
            <Text>Left sidebar</Text>
          </Layout.Content>
        </Layout>
        <Layout>
          <Layout.Toolbar>
            <Text>Inner toolbar</Text>
          </Layout.Toolbar>
          <Layout.Content padding="2x">
            <Text>Main content</Text>
          </Layout.Content>
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
          <Space>
            <Button onPress={() => setLeftOpen(!leftOpen)}>Left</Button>
            <Button onPress={() => setRightOpen(!rightOpen)}>Right</Button>
          </Space>
        </Layout.Toolbar>
        <Layout.Content padding="2x">
          <Text>Main content between two panels</Text>
        </Layout.Content>
      </Layout>
    );
  },
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

        <Layout.Content padding="2x" scrollbar="tiny">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              style={{
                padding: '16px',
                marginBottom: '16px',
                background: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <Title level={5}>Card {i + 1}</Title>
              <Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </Text>
            </div>
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
