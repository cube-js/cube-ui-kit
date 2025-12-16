import {
  IconCoin,
  IconEdit,
  IconSettings,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { Fragment, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { DirectionIcon } from '../../../icons';
import { baseProps } from '../../../stories/lists/baseProps';
import { Button, ItemAction } from '../../actions';
import { Block } from '../../Block';
import { Flow } from '../../layout/Flow';
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
      description:
        'Icon rendered before the content. Can be: ReactNode, `"checkbox"`, `true` (empty slot), or function `({ selected, loading, ...mods }) => ReactNode | true`',
    },
    rightIcon: {
      control: { type: null },
      description:
        'Icon rendered after the content. Can be: ReactNode, `true` (empty slot), or function `({ selected, loading, ...mods }) => ReactNode | true`',
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
      options: ['inline', 'block'],
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
    shape: {
      options: ['card', 'button', 'sharp'],
      control: { type: 'radio' },
      description: 'Shape of the item border radius',
      table: {
        defaultValue: { summary: 'button' },
      },
    },
    showActionsOnHover: {
      control: { type: 'boolean' },
      description:
        'When true, actions are hidden by default and shown only on hover, focus, or focus-within',
      table: {
        defaultValue: { summary: false },
      },
    },
  },
};

const DefaultTemplate: StoryFn<CubeItemProps> = (props) => <Item {...props} />;

const Template: StoryFn<CubeItemProps> = (props) => <Item {...props} />;

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
    <Item {...args} size="inline" icon={<IconUser />}>
      Inline size
    </Item>
    <Item {...args} size="xsmall" icon={<IconUser />}>
      XSmall size
    </Item>
    <Item {...args} size="small" icon={<IconUser />}>
      Small size
    </Item>
    <Item {...args} size="medium" icon={<IconUser />}>
      Medium size
    </Item>
    <Item {...args} size="large" icon={<IconUser />}>
      Large size
    </Item>
    <Item {...args} size="xlarge" icon={<IconUser />}>
      XLarge size
    </Item>

    <Item {...args} border size="xsmall" type="header" icon={<IconUser />}>
      XSmall header
    </Item>
    <Item {...args} border size="small" type="header" icon={<IconUser />}>
      Small header
    </Item>
    <Item {...args} border size="medium" type="header" icon={<IconUser />}>
      Medium header
    </Item>
    <Item {...args} border size="large" type="header" icon={<IconUser />}>
      Large header
    </Item>
    <Item {...args} border size="xlarge" type="header" icon={<IconUser />}>
      XLarge header
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
        'Item supports five sizes: `xsmall`, `small`, `medium` (default), `large`, and `xlarge` to accommodate different interface requirements.',
    },
  },
};

