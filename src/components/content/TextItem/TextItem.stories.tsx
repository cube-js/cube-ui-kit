import { Block } from '../../Block';
import { Space } from '../../layout/Space';

import { TextItem } from './TextItem';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Content/TextItem',
  component: TextItem,
  args: {
    children: 'Text item with overflow handling',
  },
  argTypes: {
    /* Content */
    children: {
      control: 'text',
      description: 'Text content',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    highlight: {
      control: 'text',
      description: 'String to highlight within children',
      table: {
        type: { summary: 'string' },
      },
    },
    highlightCaseSensitive: {
      control: 'boolean',
      description: 'Whether highlight matching is case-sensitive',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },

    /* Tooltip */
    tooltip: {
      control: 'text',
      description:
        'Tooltip configuration. Use true for auto tooltip on overflow, string for custom tooltip text.',
      table: {
        type: { summary: 'string | boolean | TooltipProviderProps' },
        defaultValue: { summary: 'true' },
      },
    },
    tooltipPlacement: {
      control: 'select',
      options: [
        'top',
        'bottom',
        'left',
        'right',
        'top start',
        'top end',
        'bottom start',
        'bottom end',
      ],
      description: 'Default tooltip placement',
      table: {
        type: { summary: 'Placement' },
        defaultValue: { summary: 'top' },
      },
    },
  },
} satisfies Meta<typeof TextItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Simple text item',
  },
};

export const OverflowWithTooltip: Story = {
  render: () => (
    <Block width="200px">
      <TextItem>
        This is a very long text that will be truncated with ellipsis and show a
        tooltip on hover
      </TextItem>
    </Block>
  ),
};

export const WithHighlight: Story = {
  args: {
    children: 'Search results with highlighted text matching your query',
    highlight: 'highlight',
  },
};

export const HighlightCaseSensitive: Story = {
  render: () => (
    <Space flow="column" gap="2x">
      <div>
        <strong>Case-insensitive (default):</strong>
        <TextItem highlight="text">
          TEXT and text and Text are all highlighted
        </TextItem>
      </div>
      <div>
        <strong>Case-sensitive:</strong>
        <TextItem highlightCaseSensitive highlight="text">
          TEXT and text and Text - only lowercase is highlighted
        </TextItem>
      </div>
    </Space>
  ),
};

export const MultipleHighlights: Story = {
  args: {
    children: 'The quick brown fox jumps over the lazy fox',
    highlight: 'fox',
  },
};

export const HighlightWithOverflow: Story = {
  render: () => (
    <Block width="250px">
      <TextItem highlight="important">
        This is a very long text with important information that will be
        truncated
      </TextItem>
    </Block>
  ),
};

export const CustomTooltip: Story = {
  render: () => (
    <Block width="200px">
      <TextItem tooltip="Custom tooltip text that differs from the content">
        Short text
      </TextItem>
    </Block>
  ),
};

export const DisabledTooltip: Story = {
  render: () => (
    <Block width="200px">
      <TextItem tooltip={false}>
        This is a very long text but tooltip is disabled even on overflow
      </TextItem>
    </Block>
  ),
};

export const TooltipPlacements: Story = {
  render: () => (
    <Space flow="column" gap="2x" padding="8x">
      <Block width="200px">
        <TextItem tooltipPlacement="top">
          Tooltip on top - hover to see long text tooltip
        </TextItem>
      </Block>
      <Block width="200px">
        <TextItem tooltipPlacement="bottom">
          Tooltip on bottom - hover to see long text tooltip
        </TextItem>
      </Block>
      <Block width="200px">
        <TextItem tooltipPlacement="left">
          Tooltip on left - hover to see long text tooltip
        </TextItem>
      </Block>
      <Block width="200px">
        <TextItem tooltipPlacement="right">
          Tooltip on right - hover to see long text tooltip
        </TextItem>
      </Block>
    </Space>
  ),
};

export const WithTextStyles: Story = {
  render: () => (
    <Space flow="column" gap="2x">
      <TextItem preset="h3">Heading style text item</TextItem>
      <TextItem preset="t2" color="#purple">
        Colored text item
      </TextItem>
      <TextItem preset="t3m" weight="bold">
        Bold text item
      </TextItem>
    </Space>
  ),
};

export const InConstrainedContainer: Story = {
  render: () => (
    <Space flow="column" gap="2x">
      <Block width="150px" fill="#gray.05" padding="1x">
        <TextItem>Very narrow container</TextItem>
      </Block>
      <Block width="250px" fill="#gray.05" padding="1x">
        <TextItem>Medium width container with more space for text</TextItem>
      </Block>
      <Block width="400px" fill="#gray.05" padding="1x">
        <TextItem>
          Wide container that can fit longer text without truncation
        </TextItem>
      </Block>
    </Space>
  ),
};

export const HighlightInList: Story = {
  render: () => {
    const items = [
      'Apple',
      'Application',
      'Banana',
      'Apply',
      'Grape',
      'Pineapple',
    ];
    const searchTerm = 'app';

    return (
      <Block width="200px">
        <Space flow="column" gap="0.5x">
          {items.map((item) => (
            <TextItem key={item} highlight={searchTerm}>
              {item}
            </TextItem>
          ))}
        </Space>
      </Block>
    );
  },
};
