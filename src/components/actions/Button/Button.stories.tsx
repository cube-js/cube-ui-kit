import { StoryFn } from '@storybook/react-vite';
import { IconCaretDown, IconCoin } from '@tabler/icons-react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { Button, CubeButtonProps } from './Button';

export default {
  title: 'Actions/Button',
  component: Button,
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    /* Visual presentation */
    type: {
      options: ['primary', 'secondary', 'outline', 'neutral', 'clear', 'link'],
      control: { type: 'radio' },
      description: 'Visual style variant of the button',
      table: {
        defaultValue: { summary: 'outline' },
      },
    },
    theme: {
      options: ['default', 'danger', 'success', 'special'],
      control: { type: 'radio' },
      description: 'Semantic colour palette theme',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge'],
      control: { type: 'radio' },
      description: 'Button size',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },

    /* Content */
    icon: {
      control: { type: null },
      description:
        'Icon rendered before the content. Can be: ReactNode, `true` (empty slot), or function `({ loading, selected, ...mods }) => ReactNode | true`',
    },
    rightIcon: {
      control: { type: null },
      description:
        'Icon rendered after the content. Can be: ReactNode, `true` (empty slot), or function `({ loading, selected, ...mods }) => ReactNode | true`',
    },
    children: {
      control: { type: 'text' },
      description: 'Button label or custom content',
    },

    /* State */
    isLoading: {
      control: { type: 'boolean' },
      description:
        'Show loading spinner and disable interactions (default: false)',
      table: {
        defaultValue: { summary: false },
      },
    },
    isSelected: {
      control: { type: 'boolean' },
      description:
        'Marks the button as pressed / selected (toggle) (default: false)',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Navigation */
    to: {
      control: { type: 'text' },
      description:
        'Destination URL or route; prefix with `!` to open in new tab, `@` to bypass router',
    },

    /* Events */
    onPress: {
      action: 'press',
      description:
        'Callback fired when the button is activated by mouse, touch, or keyboard',
      control: { type: null },
    },
  },
};

const Template: StoryFn<CubeButtonProps> = ({
  icon,
  rightIcon,
  children,
  ...props
}) => (
  <Space
    radius="1x"
    padding={props.theme === 'special' ? '2x' : undefined}
    fill={props.theme === 'special' ? '#dark' : undefined}
  >
    <Button
      icon={icon}
      rightIcon={rightIcon}
      {...props}
      onPress={(e) => console.log('Press', e)}
    >
      {children}
    </Button>
  </Space>
);

const TemplateSizes: StoryFn<CubeButtonProps> = ({
  children,
  icon,
  rightIcon,
  ...props
}) => (
  <Space>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="xsmall">
      XSmall
    </Button>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="small">
      Small
    </Button>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="medium">
      Medium
    </Button>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="large">
      Large
    </Button>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="xlarge">
      XLarge
    </Button>
  </Space>
);

const TemplateSizesOnlyIcon: StoryFn<CubeButtonProps> = ({
  children,
  icon,
  rightIcon,
  ...props
}) => (
  <Space>
    <Button icon={icon} rightIcon={rightIcon} {...props} size="xsmall" />
    <Button icon={icon} rightIcon={rightIcon} {...props} size="small" />
    <Button icon={icon} rightIcon={rightIcon} {...props} size="medium" />
    <Button icon={icon} rightIcon={rightIcon} {...props} size="large" />
    <Button icon={icon} rightIcon={rightIcon} {...props} size="xlarge" />
  </Space>
);

const TemplateStates: StoryFn<CubeButtonProps> = ({
  children,
  mods,
  ...props
}) => (
  <Space>
    <Button
      {...props}
      mods={{
        hovered: false,
        pressed: false,
        focused: false,
        disabled: false,
      }}
    >
      {children || 'Default'}
    </Button>
    <Button
      {...props}
      mods={{
        hovered: true,
        pressed: false,
        focused: false,
        disabled: false,
      }}
    >
      {children || 'Hovered'}
    </Button>
    <Button
      {...props}
      mods={{
        hovered: false,
        pressed: true,
        focused: false,
        disabled: false,
      }}
    >
      {children || 'Pressed'}
    </Button>
    <Button
      {...props}
      mods={{
        hovered: true,
        pressed: true,
        focused: false,
        disabled: false,
      }}
    >
      {children || 'Pressed & Hovered'}
    </Button>
    <Button
      {...props}
      mods={{
        hovered: false,
        pressed: false,
        focused: true,
        disabled: false,
      }}
    >
      {children || 'Focused'}
    </Button>
    <Button
      {...props}
      isDisabled
      mods={{
        hovered: false,
        pressed: false,
        focused: false,
      }}
    >
      {children || 'Disabled'}
    </Button>
    {['outline', 'neutral', 'clear'].includes(props.type) || !props.type ? (
      <Button
        {...props}
        mods={{
          pressed: false,
          focused: false,
          disabled: false,
          selected: true,
        }}
      >
        {children || 'Selected'}
      </Button>
    ) : null}
  </Space>
);