export const SizesWithIcons: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>XSmall with Icons</Title>
    <Item
      {...args}
      size="xsmall"
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      XSmall with icons
    </Item>

    <Title level={5}>Small with Icons</Title>
    <Item
      {...args}
      size="small"
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Small with icons
    </Item>

    <Title level={5}>Medium with Icons</Title>
    <Item
      {...args}
      size="medium"
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Medium with icons
    </Item>

    <Title level={5}>Large with Icons</Title>
    <Item
      {...args}
      size="large"
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Large with icons
    </Item>

    <Title level={5}>XLarge with Icons</Title>
    <Item
      {...args}
      size="xlarge"
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      XLarge with icons
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
      styles={{ width: '200px' }}
      icon={<IconUser />}
      rightIcon={<IconSettings />}
    >
      This is a very long text that should overflow and show ellipsis when the
      container width is limited
    </Item>

    <Title level={5}>Text Overflow with Prefix and Suffix</Title>
    <Item
      {...args}
      styles={{ width: '180px' }}
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
        styles={{ width: '150px' }}
        icon={<IconUser />}
      >
        Long text in small size component
      </Item>
      <Item
        {...args}
        size="medium"
        styles={{ width: '150px' }}
        icon={<IconUser />}
      >
        Long text in medium size component
      </Item>
      <Item
        {...args}
        size="large"
        styles={{ width: '150px' }}
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
      styles={{ width: '500px' }}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Short text
    </Item>

    <Title level={5}>Medium Text with Extra Width</Title>
    <Item
      {...args}
      styles={{ width: '400px' }}
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
        styles={{ width: '350px' }}
        icon={<IconUser />}
      >
        Small size
      </Item>
      <Item
        {...args}
        size="medium"
        styles={{ width: '350px' }}
        icon={<IconUser />}
      >
        Medium size
      </Item>
      <Item
        {...args}
        size="large"
        styles={{ width: '350px' }}
        icon={<IconUser />}
      >
        Large size
      </Item>
    </Space>

    <Title level={5}>Icon Only with Extra Width</Title>
    <Item
      {...args}
      styles={{ width: '300px' }}
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
      <Item {...args} isSelected={true}>
        Selected item with checkbox
      </Item>
      <Item {...args} isSelected={true} size="small">
        Small selected item
      </Item>
      <Item {...args} isSelected={true} size="large">
        Large selected item
      </Item>
    </Space>

    <Title level={5}>Non-Selected Items (Checkbox Hidden)</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item {...args} isSelected={false}>
        Non-selected item with hidden checkbox
      </Item>
      <Item {...args} isSelected={false} size="small">
        Small non-selected item
      </Item>
      <Item {...args} isSelected={false} size="large">
        Large non-selected item
      </Item>
    </Space>

    <Title level={5}>Mixed Selection States</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item {...args} isSelected={true} suffix="Selected">
        Item 1
      </Item>
      <Item {...args} isSelected={false} suffix="Not selected">
        Item 2
      </Item>
      <Item {...args} isSelected={true} suffix="Selected">
        Item 3
      </Item>
    </Space>

    <Title level={5}>Comparison: Checkbox vs Regular Icon</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item {...args} isSelected={true}>
        With checkbox (selected)
      </Item>
      <Item {...args} isSelected={false}>
        With checkbox (not selected)
      </Item>
      <Item {...args} icon={<IconUser />}>
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
        hotkeys="cmd+s"
        as="button"
        onClick={() => alert('Save action triggered!')}
      >
        Save Document
      </Item>
      <Item
        {...args}
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
        size="small"
        hotkeys="ctrl+1"
        as="button"
        onClick={() => alert('Small button clicked!')}
      >
        Small with hotkey
      </Item>
      <Item
        {...args}
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
        tooltip={{ title: 'Simple tooltip text', activeWrap: true }}
        as="button"
        icon={<IconUser />}
        onClick={() => alert('Button clicked!')}
      >
        Hover for tooltip
      </Item>
      <Item
        {...args}
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
        size="small"
        tooltip={{ title: 'Small button tooltip', activeWrap: true }}
        as="button"
        onClick={() => alert('Small clicked!')}
      >
        Small
      </Item>
      <Item
        {...args}
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
        isLoading={true}
        // loadingSlot="auto" is default - will use icon slot since icon is present
        icon={<IconUser />}
        rightIcon={<IconSettings />}
      >
        Auto: icon present (loads in icon)
      </Item>
      <Item
        {...args}
        isLoading={true}
        // loadingSlot="auto" is default - will use rightIcon slot since no icon
        rightIcon={<IconSettings />}
      >
        Auto: no icon, rightIcon present (loads in rightIcon)
      </Item>
      <Item
        {...args}
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
        isLoading={true}
        loadingSlot="icon"
        icon={<IconUser />}
        rightIcon={<IconSettings />}
      >
        Explicit icon slot
      </Item>
      <Item
        {...args}
        isLoading={true}
        loadingSlot="rightIcon"
        icon={<IconUser />}
        rightIcon={<IconSettings />}
      >
        Explicit rightIcon slot
      </Item>
      <Item
        {...args}
        isLoading={true}
        loadingSlot="prefix"
        icon={<IconUser />}
        prefix="$"
      >
        Explicit prefix slot
      </Item>
      <Item
        {...args}
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
      <Item {...args} size="small" isLoading={true} icon={<IconUser />}>
        Small size
      </Item>
      <Item {...args} size="medium" isLoading={true} icon={<IconUser />}>
        Medium size
      </Item>
      <Item {...args} size="large" isLoading={true} icon={<IconUser />}>
        Large size
      </Item>
    </Space>

    <Title level={5}>Loading with Different Visual Types</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item {...args} type="item" isLoading={true} icon={<IconUser />}>
        Item type
      </Item>
      <Item {...args} type="primary" isLoading={true} icon={<IconUser />}>
        Primary type
      </Item>
      <Item {...args} type="secondary" isLoading={true} icon={<IconUser />}>
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

