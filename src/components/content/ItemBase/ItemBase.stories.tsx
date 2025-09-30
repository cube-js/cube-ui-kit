import { IconCoin, IconSettings, IconUser } from '@tabler/icons-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { DirectionIcon } from '../../../icons';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';
import { Title } from '../Title';

import { CubeItemBaseProps, ItemBase } from './ItemBase';

// Using any type due to Storybook type compatibility issues
type StoryFn<T = {}> = any;

export default {
  title: 'Content/ItemBase',
  component: ItemBase,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    children: {
      control: { type: 'text' },
      description: 'The content inside the ItemBase',
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
      description: 'ItemBase size',
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

const DefaultTemplate: StoryFn<CubeItemBaseProps> = (props) => (
  <ItemBase {...props} />
);

const Template: StoryFn<CubeItemBaseProps> = (props) => (
  <ItemBase styles={DEFAULT_STYLES} {...props} />
);

export const Default = DefaultTemplate.bind({});
Default.args = {
  children: 'Default ItemBase',
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  children: 'ItemBase with icon',
  icon: <IconUser />,
};

export const WithRightIcon = Template.bind({});
WithRightIcon.args = {
  children: 'ItemBase with right icon',
  rightIcon: <IconSettings />,
};

export const WithBothIcons = Template.bind({});
WithBothIcons.args = {
  children: 'ItemBase with both icons',
  icon: <IconUser />,
  rightIcon: <IconSettings />,
};

export const WithPrefix = Template.bind({});
WithPrefix.args = {
  children: 'ItemBase with prefix',
  prefix: '$',
};

export const WithSuffix = Template.bind({});
WithSuffix.args = {
  children: 'ItemBase with suffix',
  suffix: '.00',
};

export const FullConfiguration = Template.bind({});
FullConfiguration.args = {
  children: 'Complete ItemBase',
  icon: <IconCoin />,
  rightIcon: <IconSettings />,
  prefix: '$',
  suffix: '.00',
};

export const DifferentSizes: StoryFn<CubeItemBaseProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>XSmall ItemBase</Title>
    <ItemBase {...args} size="xsmall" styles={DEFAULT_STYLES}>
      XSmall size
    </ItemBase>

    <Title level={5}>Small ItemBase</Title>
    <ItemBase {...args} size="small" styles={DEFAULT_STYLES}>
      Small size
    </ItemBase>

    <Title level={5}>Medium ItemBase</Title>
    <ItemBase {...args} size="medium" styles={DEFAULT_STYLES}>
      Medium size
    </ItemBase>

    <Title level={5}>Large ItemBase</Title>
    <ItemBase {...args} size="large" styles={DEFAULT_STYLES}>
      Large size
    </ItemBase>

    <Title level={5}>XLarge ItemBase</Title>
    <ItemBase {...args} size="xlarge" styles={DEFAULT_STYLES}>
      XLarge size
    </ItemBase>

    <Title level={5}>Inline ItemBase</Title>
    <ItemBase {...args} size="inline" styles={DEFAULT_STYLES}>
      Inline size
    </ItemBase>
  </Space>
);

DifferentSizes.args = {
  width: '300px',
};

DifferentSizes.parameters = {
  docs: {
    description: {
      story:
        'ItemBase supports six sizes: `xsmall`, `small`, `medium` (default), `large`, `xlarge`, and `inline` to accommodate different interface requirements.',
    },
  },
};

export const SizesWithIcons: StoryFn<CubeItemBaseProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>XSmall with Icons</Title>
    <ItemBase
      {...args}
      size="xsmall"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      XSmall with icons
    </ItemBase>

    <Title level={5}>Small with Icons</Title>
    <ItemBase
      {...args}
      size="small"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Small with icons
    </ItemBase>

    <Title level={5}>Medium with Icons</Title>
    <ItemBase
      {...args}
      size="medium"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Medium with icons
    </ItemBase>

    <Title level={5}>Large with Icons</Title>
    <ItemBase
      {...args}
      size="large"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Large with icons
    </ItemBase>

    <Title level={5}>XLarge with Icons</Title>
    <ItemBase
      {...args}
      size="xlarge"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      XLarge with icons
    </ItemBase>

    <Title level={5}>Inline with Icons</Title>
    <ItemBase
      {...args}
      size="inline"
      styles={DEFAULT_STYLES}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Inline with icons
    </ItemBase>
  </Space>
);

