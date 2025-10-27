import {
  IconCoin,
  IconEdit,
  IconSettings,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { DirectionIcon } from '../../../icons';
import { baseProps } from '../../../stories/lists/baseProps';
import { Button, ItemAction } from '../../actions';
import { Space } from '../../layout/Space';
import { Title } from '../Title';

import { CubeItemProps, Item } from './Item';

// Using any type due to Storybook type compatibility issues
type StoryFn<T = {}> = any;

export default {
  title: 'Content/Item',
  component: Item,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    children: {
      control: { type: 'text' },
      description: 'The content inside the Item',
    },
    icon: {
      control: { type: null },
      description: 'Icon element rendered before the content',
    },
    rightIcon: {
      control: { type: null },
      description: 'Icon element rendered after the content',
    },
    prefix: {
      control: { type: null },
      description: 'Element rendered before the content (after icon)',
    },
    suffix: {
      control: { type: null },
      description: 'Element rendered after the content (before rightIcon)',
    },
    description: {
      control: { type: 'text' },
      description: 'Description text displayed with the item',
    },
    descriptionPlacement: {
      options: ['inline', 'block', 'auto'],
      control: { type: 'radio' },
      description:
        'How the description is positioned relative to the main content',
      table: {
        defaultValue: { summary: 'inline' },
      },
    },

    /* Presentation */
    size: {
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge', 'inline'],
      control: { type: 'radio' },
      description: 'Item size',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },
  },
};

const DEFAULT_STYLES = {
  // border: true,
  // radius: true,
};

const DefaultTemplate: StoryFn<CubeItemProps> = (props) => <Item {...props} />;

const Template: StoryFn<CubeItemProps> = (props) => (
  <Item styles={DEFAULT_STYLES} {...props} />
);

export const Default = DefaultTemplate.bind({});
Default.args = {
  children: 'Default Item',
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  children: 'Item with icon',
  icon: <IconUser />,
};

export const WithRightIcon = Template.bind({});
WithRightIcon.args = {
  children: 'Item with right icon',
  rightIcon: <IconSettings />,
};

export const WithBothIcons = Template.bind({});
WithBothIcons.args = {
  children: 'Item with both icons',
  icon: <IconUser />,
  rightIcon: <IconSettings />,
};

export const WithPrefix = Template.bind({});
WithPrefix.args = {
  children: 'Item with prefix',
  prefix: '$',
};

export const WithSuffix = Template.bind({});
WithSuffix.args = {
  children: 'Item with suffix',
  suffix: '.00',
};

export const FullConfiguration = Template.bind({});
FullConfiguration.args = {
  children: 'Complete Item',
  icon: <IconCoin />,
  rightIcon: <IconSettings />,
  prefix: '$',
  suffix: '.00',
};

export const DifferentSizes: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>XSmall Item</Title>
    <Item {...args} size="xsmall" styles={DEFAULT_STYLES}>
      XSmall size
    </Item>

    <Title level={5}>Small Item</Title>
    <Item {...args} size="small" styles={DEFAULT_STYLES}>
      Small size
    </Item>

    <Title level={5}>Medium Item</Title>
    <Item {...args} size="medium" styles={DEFAULT_STYLES}>
      Medium size
    </Item>

    <Title level={5}>Large Item</Title>
    <Item {...args} size="large" styles={DEFAULT_STYLES}>
      Large size
    </Item>

    <Title level={5}>XLarge Item</Title>
    <Item {...args} size="xlarge" styles={DEFAULT_STYLES}>
      XLarge size
    </Item>

    <Title level={5}>Inline Item</Title>
    <Item {...args} size="inline" styles={DEFAULT_STYLES}>
      Inline size
    </Item>
  </Space>
);

DifferentSizes.args = {
  width: '300px',
};

DifferentSizes.parameters = {
  docs: {
    description: {
      story:
        'Item supports six sizes: `xsmall`, `small`, `medium` (default), `large`, `xlarge`, and `inline` to accommodate different interface requirements.',
    },
  },
};

