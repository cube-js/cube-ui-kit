import { StoryFn } from '@storybook/react';
import { IconCoin, IconSettings, IconUser } from '@tabler/icons-react';

import { DirectionIcon } from '../../../icons';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';
import { Title } from '../Title';

import { CubeItemBaseProps, ItemBase } from './ItemBase';

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