SizesWithIcons.args = {
  width: '350px',
};

SizesWithIcons.parameters = {
  docs: {
    description: {
      story:
        'Comparison of all ItemBase sizes when used with icons to show how the component adapts to different content configurations.',
    },
  },
};

export const TextOverflow: StoryFn<CubeItemBaseProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Text Overflow with Limited Width</Title>
    <ItemBase
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '200px' }}
      icon={<IconUser />}
      rightIcon={<IconSettings />}
    >
      This is a very long text that should overflow and show ellipsis when the
      container width is limited
    </ItemBase>

    <Title level={5}>Text Overflow with Prefix and Suffix</Title>
    <ItemBase
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '180px' }}
      icon={<IconCoin />}
      prefix="$"
      suffix=".00"
    >
      Very long product name that exceeds container width
    </ItemBase>

    <Title level={5}>Different Sizes with Text Overflow</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        size="small"
        styles={{ ...DEFAULT_STYLES, width: '150px' }}
        icon={<IconUser />}
      >
        Long text in small size component
      </ItemBase>
      <ItemBase
        {...args}
        size="medium"
        styles={{ ...DEFAULT_STYLES, width: '150px' }}
        icon={<IconUser />}
      >
        Long text in medium size component
      </ItemBase>
      <ItemBase
        {...args}
        size="large"
        styles={{ ...DEFAULT_STYLES, width: '150px' }}
        icon={<IconUser />}
      >
        Long text in large size component
      </ItemBase>
    </Space>
  </Space>
);

TextOverflow.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates how ItemBase handles text overflow with ellipsis when content exceeds the available width. The component uses `text-overflow: ellipsis` and `white-space: nowrap` to gracefully handle long content.',
    },
  },
};

export const ExtraWidth: StoryFn<CubeItemBaseProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Short Text with Extra Width</Title>
    <ItemBase
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '500px' }}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Short text
    </ItemBase>

    <Title level={5}>Medium Text with Extra Width</Title>
    <ItemBase
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '400px' }}
      icon={<IconCoin />}
      prefix="$"
      suffix=".00"
    >
      Product name
    </ItemBase>

    <Title level={5}>Different Sizes with Extra Width</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        size="small"
        styles={{ ...DEFAULT_STYLES, width: '350px' }}
        icon={<IconUser />}
      >
        Small size
      </ItemBase>
      <ItemBase
        {...args}
        size="medium"
        styles={{ ...DEFAULT_STYLES, width: '350px' }}
        icon={<IconUser />}
      >
        Medium size
      </ItemBase>
      <ItemBase
        {...args}
        size="large"
        styles={{ ...DEFAULT_STYLES, width: '350px' }}
        icon={<IconUser />}
      >
        Large size
      </ItemBase>
    </Space>

    <Title level={5}>Icon Only with Extra Width</Title>
    <ItemBase
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '300px' }}
      icon={<IconUser />}
      rightIcon={<DirectionIcon to="bottom" />}
    >
      Icon
    </ItemBase>
  </Space>
);

ExtraWidth.parameters = {
  docs: {
    description: {
      story:
        'Shows how ItemBase behaves when given more width than needed for its content. The component maintains its grid layout with proper spacing, and content alignment is controlled by the `placeItems` property.',
    },
  },
};

export const WithCheckbox: StoryFn<CubeItemBaseProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Selected Items (Checkbox Visible)</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase {...args} styles={DEFAULT_STYLES} isSelected={true}>
        Selected item with checkbox
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={true}
        size="small"
      >
        Small selected item
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={true}
        size="large"
      >
        Large selected item
      </ItemBase>
    </Space>

    <Title level={5}>Non-Selected Items (Checkbox Hidden)</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase {...args} styles={DEFAULT_STYLES} isSelected={false}>
        Non-selected item with hidden checkbox
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={false}
        size="small"
      >
        Small non-selected item
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={false}
        size="large"
      >
        Large non-selected item
      </ItemBase>
    </Space>

    <Title level={5}>Mixed Selection States</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={true}
        suffix="Selected"
      >
        Item 1
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={false}
        suffix="Not selected"
      >
        Item 2
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isSelected={true}
        suffix="Selected"
      >
        Item 3
      </ItemBase>
    </Space>

    <Title level={5}>Comparison: Checkbox vs Regular Icon</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase {...args} styles={DEFAULT_STYLES} isSelected={true}>
        With checkbox (selected)
      </ItemBase>
      <ItemBase {...args} styles={DEFAULT_STYLES} isSelected={false}>
        With checkbox (not selected)
      </ItemBase>
      <ItemBase {...args} styles={DEFAULT_STYLES} icon={<IconUser />}>
        With regular icon
      </ItemBase>
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