export const SizesWithIcons: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>XSmall with Icons</Title>
    <Item
      {...args}
      size="xsmall"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      XSmall with icons
    </Item>

    <Title level={5}>Small with Icons</Title>
    <Item
      {...args}
      size="small"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Small with icons
    </Item>

    <Title level={5}>Medium with Icons</Title>
    <Item
      {...args}
      size="medium"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Medium with icons
    </Item>

    <Title level={5}>Large with Icons</Title>
    <Item
      {...args}
      size="large"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Large with icons
    </Item>

    <Title level={5}>XLarge with Icons</Title>
    <Item
      {...args}
      size="xlarge"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      XLarge with icons
    </Item>

    <Title level={5}>Inline with Icons</Title>
    <Item
      {...args}
      size="inline"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Inline with icons
    </Item>
  </Space>
);

SizesWithIcons.args = {
  width: '350px',
};

SizesWithIcons.parameters = {
  docs: {
    description: {
      story:
        'Comparison of all Item sizes when used with icons to show how the component adapts to different content configurations.',
    },
  },
};

export const TextOverflow: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Text Overflow with Limited Width</Title>
    <Item
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '200px' }}
      icon={<IconUser />}
      rightIcon={<IconSettings />}
    >
      This is a very long text that should overflow and show ellipsis when the
      container width is limited
    </Item>

    <Title level={5}>Text Overflow with Prefix and Suffix</Title>
    <Item
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '180px' }}
      icon={<IconCoin />}
      prefix="$"
      suffix=".00"
    >
      Very long product name that exceeds container width
    </Item>

    <Title level={5}>Different Sizes with Text Overflow</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        size="small"
        styles={{ ...DEFAULT_STYLES, width: '150px' }}
        icon={<IconUser />}
      >
        Long text in small size component
      </Item>
      <Item
        {...args}
        size="medium"
        styles={{ ...DEFAULT_STYLES, width: '150px' }}
        icon={<IconUser />}
      >
        Long text in medium size component
      </Item>
      <Item
        {...args}
        size="large"
        styles={{ ...DEFAULT_STYLES, width: '150px' }}
        icon={<IconUser />}
      >
        Long text in large size component
      </Item>
    </Space>
  </Space>
);

TextOverflow.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates how Item handles text overflow with ellipsis when content exceeds the available width. The component uses `text-overflow: ellipsis` and `white-space: nowrap` to gracefully handle long content.',
    },
  },
};

export const ExtraWidth: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Short Text with Extra Width</Title>
    <Item
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '500px' }}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Short text
    </Item>

    <Title level={5}>Medium Text with Extra Width</Title>
    <Item
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '400px' }}
      icon={<IconCoin />}
      prefix="$"
      suffix=".00"
    >
      Product name
    </Item>

    <Title level={5}>Different Sizes with Extra Width</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        size="small"
        styles={{ ...DEFAULT_STYLES, width: '350px' }}
        icon={<IconUser />}
      >
        Small size
      </Item>
      <Item
        {...args}
        size="medium"
        styles={{ ...DEFAULT_STYLES, width: '350px' }}
        icon={<IconUser />}
      >
        Medium size
      </Item>
      <Item
        {...args}
        size="large"
        styles={{ ...DEFAULT_STYLES, width: '350px' }}
        icon={<IconUser />}
      >
        Large size
      </Item>
    </Space>

    <Title level={5}>Icon Only with Extra Width</Title>
    <Item
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '300px' }}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Icon
    </Item>
  </Space>
);

ExtraWidth.parameters = {
  docs: {
    description: {
      story:
        'Shows how Item behaves when given more width than needed for its content. The component maintains its grid layout with proper spacing, and content alignment is controlled by the `placeItems` property.',
    },
  },
};

export const WithCheckbox: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Selected Items (Checkbox Visible)</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item {...args} styles={DEFAULT_STYLES} isSelected={true}>
        Selected item with checkbox
      </Item>
      <Item {...args} styles={DEFAULT_STYLES} isSelected={true} size="small">
        Small selected item
      </Item>
      <Item {...args} styles={DEFAULT_STYLES} isSelected={true} size="large">
        Large selected item
      </Item>
    </Space>

    <Title level={5}>Non-Selected Items (Checkbox Hidden)</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item {...args} styles={DEFAULT_STYLES} isSelected={false}>
        Non-selected item with hidden checkbox
      </Item>
      <Item {...args} styles={DEFAULT_STYLES} isSelected={false} size="small">
        Small non-selected item
      </Item>
      <Item {...args} styles={DEFAULT_STYLES} isSelected={false} size="large">
        Large non-selected item
      </Item>
    </Space>

    <Title level={5}>Mixed Selection States</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={true}
        suffix="Selected"
      >
        Item 1
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={false}
        suffix="Not selected"
      >
        Item 2
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={true}
        suffix="Selected"
      >
        Item 3
      </Item>
    </Space>

    <Title level={5}>Comparison: Checkbox vs Regular Icon</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item {...args} styles={DEFAULT_STYLES} isSelected={true}>
        With checkbox (selected)
      </Item>
      <Item {...args} styles={DEFAULT_STYLES} isSelected={false}>
        With checkbox (not selected)
      </Item>
      <Item {...args} styles={DEFAULT_STYLES} icon={<IconUser />}>
        With regular icon
      </Item>
    </Space>
  </Space>
);