const DarkTemplateStates: StoryFn<CubeButtonProps> = ({
  children,
  mods,
  ...props
}) => (
  <Space padding="2x" radius="1x" fill="#dark">
    <Button
      {...props}
      mods={{
        hovered: false,
        pressed: false,
        focused: false,
        disabled: false,
      }}
    >
      {children || 'Secondary'}
    </Button>
    <Button
      {...props}
      mods={{
        hovered: true,
        pressed: false,
        focused: false,
        disabled: false,
      }}
    >
      {children || 'Hovered'}
    </Button>
    <Button
      {...props}
      mods={{
        hovered: false,
        pressed: true,
        focused: false,
        disabled: false,
      }}
    >
      {children || 'Pressed'}
    </Button>
    <Button
      {...props}
      mods={{
        hovered: true,
        pressed: true,
        focused: false,
        disabled: false,
      }}
    >
      {children || 'Pressed & Hovered'}
    </Button>
    <Button
      {...props}
      mods={{
        hovered: false,
        pressed: false,
        focused: true,
        disabled: false,
      }}
    >
      {children || 'Focused'}
    </Button>
    <Button
      {...props}
      isDisabled
      mods={{
        hovered: false,
        pressed: false,
        focused: false,
      }}
    >
      {children || 'Disabled'}
    </Button>
    {['outline', 'neutral'].includes(props.type) || !props.type ? (
      <Button
        {...props}
        mods={{
          pressed: false,
          focused: false,
          disabled: false,
          selected: true,
        }}
      >
        {children || 'Selected'}
      </Button>
    ) : null}
  </Space>
);

export const Default = Template.bind({});
Default.args = {
  children: 'Button',
};

export const SecondaryStates = TemplateStates.bind({});
SecondaryStates.args = {
  type: 'secondary',
};

export const PrimaryStates = TemplateStates.bind({});
PrimaryStates.args = {
  type: 'primary',
};

export const OutlineStates = TemplateStates.bind({});
OutlineStates.args = {
  type: 'outline',
};

export const ClearStates = TemplateStates.bind({});
ClearStates.args = {
  type: 'clear',
};

export const NeutralStates = TemplateStates.bind({});
NeutralStates.args = {
  type: 'neutral',
};

export const LinkStates = TemplateStates.bind({});
LinkStates.args = {
  type: 'link',
};

export const DangerSecondaryStates = TemplateStates.bind({});
DangerSecondaryStates.args = {
  type: 'secondary',
  theme: 'danger',
};

export const DangerPrimaryStates = TemplateStates.bind({});
DangerPrimaryStates.args = {
  type: 'primary',
  theme: 'danger',
};

export const DangerOutlineStates = TemplateStates.bind({});
DangerOutlineStates.args = {
  type: 'outline',
  theme: 'danger',
};

export const DangerClearStates = TemplateStates.bind({});
DangerClearStates.args = {
  type: 'clear',
  theme: 'danger',
};

export const DangerNeutralStates = TemplateStates.bind({});
DangerNeutralStates.args = {
  type: 'neutral',
  theme: 'danger',
};

export const DangerLinkStates = TemplateStates.bind({});
DangerLinkStates.args = {
  type: 'link',
  theme: 'danger',
};

export const SuccessSecondaryStates = TemplateStates.bind({});
SuccessSecondaryStates.args = {
  type: 'secondary',
  theme: 'success',
};

export const SuccessPrimaryStates = TemplateStates.bind({});
SuccessPrimaryStates.args = {
  type: 'primary',
  theme: 'success',
};

export const SuccessOutlineStates = TemplateStates.bind({});
SuccessOutlineStates.args = {
  type: 'outline',
  theme: 'success',
};

export const SuccessClearStates = TemplateStates.bind({});
SuccessClearStates.args = {
  type: 'clear',
  theme: 'success',
};

export const SuccessNeutralStates = TemplateStates.bind({});
SuccessNeutralStates.args = {
  type: 'neutral',
  theme: 'success',
};

export const SuccessLinkStates = TemplateStates.bind({});
SuccessLinkStates.args = {
  type: 'link',
  theme: 'success',
};

export const SpecialSecondaryStates = DarkTemplateStates.bind({});
SpecialSecondaryStates.args = {
  type: 'secondary',
  theme: 'special',
};

export const SpecialPrimaryStates = DarkTemplateStates.bind({});
SpecialPrimaryStates.args = {
  type: 'primary',
  theme: 'special',
};

export const SpecialOutlineStates = DarkTemplateStates.bind({});
SpecialOutlineStates.args = {
  type: 'outline',
  theme: 'special',
};

export const SpecialClearStates = DarkTemplateStates.bind({});
SpecialClearStates.args = {
  type: 'clear',
  theme: 'special',
};

export const SpecialNeutralStates = DarkTemplateStates.bind({});
SpecialNeutralStates.args = {
  type: 'neutral',
  theme: 'special',
};

export const SpecialLinkStates = DarkTemplateStates.bind({});
SpecialLinkStates.args = {
  type: 'link',
  theme: 'special',
};

export const Small = Template.bind({});
Small.args = {
  children: 'Button',
  size: 'small',
};

export const Large = Template.bind({});
Large.args = {
  children: 'Button',
  size: 'large',
};

export const LeftIconAndText = TemplateSizes.bind({});
LeftIconAndText.args = {
  children: 'Button',
  icon: <IconCoin />,
};

export const RightIconAndText = TemplateSizes.bind({});
RightIconAndText.args = {
  children: 'Button',
  rightIcon: <IconCaretDown />,
};

export const TwoIconsAndText = TemplateSizes.bind({});
TwoIconsAndText.args = {
  children: 'Button',
  icon: <IconCoin />,
  rightIcon: <IconCaretDown />,
};

export const OnlyIcon = TemplateSizesOnlyIcon.bind({});
OnlyIcon.args = {
  icon: <IconCoin />,
};

export const Loading = TemplateSizes.bind({});
Loading.args = {
  icon: <IconCoin />,
  isLoading: true,
  children: 'Button',
};