export const WithHotkeys: StoryFn<CubeItemBaseProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>ItemBase with Hotkeys</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        hotkeys="cmd+s"
        as="button"
        onClick={() => alert('Save action triggered!')}
      >
        Save Document
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        hotkeys="cmd+shift+n"
        type="primary"
        as="button"
        icon={<IconUser />}
        onClick={() => alert('New action triggered!')}
      >
        New Item
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        hotkeys="esc"
        type="outline"
        as="button"
        onClick={() => alert('Cancel action triggered!')}
      >
        Cancel
      </ItemBase>
    </Space>

    <Title level={5}>Different Sizes with Hotkeys</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        size="small"
        hotkeys="ctrl+1"
        as="button"
        onClick={() => alert('Small button clicked!')}
      >
        Small with hotkey
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        size="large"
        hotkeys="ctrl+2"
        as="button"
        onClick={() => alert('Large button clicked!')}
      >
        Large with hotkey
      </ItemBase>
    </Space>

    <Title level={5}>Disabled ItemBase with Hotkeys</Title>
    <ItemBase
      {...args}
      styles={DEFAULT_STYLES}
      hotkeys="cmd+d"
      isDisabled={true}
      as="button"
      onClick={() => alert('This should not trigger!')}
    >
      Disabled (hotkey won't work)
    </ItemBase>
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

export const WithTooltip: StoryFn<CubeItemBaseProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Simple String Tooltips</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        tooltip={{ title: 'Simple tooltip text', activeWrap: true }}
        as="button"
        icon={<IconUser />}
        onClick={() => alert('Button clicked!')}
      >
        Hover for tooltip
      </ItemBase>
      <ItemBase
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
      </ItemBase>
    </Space>

    <Title level={5}>Advanced Tooltip Configuration</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
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
      </ItemBase>
      <ItemBase
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
      </ItemBase>
    </Space>

    <Title level={5}>Tooltip with Hotkeys</Title>
    <ItemBase
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
    </ItemBase>

    <Title level={5}>Different Sizes with Tooltips</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        size="small"
        tooltip={{ title: 'Small button tooltip', activeWrap: true }}
        as="button"
        onClick={() => alert('Small clicked!')}
      >
        Small
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        size="large"
        tooltip={{ title: 'Large button tooltip', activeWrap: true }}
        as="button"
        onClick={() => alert('Large clicked!')}
      >
        Large
      </ItemBase>
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

export const CombinedFeatures: StoryFn<CubeItemBaseProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Hotkeys + Tooltip + Icons</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
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
      </ItemBase>
      <ItemBase
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
      </ItemBase>
    </Space>

    <Title level={5}>With Checkbox Selection</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
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
      </ItemBase>
      <ItemBase
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
      </ItemBase>
    </Space>

    <Title level={5}>Complete Configuration</Title>
    <ItemBase
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
    </ItemBase>
  </Space>
);

CombinedFeatures.args = {
  width: '350px',
};

CombinedFeatures.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the combination of hotkeys, tooltips, icons, checkboxes, and other ItemBase features working together. This shows the full potential of the enhanced ItemBase component.',
    },
  },
};

