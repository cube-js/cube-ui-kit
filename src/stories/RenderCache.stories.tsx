import { useRef, useState } from 'react';
import { userEvent, within } from 'storybook/test';

import { Block } from '../components/Block';
import { Radio } from '../components/fields/RadioGroup/Radio';
import { Flow } from '../components/layout/Flow';
import { Space } from '../components/layout/Space';
import { RenderCache } from '../utils/react/RenderCache';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Helpers/RenderCache',
  component: RenderCache,
  argTypes: {
    items: {
      control: { type: null },
      description: 'Array of items to render',
    },
    renderKeys: {
      control: { type: null },
      description:
        'Array of keys that should trigger re-render. Only items with keys in this array will be re-rendered',
    },
    getKey: {
      control: { type: null },
      description: 'Function that extracts a unique key from each item',
    },
    children: {
      control: { type: null },
      description:
        'Render function that takes an item and returns a React element',
    },
  },
} satisfies Meta<typeof RenderCache>;

export default meta;

type Story = StoryObj<typeof meta>;

// Item component that tracks and displays render count
function RenderCountItem({ id }: { id: number }) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <Block
      padding="2x"
      radius="1x"
      border="1px solid #border"
      fill="#dark.04"
      data-qa={`item-${id}`}
    >
      Item {id}: Rendered {renderCount.current} time
      {renderCount.current !== 1 ? 's' : ''}
    </Block>
  );
}

export const Default: Story = {
  render: () => {
    const [selectedTab, setSelectedTab] = useState('1');
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

    return (
      <Flow gap="3x">
        <Radio.Tabs
          value={selectedTab}
          label="Select a tab to re-render only that item"
          onChange={setSelectedTab}
        >
          <Radio value="1">Item 1</Radio>
          <Radio value="2">Item 2</Radio>
          <Radio value="3">Item 3</Radio>
          <Radio value="4">Item 4</Radio>
          <Radio value="5">Item 5</Radio>
        </Radio.Tabs>

        <Block>
          <Space placeItems="start" gap="2x">
            <RenderCache
              items={items}
              renderKeys={[parseInt(selectedTab)]}
              getKey={(item) => item.id}
            >
              {(item) => <RenderCountItem key={item.id} id={item.id} />}
            </RenderCache>
          </Space>
        </Block>

        <Block
          padding="2x"
          radius="1x"
          fill="#purple.10"
          border="1px solid #purple"
        >
          <strong>How it works:</strong> Only the selected item re-renders when
          you switch tabs. Other items show their cached render count. This
          demonstrates how RenderCache optimizes performance by avoiding
          unnecessary re-renders.
        </Block>
      </Flow>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for initial render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Click on Item 2 tab
    const item2Tab = canvas.getByRole('radio', { name: 'Item 2' });
    await userEvent.click(item2Tab);

    // Wait for render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Click on Item 3 tab
    const item3Tab = canvas.getByRole('radio', { name: 'Item 3' });
    await userEvent.click(item3Tab);

    // Wait for render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Click on Item 5 tab
    const item5Tab = canvas.getByRole('radio', { name: 'Item 5' });
    await userEvent.click(item5Tab);

    // Wait for render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Click back to Item 2 to show it re-renders again
    await userEvent.click(item2Tab);

    // Final wait
    await new Promise((resolve) => setTimeout(resolve, 100));
  },
};