WithCheckbox.args = {
  width: '300px',
};

WithCheckbox.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the checkbox functionality when `isSelected` prop is provided. When `isSelected` is `true`, the checkbox is visible (opacity 1, hover opacity 0.8). When `isSelected` is `false`, the checkbox is invisible (opacity 0, hover opacity 0.4). The checkbox replaces the `icon` prop when `isSelected` is provided.',
    },
  },
};

export const WithHotkeys: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Item with Hotkeys</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        hotkeys="cmd+s"
        as="button"
        onClick={() => alert('Save action triggered!')}
      >
        Save Document
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        hotkeys="cmd+shift+n"
        type="primary"
        as="button"
        icon={<IconUser />}
        onClick={() => alert('New action triggered!')}
      >
        New Item
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        hotkeys="esc"
        type="outline"
        as="button"
        onClick={() => alert('Cancel action triggered!')}
      >
        Cancel
      </Item>
    </Space>

    <Title level={5}>Different Sizes with Hotkeys</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        size="small"
        hotkeys="ctrl+1"
        as="button"
        onClick={() => alert('Small button clicked!')}
      >
        Small with hotkey
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        size="large"
        hotkeys="ctrl+2"
        as="button"
        onClick={() => alert('Large button clicked!')}
      >
        Large with hotkey
      </Item>
    </Space>

    <Title level={5}>Disabled Item with Hotkeys</Title>
    <Item
      {...args}
      styles={DEFAULT_STYLES}
      hotkeys="cmd+d"
      isDisabled={true}
      as="button"
      onClick={() => alert('This should not trigger!')}
    >
      Disabled (hotkey won't work)
    </Item>
  </Space>
);

WithHotkeys.args = {
  width: '300px',
};

WithHotkeys.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the hotkeys functionality when `hotkeys` prop is provided. The hotkey is displayed as a suffix with the HotKeys component, and pressing the specified key combination triggers the onClick handler. Hotkeys are automatically disabled when the component is disabled.',
    },
  },
};

export const WithTooltip: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Simple String Tooltips</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        tooltip={{ title: 'Simple tooltip text', activeWrap: true }}
        as="button"
        icon={<IconUser />}
        onClick={() => alert('Button clicked!')}
      >
        Hover for tooltip
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        tooltip={{
          title: 'This is a primary button with a tooltip',
          activeWrap: true,
        }}
        type="primary"
        as="button"
        onClick={() => alert('Primary button clicked!')}
      >
        Primary with tooltip
      </Item>
    </Space>

    <Title level={5}>Advanced Tooltip Configuration</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        tooltip={{
          title: 'Advanced tooltip with custom placement',
          placement: 'top',
          activeWrap: true,
        }}
        as="button"
        icon={<IconSettings />}
        onClick={() => alert('Top tooltip clicked!')}
      >
        Top placement
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        tooltip={{
          title: 'Right placed tooltip',
          placement: 'right',
          activeWrap: true,
        }}
        as="button"
        onClick={() => alert('Right tooltip clicked!')}
      >
        Right placement
      </Item>
    </Space>

    <Title level={5}>Tooltip with Hotkeys</Title>
    <Item
      {...args}
      styles={DEFAULT_STYLES}
      tooltip={{
        title: 'Save your work with Cmd+S',
        placement: 'top',
        activeWrap: true,
      }}
      hotkeys="cmd+s"
      as="button"
      icon={<IconCoin />}
      onClick={() => alert('Save triggered!')}
    >
      Save Document
    </Item>

    <Title level={5}>Different Sizes with Tooltips</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        size="small"
        tooltip={{ title: 'Small button tooltip', activeWrap: true }}
        as="button"
        onClick={() => alert('Small clicked!')}
      >
        Small
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        size="large"
        tooltip={{ title: 'Large button tooltip', activeWrap: true }}
        as="button"
        onClick={() => alert('Large clicked!')}
      >
        Large
      </Item>
    </Space>
  </Space>
);

