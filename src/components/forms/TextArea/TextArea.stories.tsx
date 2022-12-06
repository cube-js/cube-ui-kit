import { Meta, Story } from '@storybook/react';
import { DollarCircleOutlined } from '@ant-design/icons';
import { userEvent, within } from '@storybook/testing-library';
import dedent from 'dedent';

import { baseProps } from '../../../stories/lists/baseProps';

import { TextArea, CubeTextAreaProps } from './TextArea';

export default {
  title: 'Forms/TextArea',
  component: TextArea,
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    styles: { width: '64x' },
  },
  parameters: { controls: { exclude: baseProps }, layout: 'centered' },
} as Meta<CubeTextAreaProps>;

const Template: Story<CubeTextAreaProps> = (args) => <TextArea {...args} />;

export const Default = Template.bind({});

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: 'default value' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: <DollarCircleOutlined /> };

export const Password = Template.bind({});
Password.args = {
  icon: <DollarCircleOutlined />,
  type: 'password',
  defaultValue: 'hidden value',
};

export const AutoSize = Template.bind({});
AutoSize.args = { autoSize: true };
AutoSize.play = async ({ canvasElement }) => {
  const { getByRole } = within(canvasElement);

  const input = getByRole('textbox');

  await userEvent.type(
    input,
    dedent`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer porttitor, mauris a vestibulum dignissim, tellus quam placerat augue, vitae ornare dolor lorem et odio. Praesent accumsan sagittis leo, eget laoreet tortor ullamcorper eu. Aliquam turpis nunc, mollis a turpis et, efficitur semper sem. Donec ac finibus elit. In mattis vitae felis nec dignissim. Donec ullamcorper nulla id libero pellentesque, sit amet tristique risus rhoncus. Sed vel urna suscipit justo ullamcorper rutrum dapibus quis nibh.`,
  );
};
