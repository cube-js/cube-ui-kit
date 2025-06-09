import { Meta, StoryFn } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { IconCoin } from '@tabler/icons-react';

import { SELECTED_KEY_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { CubeSelectProps, Select } from './Select';

export default {
  title: 'Pickers/Select',
  component: Select,
  args: { width: '200px' },
  subcomponents: { Item: Select.Item },
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    ...SELECTED_KEY_ARG,
    theme: {
      defaultValue: undefined,
      control: { type: 'radio', options: [undefined, 'special'] },
    },
    type: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, 'secondary', 'primary', 'clear'],
      },
    },
  },
} as Meta<CubeSelectProps<any>>;

const options = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'violet',
  'very-long-option-value-with-suffix',
];

const Template: StoryFn<CubeSelectProps<any>> = (args) => (
  <Space
    radius="1x"
    padding={args.theme === 'special' ? '2x' : undefined}
    fill={args.theme === 'special' ? '#dark' : undefined}
  >
    <Select {...args}>
      {options.map((option) => (
        <Select.Item key={option}>{option}</Select.Item>
      ))}
    </Select>
  </Space>
);

export const Default = Template.bind({});
Default.args = {};

export const Small = Template.bind({});
Small.args = { placeholder: 'small', size: 'small' };

export const Primary = Template.bind({});
Primary.args = { type: 'primary', placeholder: 'primary' };

export const Clear = Template.bind({});
Clear.args = { type: 'clear', placeholder: 'clear', width: 'min-content' };

export const Invalid = Template.bind({});
Invalid.args = { selectedKey: 'yellow', validationState: 'invalid' };

export const Valid = Template.bind({});
Valid.args = { selectedKey: 'yellow', validationState: 'valid' };

export const WithPlaceholder = Template.bind({});
WithPlaceholder.args = { placeholder: 'Enter a value' };

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: <IconCoin /> };

export const OverTheCustomBG = Template.bind({});
OverTheCustomBG.parameters = { backgrounds: { default: 'gray' } };

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true, label: 'Disabled' };

export const WithDisabledOption = Template.bind({});
WithDisabledOption.args = { disabledKeys: ['red'] };

WithDisabledOption.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByRole('button');

  await userEvent.click(button);
};

export const Wide: StoryFn<CubeSelectProps<any>> = (args) => (
  <Select {...args}>
    {options.map((option) => (
      <Select.Item key={option}>
        {option} lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </Select.Item>
    ))}
  </Select>
);
Wide.args = { width: 'max-content', defaultSelectedKey: options[0] };

export const WithEllipsis = Template.bind({});
WithEllipsis.args = {
  styles: { width: 'max 30x' },
  defaultSelectedKey: 'very-long-option-value-with-suffix',
};

export const WithDescription: StoryFn<CubeSelectProps<any>> = (args) => (
  <Select
    {...args}
    placeholder="Select a color"
    listBoxStyles={{ width: 'max 30x' }}
  >
    <Select.Item key="red" description="The color of fire">
      Red
    </Select.Item>
    <Select.Item key="green" description="The color of nature">
      Green
    </Select.Item>
    <Select.Item
      key="blue"
      description="The color of the sky (very long description)"
    >
      Blue
    </Select.Item>
  </Select>
);
WithDescription.args = {};
WithDescription.play = WithDisabledOption.play;