WithTooltip.args = {
  width: '250px',
};

WithTooltip.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the tooltip functionality when `tooltip` prop is provided. Supports both string tooltips and advanced configuration objects with custom placement. Note: `activeWrap: true` is required in the tooltip object to make the item interactive.',
    },
  },
};

export const CombinedFeatures: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Hotkeys + Tooltip + Icons</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        hotkeys="cmd+n"
        tooltip={{
          title: 'Create a new document (Cmd+N)',
          placement: 'top',
          activeWrap: true,
        }}
        type="primary"
        as="button"
        icon={<IconUser />}
        onClick={() => alert('New document created!')}
      >
        New Document
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        hotkeys="cmd+o"
        tooltip={{
          title: 'Open an existing document (Cmd+O)',
          activeWrap: true,
        }}
        as="button"
        icon={<IconCoin />}
        rightIcon={<IconSettings />}
        onClick={() => alert('Open document!')}
      >
        Open Document
      </Item>
    </Space>

    <Title level={5}>With Checkbox Selection</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={true}
        hotkeys="space"
        tooltip={{
          title: 'Toggle selection (Space)',
          activeWrap: true,
        }}
        as="button"
        onClick={() => alert('Selection toggled!')}
      >
        Selected item
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={false}
        hotkeys="enter"
        tooltip={{
          title: 'Select this item (Enter)',
          activeWrap: true,
        }}
        as="button"
        onClick={() => alert('Item selected!')}
      >
        Unselected item
      </Item>
    </Space>

    <Title level={5}>Complete Configuration</Title>
    <Item
      {...args}
      styles={DEFAULT_STYLES}
      hotkeys="cmd+shift+s"
      tooltip={{
        title: 'Save document with special options (Cmd+Shift+S)',
        placement: 'bottom',
        activeWrap: true,
      }}
      type="secondary"
      as="button"
      icon={<IconCoin />}
      rightIcon={<IconSettings />}
      prefix="$"
      suffix=".doc"
      description="Advanced save operation"
      onClick={() => alert('Special save!')}
    >
      Save Special
    </Item>
  </Space>
);

CombinedFeatures.args = {
  width: '350px',
};

CombinedFeatures.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the combination of hotkeys, tooltips, icons, checkboxes, and other Item features working together. This shows the full potential of the enhanced Item component.',
    },
  },
};

export const WithLoading: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Auto Loading Slot Selection</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        // loadingSlot="auto" is default - will use icon slot since icon is present
        icon={<IconUser />}
        rightIcon={<IconSettings />}
      >
        Auto: icon present (loads in icon)
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        // loadingSlot="auto" is default - will use rightIcon slot since no icon
        rightIcon={<IconSettings />}
      >
        Auto: no icon, rightIcon present (loads in rightIcon)
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        // loadingSlot="auto" is default - will fallback to icon slot
        prefix="$"
        suffix=".00"
      >
        Auto: no icons present (fallback to icon)
      </Item>
    </Space>

    <Title level={5}>Specific Loading Slots</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        loadingSlot="icon"
        icon={<IconUser />}
        rightIcon={<IconSettings />}
      >
        Explicit icon slot
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        loadingSlot="rightIcon"
        icon={<IconUser />}
        rightIcon={<IconSettings />}
      >
        Explicit rightIcon slot
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        loadingSlot="prefix"
        icon={<IconUser />}
        prefix="$"
      >
        Explicit prefix slot
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        loadingSlot="suffix"
        icon={<IconUser />}
        suffix=".00"
      >
        Explicit suffix slot
      </Item>
    </Space>

    <Title level={5}>Different Sizes with Auto Loading</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        size="small"
        isLoading={true}
        icon={<IconUser />}
      >
        Small size
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        size="medium"
        isLoading={true}
        icon={<IconUser />}
      >
        Medium size
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        size="large"
        isLoading={true}
        icon={<IconUser />}
      >
        Large size
      </Item>
    </Space>

    <Title level={5}>Loading with Different Visual Types</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="item"
        isLoading={true}
        icon={<IconUser />}
      >
        Item type
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="primary"
        isLoading={true}
        icon={<IconUser />}
      >
        Primary type
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="secondary"
        isLoading={true}
        icon={<IconUser />}
      >
        Secondary type
      </Item>
    </Space>
  </Space>
);

