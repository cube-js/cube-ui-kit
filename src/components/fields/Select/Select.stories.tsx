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
  subcomponents: { Item: Select.Item, Section: Select.Section },
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
Clear.args = { type: 'clear', placeholder: 'clear', width: 'max-content' };

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

// ------------------------------
// Section stories
// ------------------------------

export const SectionsStatic: StoryFn<CubeSelectProps<any>> = (args) => (
  <Select {...args} placeholder="Pick something" width="260px">
    <Select.Section title="Warm colors">
      <Select.Item key="red">Red</Select.Item>
      <Select.Item key="orange">Orange</Select.Item>
      <Select.Item key="yellow">Yellow</Select.Item>
    </Select.Section>
    <Select.Section>
      <Select.Item key="cyan">Cyan</Select.Item>
      <Select.Item key="teal">Teal</Select.Item>
    </Select.Section>
    <Select.Section title="Cool colors">
      <Select.Item key="blue">Blue</Select.Item>
      <Select.Item key="purple">Purple</Select.Item>
    </Select.Section>
  </Select>
);

SectionsStatic.storyName = 'Sections – static items';
SectionsStatic.play = WithDisabledOption.play;

export const SectionsDynamic: StoryFn<CubeSelectProps<any>> = (args) => {
  const groups = [
    {
      name: 'Fruits',
      children: [
        { id: 'apple', label: 'Apple' },
        { id: 'orange', label: 'Orange' },
        { id: 'banana', label: 'Banana' },
      ],
    },
    {
      name: 'Vegetables',
      children: [
        { id: 'carrot', label: 'Carrot' },
        { id: 'peas', label: 'Peas' },
        { id: 'broccoli', label: 'Broccoli' },
      ],
    },
  ];

  return (
    <Select {...args} items={groups} width="260px" placeholder="Choose an item">
      {(group: any) => (
        <Select.Section
          key={group.name}
          title={group.name}
          items={group.children}
        >
          {(item: any) => <Select.Item key={item.id}>{item.label}</Select.Item>}
        </Select.Section>
      )}
    </Select>
  );
};

SectionsDynamic.storyName = 'Sections – dynamic collection';
SectionsDynamic.play = WithDisabledOption.play;