export const WithLoading: StoryFn<CubeItemBaseProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Auto Loading Slot Selection</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        // loadingSlot="auto" is default - will use icon slot since icon is present
        icon={<IconUser />}
        rightIcon={<IconSettings />}
      >
        Auto: icon present (loads in icon)
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        // loadingSlot="auto" is default - will use rightIcon slot since no icon
        rightIcon={<IconSettings />}
      >
        Auto: no icon, rightIcon present (loads in rightIcon)
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        // loadingSlot="auto" is default - will fallback to icon slot
        prefix="$"
        suffix=".00"
      >
        Auto: no icons present (fallback to icon)
      </ItemBase>
    </Space>

    <Title level={5}>Specific Loading Slots</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        loadingSlot="icon"
        icon={<IconUser />}
        rightIcon={<IconSettings />}
      >
        Explicit icon slot
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        loadingSlot="rightIcon"
        icon={<IconUser />}
        rightIcon={<IconSettings />}
      >
        Explicit rightIcon slot
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        loadingSlot="prefix"
        icon={<IconUser />}
        prefix="$"
      >
        Explicit prefix slot
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        isLoading={true}
        loadingSlot="suffix"
        icon={<IconUser />}
        suffix=".00"
      >
        Explicit suffix slot
      </ItemBase>
    </Space>

    <Title level={5}>Different Sizes with Auto Loading</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        size="small"
        isLoading={true}
        icon={<IconUser />}
      >
        Small size
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        size="medium"
        isLoading={true}
        icon={<IconUser />}
      >
        Medium size
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        size="large"
        isLoading={true}
        icon={<IconUser />}
      >
        Large size
      </ItemBase>
    </Space>

    <Title level={5}>Loading with Different Visual Types</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        type="item"
        isLoading={true}
        icon={<IconUser />}
      >
        Item type
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        type="primary"
        isLoading={true}
        icon={<IconUser />}
      >
        Primary type
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        type="secondary"
        isLoading={true}
        icon={<IconUser />}
      >
        Secondary type
      </ItemBase>
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

export const WithDescriptionBlock: StoryFn<CubeItemBaseProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Description Position Comparison</Title>
    <Space gap="2x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        icon={<IconUser />}
        description="This description appears inside the content area"
        descriptionPlacement="inline"
      >
        Item with description inline (default)
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        icon={<IconUser />}
        description="This description appears below the entire item"
        descriptionPlacement="block"
      >
        Item with description block
      </ItemBase>
    </Space>

    <Title level={5}>Different Sizes with Description Block</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        size="small"
        icon={<IconSettings />}
        description="Small size description block"
        descriptionPlacement="block"
      >
        Small item
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        size="medium"
        icon={<IconSettings />}
        description="Medium size description block"
        descriptionPlacement="block"
      >
        Medium item
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        size="large"
        icon={<IconSettings />}
        description="Large size description block"
        descriptionPlacement="block"
      >
        Large item
      </ItemBase>
    </Space>

    <Title level={5}>With Multiple Elements and Description Block</Title>
    <Space gap="1x" flow="column" placeItems="start">
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        icon={<IconCoin />}
        rightIcon={<IconSettings />}
        prefix="$"
        suffix=".99"
        description="Complete configuration with description positioned below the item"
        descriptionPlacement="block"
      >
        Product Name
      </ItemBase>
      <ItemBase
        {...args}
        styles={DEFAULT_STYLES}
        icon={<IconUser />}
        hotkeys="cmd+u"
        description="User management with hotkey and description block"
        descriptionPlacement="block"
      >
        Manage Users
      </ItemBase>
    </Space>

    <Title level={5}>Long Description Block</Title>
    <ItemBase
      {...args}
      styles={{ ...DEFAULT_STYLES, width: '350px' }}
      icon={<IconCoin />}
      description="This is a very long description that demonstrates how the description text flows when positioned below the item. It can contain multiple lines and will wrap naturally."
      descriptionPlacement="block"
    >
      Item with long description
    </ItemBase>
  </Space>
);

WithDescriptionBlock.args = {
  width: '400px',
};

WithDescriptionBlock.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates the `descriptionPlacement="block"` functionality where descriptions are positioned below the entire ItemBase component instead of inside the content area. This is useful for longer descriptions or when you want to maintain a clean main content area.',
    },
  },
};

const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const WithAutoTooltip: StoryFn<CubeItemBaseProps> = () => (
  <ItemBase
    qa="auto-tooltip-item"
    icon={<IconUser />}
    style={{ width: '200px' }}
    tooltip={{ delay: 0 }}
  >
    This is a very long label that will overflow and trigger the auto tooltip
  </ItemBase>
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