WithLoading.args = {
  width: '300px',
};

WithLoading.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the loading functionality with `isLoading` and `loadingSlot` props. The default "auto" mode intelligently selects the best slot: prefers icon if present, then rightIcon, otherwise falls back to icon. Specific slots can be explicitly set. When loading, the component becomes disabled automatically.',
    },
  },
};

export const WithDescriptionBlock: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Description Position Comparison</Title>
    <Space gap="2x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="outline"
        icon={<IconUser />}
        description="This description appears inside the content area"
        descriptionPlacement="inline"
      >
        Item with description inline (default)
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="outline"
        icon={<IconUser />}
        description="This description appears below the entire item"
        descriptionPlacement="block"
      >
        Item with description block
      </Item>
    </Space>

    <Title level={5}>Different Sizes with Description Block</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="outline"
        size="small"
        icon={<IconSettings />}
        description="Small size description block"
        descriptionPlacement="block"
      >
        Small item
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="outline"
        size="medium"
        icon={<IconSettings />}
        description="Medium size description block"
        descriptionPlacement="block"
      >
        Medium item
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="outline"
        size="large"
        icon={<IconSettings />}
        description="Large size description block"
        descriptionPlacement="block"
      >
        Large item
      </Item>
    </Space>

    <Title level={5}>With Multiple Elements and Description Block</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="outline"
        icon={<IconCoin />}
        rightIcon={<IconSettings />}
        prefix="$"
        suffix=".99"
        description="Complete configuration with description positioned below the item"
        descriptionPlacement="block"
      >
        Product Name
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="outline"
        icon={<IconUser />}
        hotkeys="cmd+u"
        description="User management with hotkey and description block"
        descriptionPlacement="block"
      >
        Manage Users
      </Item>
    </Space>

    <Title level={5}>Long Description Block</Title>
    <Item
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '350px' }}
      type="outline"
      icon={<IconCoin />}
      description="This is a very long description that demonstrates how the description text flows when positioned below the item. It can contain multiple lines and will wrap naturally."
      descriptionPlacement="block"
    >
      Item with long description
    </Item>
  </Space>
);

WithDescriptionBlock.args = {
  width: '400px',
};

WithDescriptionBlock.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the `descriptionPlacement="block"` functionality where descriptions are positioned below the entire Item component instead of inside the content area. This is useful for longer descriptions or when you want to maintain a clean main content area.',
    },
  },
};

export const WithActions: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Basic Item with Inline Actions</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Item with actions
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        icon={<IconCoin />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
          </>
        }
      >
        Single action
      </Item>
    </Space>

    <Title level={5}>Different Sizes with Actions</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        size="small"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Small item
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        size="medium"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Medium item
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        size="large"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Large item
      </Item>
    </Space>

    <Title level={5}>Different Types with Actions</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="item"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Item type
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="primary"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Primary type
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="secondary"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Secondary type
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        type="outline"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Outline type
      </Item>
    </Space>

    <Title level={5}>With Complex Configurations</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        icon={<IconCoin />}
        rightIcon={<IconSettings />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        With both icons
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        icon={<IconCoin />}
        prefix="$"
        suffix=".99"
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Product Item
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        icon={<IconUser />}
        description="Additional information"
        descriptionPlacement="inline"
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        With inline description
      </Item>
      <Item
        {...args}
        styles={DEFAULT_STYLES}
        icon={<IconUser />}
        description="Additional information"
        descriptionPlacement="block"
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        With block description
      </Item>
    </Space>

    <Title level={5}>Long Text with Actions</Title>
    <Item
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '400px' }}
      icon={<IconUser />}
      actions={
        <>
          <ItemAction icon={<IconEdit />} aria-label="Edit" />
          <ItemAction icon={<IconTrash />} aria-label="Delete" />
        </>
      }
    >
      This is a very long item name that demonstrates how the actions are
      positioned inline as part of the grid layout
    </Item>
  </Space>
);

WithActions.args = {
  width: '450px',
};

WithActions.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the `actions` prop which allows rendering action buttons inline as part of the grid layout. Unlike ItemButton which positions actions absolutely, Item renders actions as a native grid column that automatically sizes to fit the content. Actions are rendered using the ItemAction component for consistent styling.',
    },
  },
};

