import { CaretDownOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { Story } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { Button } from './Button';

import { CubeButtonProps } from '.';

export default {
  title: 'Actions/Button',
  component: Button,
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    size: {
      defaultValue: undefined,
      control: { type: 'radio', options: [undefined, 'small', 'large'] },
    },
    type: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [
          undefined,
          'secondary',
          'primary',
          'outline',
          'clear',
          'neutral',
          'link',
        ],
      },
    },
    theme: {
      defaultValue: undefined,
      control: { type: 'radio', options: [undefined, 'danger'] },
    },
  },
};

const Template: Story<CubeButtonProps> = (args) => <Button {...args} />;

const TemplateSizes: Story<CubeButtonProps> = (args) => (
  <Space>
    <Button {...args} size="small" />
    <Button {...args} size="medium" />
    <Button {...args} size="large" />
  </Space>
);

TemplateSizes.argTypes = {
  size: { control: { disable: true } },
};

const TemplateStates: Story<CubeButtonProps> = ({ label, mods, ...props }) => (
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

export const Danger = Template.bind({});
Danger.args = {
  children: 'Button',
  theme: 'danger',
};

export const LeftIconAndText = TemplateSizes.bind({});
LeftIconAndText.args = {
  children: 'Button',
  icon: <DollarCircleOutlined />,
};

export const RightIconAndText = TemplateSizes.bind({});
RightIconAndText.args = {
  children: 'Button',
  rightIcon: <CaretDownOutlined />,
};

export const TwoIconsAndText = TemplateSizes.bind({});
TwoIconsAndText.args = {
  children: 'Button',
  icon: <DollarCircleOutlined />,
  rightIcon: <CaretDownOutlined />,
};

export const OnlyIcon = TemplateSizes.bind({});
OnlyIcon.args = {
  icon: <DollarCircleOutlined />,
};

export const Loading = TemplateSizes.bind({});
Loading.args = {
  icon: <DollarCircleOutlined />,
  isLoading: true,
  children: 'Button',
};
