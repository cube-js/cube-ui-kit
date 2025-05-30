import { StoryFn } from '@storybook/react';
import { IconCaretDown, IconCoin } from '@tabler/icons-react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { Button, CubeButtonProps } from './Button';

export default {
  title: 'Actions/Button',
  component: Button,
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    size: {
      defaultValue: undefined,
      control: { type: 'radio', options: [undefined, 'small', 'large'] },
    },
    // @TODO: Migrate to new API
    // type: {
    //   defaultValue: undefined,
    //   control: {
    //     type: 'radio',
    //     options: [
    //       undefined,
    //       'secondary',
    //       'primary',
    //       'outline',
    //       'clear',
    //       'neutral',
    //       'link',
    //     ],
    //   },
    // },
    theme: {
      defaultValue: undefined,
      control: { type: 'radio', options: [undefined, 'danger', 'special'] },
    },
  },
};

const Template: StoryFn<CubeButtonProps> = ({
  icon,
  rightIcon,
  label,
  ...props
}) => (
  <Space
    radius="1x"
    padding={props.theme === 'special' ? '2x' : undefined}
    fill={props.theme === 'special' ? '#dark' : undefined}
  >
    <Button
      icon={icon ? <IconCoin /> : undefined}
      rightIcon={rightIcon ? <IconCaretDown /> : undefined}
      {...props}
      onPress={(e) => console.log('Press', e)}
    >
      {label}
    </Button>
  </Space>
);

const TemplateSizes: StoryFn<CubeButtonProps> = ({
  label,
  icon,
  rightIcon,
  size,
  ...props
}) => (
  <Space>
    <Button
      icon={icon ? <IconCoin /> : undefined}
      rightIcon={rightIcon ? <IconCaretDown /> : undefined}
      {...props}
      size="small"
    >
      {label}
    </Button>
    <Button
      icon={icon ? <IconCoin /> : undefined}
      rightIcon={rightIcon ? <IconCaretDown /> : undefined}
      {...props}
      size="medium"
    >
      {label}
    </Button>
    <Button
      icon={icon ? <IconCoin /> : undefined}
      rightIcon={rightIcon ? <IconCaretDown /> : undefined}
      {...props}
      size="large"
    >
      {label}
    </Button>
  </Space>
);

const TemplateStates: StoryFn<CubeButtonProps> = ({
  label,
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
      {label || 'Default'}
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
      {label || 'Hovered'}
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
      {label || 'Pressed'}
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
      {label || 'Pressed & Hovered'}
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
      {label || 'Focused'}
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
      {label || 'Disabled'}
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
        {label || 'Selected'}
      </Button>
    ) : null}
  </Space>
);

const DarkTemplateStates: StoryFn<CubeButtonProps> = ({
  label,
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
      {label || 'Secondary'}
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
      {label || 'Hovered'}
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
      {label || 'Pressed'}
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
      {label || 'Pressed & Hovered'}
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
      {label || 'Focused'}
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
      {label || 'Disabled'}
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
        {label || 'Selected'}
      </Button>
    ) : null}
  </Space>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Button',
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
  label: 'Button',
  size: 'small',
};

export const Large = Template.bind({});
Large.args = {
  label: 'Button',
  size: 'large',
};

export const LeftIconAndText = TemplateSizes.bind({});
LeftIconAndText.args = {
  label: 'Button',
  icon: true,
};

export const RightIconAndText = TemplateSizes.bind({});
RightIconAndText.args = {
  label: 'Button',
  rightIcon: true,
};

export const TwoIconsAndText = TemplateSizes.bind({});
TwoIconsAndText.args = {
  label: 'Button',
  icon: true,
  rightIcon: true,
};

export const OnlyIcon = TemplateSizes.bind({});
OnlyIcon.args = {
  icon: true,
};

export const Loading = TemplateSizes.bind({});
Loading.args = {
  icon: true,
  isLoading: true,
  label: 'Button',
};