export const WithActionsOnHover: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column">
    <Title level={4}>Actions on Hover</Title>
    <Item
      {...args}
      showActionsOnHover
      styles={{ ...DEFAULT_STYLES, width: '400px' }}
      icon={<IconUser />}
      actions={
        <>
          <ItemAction icon={<IconEdit />} aria-label="Edit" />
          <ItemAction icon={<IconTrash />} aria-label="Delete" />
        </>
      }
    >
      Hover to see actions
    </Item>

    <Title level={5}>Different Sizes</Title>
    <Space gap="1x" flow="column">
      <Item
        {...args}
        showActionsOnHover
        styles={DEFAULT_STYLES}
        size="small"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Small with hover actions
      </Item>
      <Item
        {...args}
        showActionsOnHover
        styles={DEFAULT_STYLES}
        size="medium"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Medium with hover actions
      </Item>
      <Item
        {...args}
        showActionsOnHover
        styles={DEFAULT_STYLES}
        size="large"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Large with hover actions
      </Item>
    </Space>

    <Title level={5}>With Description</Title>
    <Item
      {...args}
      showActionsOnHover
      width="150px"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      description="Additional information"
      actions={
        <>
          <ItemAction icon={<IconEdit />} aria-label="Edit" />
          <ItemAction icon={<IconTrash />} aria-label="Delete" />
        </>
      }
    >
      With description
    </Item>
  </Space>
);

WithActionsOnHover.args = {
  width: '450px',
};

WithActionsOnHover.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the `showActionsOnHover` prop which hides actions until the item is hovered, with a smooth transition. The actions space is reserved in the layout to prevent layout shift on hover.',
    },
  },
};

const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const WithAutoTooltip: StoryFn<CubeItemProps> = () => (
  <Item
    qa="auto-tooltip-item"
    icon={<IconUser />}
    style={{ width: '200px' }}
    tooltip={{ delay: 0 }}
  >
    This is a very long label that will overflow and trigger the auto tooltip
  </Item>
);

WithAutoTooltip.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await timeout(250);

  const item = await canvas.findByTestId('auto-tooltip-item');
  // this is a weird hack that makes tooltip working properly on page load
  await userEvent.unhover(item);
  await userEvent.hover(item);

  // Wait for the tooltip to appear - getByRole will throw if not found
  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
};

WithAutoTooltip.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the auto tooltip feature that automatically shows a tooltip when the label text overflows. The tooltip is triggered on hover and displays the full text content.',
    },
  },
};

export const DynamicAutoTooltip: StoryFn<CubeItemProps> = () => {
  const [width, setWidth] = useState('400px');

  return (
    <div>
      <Item
        qa="dynamic-tooltip-item"
        icon={<IconUser />}
        style={{ width }}
        tooltip={{ delay: 0 }}
      >
        This is a very long label that will eventually overflow
      </Item>
      <Button
        qa="resize-button"
        onPress={() =>
          width === '400px' ? setWidth('150px') : setWidth('400px')
        }
      >
        Resize
      </Button>
    </div>
  );
};

// DynamicAutoTooltip.play = async ({ canvasElement }) => {
//   const canvas = within(canvasElement);
//   await timeout(250);

//   const item = await canvas.findByTestId('dynamic-tooltip-item');

//   // Test 1: No tooltip when wide
//   // this is a weird hack that makes tooltip working properly on page load
//   await userEvent.unhover(item);
//   await userEvent.hover(item);
//   await timeout(1000);
//   expect(canvas.queryByRole('tooltip')).toBe(null);

//   // Change width to trigger overflow
//   await userEvent.unhover(item);
//   const resizeButton = await canvas.findByTestId('resize-button');
//   await userEvent.click(resizeButton);
//   // Unhover button after clicking to clear any hover state
//   await userEvent.unhover(resizeButton);
//   await timeout(1000);

//   // Test 2: Tooltip appears when narrow
//   // this is a weird hack that makes tooltip working properly
//   await userEvent.unhover(item);
//   await userEvent.hover(item);

//   await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
// };

DynamicAutoTooltip.parameters = {
  docs: {
    description: {
      story:
        'Tests the dynamic auto tooltip behavior that responds to width changes. Initially the item is wide and no tooltip appears. When the width is reduced, the label overflows and the tooltip automatically appears on hover.',
    },
  },
};