export const WithDescription: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Description Placement: Inline (Default)</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        description="Inline description appears next to the label"
        descriptionPlacement="inline"
      >
        User Account
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconSettings />}
        description="Settings"
        descriptionPlacement="inline"
      >
        Application Settings
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconCoin />}
        rightIcon={<DirectionIcon to="bottom" />}
        description="$99.99"
        descriptionPlacement="inline"
      >
        Premium Plan
      </Item>
    </Space>

    <Title level={5}>Description Placement: Block</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        description="Block description appears below the entire item"
        descriptionPlacement="block"
      >
        User Account
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconSettings />}
        description="Configure your application preferences"
        descriptionPlacement="block"
      >
        Application Settings
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconCoin />}
        rightIcon={<DirectionIcon to="bottom" />}
        description="Access all premium features for $99.99/month"
        descriptionPlacement="block"
      >
        Premium Plan
      </Item>
    </Space>

    <Title level={5}>Comparison: Inline vs Block</Title>
    <Space gap="2x" flow="column" placeItems="start">
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        description="Inline: Description next to label"
        descriptionPlacement="inline"
      >
        Inline Placement
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        description="Block: Description below item"
        descriptionPlacement="block"
      >
        Block Placement
      </Item>
    </Space>
  </Space>
);

WithDescription.args = {
  width: '400px',
};

WithDescription.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the `description` prop with different `descriptionPlacement` values: "inline" (default, appears next to the label) and "block" (appears below the entire item). Use inline for short secondary text and block for longer descriptions.',
    },
  },
};

export const DescriptionWithSizes: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Inline Description Across Sizes</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        type="outline"
        size="xsmall"
        icon={<IconUser />}
        description="XSmall"
        descriptionPlacement="inline"
      >
        XSmall Item
      </Item>
      <Item
        {...args}
        type="outline"
        size="small"
        icon={<IconUser />}
        description="Small"
        descriptionPlacement="inline"
      >
        Small Item
      </Item>
      <Item
        {...args}
        type="outline"
        size="medium"
        icon={<IconUser />}
        description="Medium"
        descriptionPlacement="inline"
      >
        Medium Item
      </Item>
      <Item
        {...args}
        type="outline"
        size="large"
        icon={<IconUser />}
        description="Large"
        descriptionPlacement="inline"
      >
        Large Item
      </Item>
      <Item
        {...args}
        type="outline"
        size="xlarge"
        icon={<IconUser />}
        description="XLarge"
        descriptionPlacement="inline"
      >
        XLarge Item
      </Item>
    </Space>

    <Title level={5}>Block Description Across Sizes</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        type="outline"
        size="xsmall"
        icon={<IconUser />}
        description="XSmall size with block description"
        descriptionPlacement="block"
      >
        XSmall Item
      </Item>
      <Item
        {...args}
        type="outline"
        size="small"
        icon={<IconUser />}
        description="Small size with block description"
        descriptionPlacement="block"
      >
        Small Item
      </Item>
      <Item
        {...args}
        type="outline"
        size="medium"
        icon={<IconUser />}
        description="Medium size with block description"
        descriptionPlacement="block"
      >
        Medium Item
      </Item>
      <Item
        {...args}
        type="outline"
        size="large"
        icon={<IconUser />}
        description="Large size with block description"
        descriptionPlacement="block"
      >
        Large Item
      </Item>
      <Item
        {...args}
        type="outline"
        size="xlarge"
        icon={<IconUser />}
        description="XLarge size with block description"
        descriptionPlacement="block"
      >
        XLarge Item
      </Item>
    </Space>
  </Space>
);

