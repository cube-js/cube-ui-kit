import { DollarCircleOutlined } from '@ant-design/icons';
import { Button } from './Button';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

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
          'default',
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

const Template = ({ icon, label, onClick, ...props }) => (
  <Button
    icon={icon ? <DollarCircleOutlined /> : undefined}
    {...props}
    onPress={(e) => console.log('Press', e)}
  >
    {label}
  </Button>
);

const TemplateStates = ({ label, mods, ...props }) => (
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
  label: 'Button',
};

export const SecondaryStates = TemplateStates.bind({});
SecondaryStates.args = {
  type: 'default',
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
  label: 'Button',
  size: 'small',
};

export const Large = Template.bind({});
Large.args = {
  label: 'Button',
  size: 'large',
};

export const Danger = Template.bind({});
Danger.args = {
  label: 'Button',
  theme: 'danger',
};

export const IconAndText = Template.bind({});
IconAndText.args = {
  label: 'Button',
  icon: true,
};

export const OnlyIcon = Template.bind({});
OnlyIcon.args = {
  icon: true,
};

export const OnlyIconSmall = Template.bind({});
OnlyIconSmall.args = {
  icon: true,
  size: 'small',
};

export const OnlyIconLarge = Template.bind({});
OnlyIconLarge.args = {
  icon: true,
  size: 'large',
};

export const Loading = Template.bind({});
Loading.args = {
  icon: true,
  isLoading: true,
  label: 'Button',
};
