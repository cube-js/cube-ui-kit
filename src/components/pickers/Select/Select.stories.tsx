import { DollarCircleOutlined } from '@ant-design/icons';
import { Meta, Story } from '@storybook/react';
import { userEvent, waitFor, within } from '@storybook/testing-library';

import { baseProps } from '../../../stories/lists/baseProps';
import { Block } from '../../Block';

import { Select, CubeSelectProps } from './Select';

export default {
  title: 'Pickers/Select',
  component: Select,
  args: {
    width: '200px',
    label: 'Select a color',
  },
  subcomponents: { Item: Select.Item },
  parameters: { controls: { exclude: baseProps }, layout: 'centered' },
} as Meta<CubeSelectProps<any>>;

const items = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'violet'];

const Template: Story<CubeSelectProps<any>> = (args) => (
  <Block height="48x">
    <Select {...args}>
      {items.map((item) => (
        <Select.Item key={item}>{item}</Select.Item>
      ))}
    </Select>
  </Block>
);

Template.play = async ({ canvasElement }) => {
  const { getByRole, getAllByRole } = within(canvasElement);

  const select = getByRole('button');

  await userEvent.click(select);

  const options = getAllByRole('option');

  await waitFor(async () => {
    await userEvent.click(options[2]);
  });

  await userEvent.click(select);
};

export const Default = Template.bind({});
Default.args = {};
Default.play = Template.play;

export const Primary = Template.bind({});
Primary.args = { type: 'primary', placeholder: 'primary' };

export const Clear = Template.bind({});
Clear.args = { type: 'clear', placeholder: 'clear' };

export const Invalid = Template.bind({});
Invalid.args = { selectedKey: 'yellow', validationState: 'invalid' };

export const Valid = Template.bind({});
Valid.args = { selectedKey: 'yellow', validationState: 'valid' };

export const WithPlaceholder = Template.bind({});
WithPlaceholder.args = { placeholder: 'Enter a value' };

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: <DollarCircleOutlined /> };
WithIcon.play = Template.play;

export const OverTheCustomBG = Template.bind({});
OverTheCustomBG.parameters = { backgrounds: { default: 'gray' } };

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true, label: 'Disabled' };

export const ReadOnly = Template.bind({});
ReadOnly.args = { isReadOnly: true, label: 'Read only' };

export const Loading = Template.bind({});
Loading.args = { isLoading: true, label: 'Loading' };

export const WithDisabledOption = Template.bind({});
WithDisabledOption.args = { disabledKeys: ['red'] };

WithDisabledOption.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByRole('button');

  await userEvent.click(button);
};

export const Wide: Story<CubeSelectProps<any>> = (args) => (
  <Select {...args}>
    {items.map((item) => (
      <Select.Item key={item}>
        {item} lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </Select.Item>
    ))}
  </Select>
);
Wide.args = { width: '500px', defaultSelectedKey: 'red' };