DescriptionWithSizes.args = {
  width: '400px',
};

DescriptionWithSizes.parameters = {
  docs: {
    description: {
      story:
        'Shows how descriptions render across all Item sizes with both inline and block placements. Notice how the description scales appropriately with each size while maintaining readability and proper spacing.',
    },
  },
};

export const DescriptionWithTypes: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Inline Description with Different Types</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        type="item"
        icon={<IconUser />}
        description="Item type"
        descriptionPlacement="inline"
      >
        Item Type
      </Item>
      <Item
        {...args}
        type="primary"
        icon={<IconUser />}
        description="Primary type"
        descriptionPlacement="inline"
      >
        Primary Type
      </Item>
      <Item
        {...args}
        type="secondary"
        icon={<IconUser />}
        description="Secondary type"
        descriptionPlacement="inline"
      >
        Secondary Type
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        description="Outline type"
        descriptionPlacement="inline"
      >
        Outline Type
      </Item>
      <Item
        {...args}
        type="neutral"
        icon={<IconUser />}
        description="Neutral type"
        descriptionPlacement="inline"
      >
        Neutral Type
      </Item>
      <Item
        {...args}
        type="clear"
        icon={<IconUser />}
        description="Clear type"
        descriptionPlacement="inline"
      >
        Clear Type
      </Item>
      <Item
        {...args}
        type="link"
        icon={<IconUser />}
        description="Link type"
        descriptionPlacement="inline"
      >
        Link Type
      </Item>
    </Space>

    <Title level={5}>Block Description with Different Types</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        type="item"
        icon={<IconUser />}
        description="Item type with block description"
        descriptionPlacement="block"
      >
        Item Type
      </Item>
      <Item
        {...args}
        type="primary"
        icon={<IconUser />}
        description="Primary type with block description"
        descriptionPlacement="block"
      >
        Primary Type
      </Item>
      <Item
        {...args}
        type="secondary"
        icon={<IconUser />}
        description="Secondary type with block description"
        descriptionPlacement="block"
      >
        Secondary Type
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        description="Outline type with block description"
        descriptionPlacement="block"
      >
        Outline Type
      </Item>
    </Space>
  </Space>
);

DescriptionWithTypes.args = {
  width: '400px',
};

DescriptionWithTypes.parameters = {
  docs: {
    description: {
      story:
        "Demonstrates how descriptions work with all Item type variants. The description inherits the color scheme and adapts to each type's visual style, ensuring consistent readability across different type configurations.",
    },
  },
};

export const DescriptionWithComplexContent: StoryFn<CubeItemProps> = (args) => (
  <Flow gap="2x">
    <Title level={5}>Inline Description with All Elements</Title>
    <Flow gap="1x">
      <Item
        {...args}
        type="outline"
        icon={<IconCoin />}
        rightIcon={<IconSettings />}
        description="With both icons"
        descriptionPlacement="inline"
      >
        Complete Item
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconCoin />}
        prefix="$"
        suffix=".99"
        description="Price information"
        descriptionPlacement="inline"
      >
        Product Name
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        hotkeys="cmd+u"
        description="Keyboard shortcut"
        descriptionPlacement="inline"
      >
        User Settings
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        rightIcon={<DirectionIcon to="bottom" />}
        prefix="+"
        suffix="more"
        description="Full configuration"
        descriptionPlacement="inline"
      >
        All Elements
      </Item>
    </Flow>

    <Title level={5}>Block Description with All Elements</Title>
    <Flow gap="1x">
      <Item
        {...args}
        type="outline"
        icon={<IconCoin />}
        rightIcon={<IconSettings />}
        description="Block description with both icons providing more context"
        descriptionPlacement="block"
      >
        Complete Item
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconCoin />}
        prefix="$"
        suffix=".99"
        description="Premium pricing tier with annual billing discount"
        descriptionPlacement="block"
      >
        Product Name
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        hotkeys="cmd+u"
        description="Access user settings and preferences quickly with keyboard shortcut"
        descriptionPlacement="block"
      >
        User Settings
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        rightIcon={<DirectionIcon to="bottom" />}
        prefix="+"
        suffix="more"
        description="This item demonstrates the full configuration with all available slots and a detailed description"
        descriptionPlacement="block"
      >
        All Elements
      </Item>
    </Flow>

    <Title level={5}>Description with Actions</Title>
    <Flow gap="1x">
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        description="Inline with actions"
        descriptionPlacement="inline"
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        User Record
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        description="Block description below the item with inline actions"
        descriptionPlacement="block"
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        User Record
      </Item>
    </Flow>
  </Flow>
);

DescriptionWithComplexContent.args = {
  width: '500px',
};

DescriptionWithComplexContent.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates descriptions combined with complex Item configurations including icons, prefix/suffix, hotkeys, and actions. Shows how inline descriptions fit within the grid layout versus block descriptions that span below the entire item.',
    },
  },
};

export const DescriptionOverflow: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Long Inline Descriptions (with overflow)</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={{ width: '300px' }}
        type="outline"
        icon={<IconUser />}
        description="This is a very long inline description that will be truncated with ellipsis when it exceeds the available width"
        descriptionPlacement="inline"
      >
        Short Label
      </Item>
      <Item
        {...args}
        styles={{ width: '250px' }}
        type="outline"
        icon={<IconSettings />}
        description="Another example of text overflow with even narrower container width"
        descriptionPlacement="inline"
      >
        Settings
      </Item>
    </Space>

    <Title level={5}>Long Block Descriptions (with wrapping)</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        styles={{ width: '300px' }}
        type="outline"
        icon={<IconUser />}
        description="This is a very long block description that will wrap naturally to multiple lines when it exceeds the available container width, providing a better reading experience for detailed information"
        descriptionPlacement="block"
      >
        Short Label
      </Item>
      <Item
        {...args}
        styles={{ width: '250px' }}
        type="outline"
        icon={<IconSettings />}
        description="Another example with narrower container demonstrating how block descriptions wrap text naturally without truncation, making them ideal for longer explanatory content that needs to be fully visible"
        descriptionPlacement="block"
      >
        Settings
      </Item>
    </Space>

    <Title level={5}>Comparison: Inline vs Block with Long Text</Title>
    <Space gap="2x" flow="column" placeItems="start">
      <div>
        <Item
          {...args}
          styles={{ width: '350px' }}
          type="outline"
          icon={<IconCoin />}
          description="This is a comprehensive description that demonstrates how inline placement handles longer text content by truncating it with an ellipsis to maintain the single-line layout"
          descriptionPlacement="inline"
        >
          Inline Example
        </Item>
      </div>
      <div>
        <Item
          {...args}
          styles={{ width: '350px' }}
          type="outline"
          icon={<IconCoin />}
          description="This is a comprehensive description that demonstrates how block placement handles longer text content by allowing it to wrap naturally across multiple lines for better readability"
          descriptionPlacement="block"
        >
          Block Example
        </Item>
      </div>
    </Space>
  </Space>
);

DescriptionOverflow.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates how descriptions handle overflow: inline descriptions use text-overflow ellipsis to truncate long content while maintaining single-line layout, whereas block descriptions wrap text naturally across multiple lines for full visibility. Choose inline for compact layouts and block for detailed descriptions.',
    },
  },
};

export const WithActions: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Basic Item with Inline Actions</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        type="outline"
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
        type="outline"
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
        type="outline"
        size="xsmall"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        XSmall item
      </Item>
      <Item
        {...args}
        type="outline"
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
        type="outline"
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
        type="outline"
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
      <Item
        {...args}
        type="outline"
        size="xlarge"
        icon={<IconUser />}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        XLarge item
      </Item>
    </Space>

    <Title level={5}>Different Types with Actions</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
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
        type="outline"
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
        type="outline"
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
        type="outline"
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
        type="outline"
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
      styles={{ width: '400px' }}
      type="outline"
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
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Actions Shown on Hover</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        qa="hover-actions-item"
        type="outline"
        icon={<IconUser />}
        showActionsOnHover={true}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Hover to show actions
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconCoin />}
        showActionsOnHover={true}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Another item with hover actions
      </Item>
    </Space>

    <Title level={5}>Comparison: Always Visible vs On Hover</Title>
    <Space gap="2x" flow="column" placeItems="start">
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        showActionsOnHover={false}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Actions always visible
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        showActionsOnHover={true}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Actions shown on hover
      </Item>
    </Space>

    <Title level={5}>Different Sizes with Hover Actions</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        type="outline"
        size="small"
        icon={<IconUser />}
        showActionsOnHover={true}
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
        type="outline"
        size="medium"
        icon={<IconUser />}
        showActionsOnHover={true}
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
        type="outline"
        size="large"
        icon={<IconUser />}
        showActionsOnHover={true}
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

    <Title level={5}>With Description and Hover Actions</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        description="Inline description"
        descriptionPlacement="inline"
        showActionsOnHover={true}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Item with inline description
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        description="Block description below the item"
        descriptionPlacement="block"
        showActionsOnHover={true}
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Item with block description
      </Item>
    </Space>
  </Space>
);

WithActionsOnHover.args = {
  width: '450px',
};

WithActionsOnHover.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the `showActionsOnHover` prop which hides actions by default and reveals them smoothly on hover, focus, or focus-within states using opacity transitions. This provides a cleaner interface while keeping actions easily accessible. The actions remain in the layout to prevent content shifting.',
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

export const DifferentShapes: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Card Shape</Title>
    <Item {...args} type="outline" shape="card" icon={<IconUser />}>
      Card shape with larger border radius
    </Item>

    <Title level={5}>Button Shape (Default)</Title>
    <Item {...args} type="outline" shape="button" icon={<IconUser />}>
      Button shape with default border radius
    </Item>

    <Title level={5}>Sharp Shape</Title>
    <Item {...args} type="outline" shape="sharp" icon={<IconUser />}>
      Sharp shape with no border radius
    </Item>

    <Title level={5}>All Shapes Comparison</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item {...args} type="outline" shape="card" icon={<IconCoin />}>
        Card shape
      </Item>
      <Item {...args} type="outline" shape="button" icon={<IconCoin />}>
        Button shape
      </Item>
      <Item {...args} type="outline" shape="sharp" icon={<IconCoin />}>
        Sharp shape
      </Item>
    </Space>
  </Space>
);

DifferentShapes.args = {
  width: '300px',
};

DifferentShapes.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the three shape variants: `card` (larger border radius), `button` (default border radius), and `sharp` (no border radius). Use card for card-like interfaces, button for interactive elements, and sharp for minimal or technical interfaces.',
    },
  },
};

export const WithHighlight: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Basic Highlight</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item {...args} type="outline" icon={<IconUser />} highlight="user">
        User account settings
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconSettings />}
        highlight="settings"
      >
        Application settings panel
      </Item>
    </Space>

    <Title level={5}>Case Sensitivity</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item {...args} type="outline" icon={<IconUser />} highlight="USER">
        Case-insensitive: USER and user match
      </Item>
      <Item
        {...args}
        highlightCaseSensitive
        type="outline"
        icon={<IconUser />}
        highlight="USER"
      >
        Case-sensitive: USER matches, user does not
      </Item>
    </Space>

    <Title level={5}>Multiple Matches</Title>
    <Item {...args} type="outline" icon={<IconCoin />} highlight="the">
      The quick brown fox jumps over the lazy dog
    </Item>

    <Title level={5}>With Custom Highlight Styles</Title>
    <Item
      {...args}
      type="outline"
      icon={<IconUser />}
      highlight="custom"
      highlightStyles={{ fill: '#success', color: '#success-text' }}
    >
      Item with custom highlight style
    </Item>

    <Title level={5}>Combined with Other Features</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <Item
        {...args}
        type="outline"
        icon={<IconCoin />}
        rightIcon={<DirectionIcon to="bottom" />}
        description="Product details"
        descriptionPlacement="inline"
        highlight="product"
      >
        Product name with highlight
      </Item>
      <Item
        {...args}
        type="outline"
        icon={<IconUser />}
        highlight="actions"
        actions={
          <>
            <ItemAction icon={<IconEdit />} aria-label="Edit" />
            <ItemAction icon={<IconTrash />} aria-label="Delete" />
          </>
        }
      >
        Item with actions and highlight
      </Item>
    </Space>
  </Space>
);

WithHighlight.args = {
  width: '400px',
};

WithHighlight.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the `highlight`, `highlightCaseSensitive`, and `highlightStyles` props for highlighting text within the Item label. Only works when children is a plain string. By default, matching is case-insensitive.',
    },
  },
};

export const CustomSize: StoryFn<CubeItemProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Custom Size: String Value (8x)</Title>
    <Item {...args} size="8x" icon={<IconUser />}>
      Custom size with 8x
    </Item>

    <Title level={5}>Custom Size: Number Value (64px)</Title>
    <Item {...args} size={64} icon={<IconUser />}>
      Custom size with 64px
    </Item>
  </Space>
);

CustomSize.args = {
  width: '300px',
};

CustomSize.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates custom size values using the `size` prop. Supports both string values (like `8x`) and number values (converted to pixels, like `64`). Custom sizes override the default size token via the `tokens` prop.',
    },
  },
};

export const TypesAndThemes: StoryFn<CubeItemProps> = (args) => {
  // Valid type+theme combinations:
  // - title: only 'default'
  // - alert: 'default', 'success', 'danger', 'note'
  // - all other types: 'default', 'success', 'danger', 'special'
  const standardTypes = [
    'item',
    'primary',
    'secondary',
    'outline',
    'neutral',
    'clear',
  ] as const;
  const standardThemes = ['default', 'danger', 'success', 'special'] as const;
  const alertThemes = ['default', 'danger', 'success', 'note'] as const;

  return (
    <Space gap="4x" flow="column" placeItems="start">
      <Title level={4}>All Type + Theme Combinations</Title>

      <Space gap="2x" flow="column" placeItems="start">
        <Title level={5}>Type: header (default theme only)</Title>
        <Space gap="1x" flow="row wrap" placeItems="start">
          <Item {...args} type="header" theme="default" icon={<IconUser />}>
            default
          </Item>
        </Space>
      </Space>

      {standardTypes.map((type) => (
        <Space key={type} gap="2x" flow="column" placeItems="start">
          <Title level={5}>Type: {type}</Title>
          <Space gap="1x" flow="row wrap" placeItems="start">
            {standardThemes.map((theme) => {
              const item = (
                <Item
                  {...args}
                  type={type}
                  theme={theme}
                  {...(type !== 'link' && { icon: <IconUser /> })}
                >
                  {theme}
                </Item>
              );

              if (theme === 'special') {
                return (
                  <Block
                    key={`${type}-${theme}`}
                    padding="1x"
                    fill="#dark"
                    radius="1cr"
                  >
                    {item}
                  </Block>
                );
              }

              return <Fragment key={`${type}-${theme}`}>{item}</Fragment>;
            })}
          </Space>
        </Space>
      ))}

      <Space gap="2x" flow="column" placeItems="start">
        <Title level={5}>Type: alert</Title>
        <Space gap="1x" flow="row wrap" placeItems="start">
          {alertThemes.map((theme) => (
            <Item
              key={`alert-${theme}`}
              {...args}
              type="alert"
              theme={theme}
              description="Alert description"
              icon={<IconUser />}
            >
              {theme}
            </Item>
          ))}
        </Space>
      </Space>
    </Space>
  );
};

TypesAndThemes.parameters = {
  docs: {
    description: {
      story:
        'Showcases all valid type and theme combinations. Valid combinations: `title` type only supports `default` theme; `alert` type supports `default`, `success`, `danger`, and `note` themes; all other types (`item`, `primary`, `secondary`, `outline`, `neutral`, `clear`, `link`) support `default`, `success`, `danger`, and `special` themes. The `link` type does not support icons or loading state (`isLoading`). Using an invalid type+theme combination, icons with `link` type, or `isLoading` with `link` type will trigger a console warning.',
    },
  },
};
