import { Meta, StoryFn } from '@storybook/react-vite';
import { userEvent, within } from '@storybook/test';
import { IconCoin } from '@tabler/icons-react';

import { baseProps } from '../../../stories/lists/baseProps';
import { wait } from '../../../test/utils/wait';
import { Button } from '../../actions/index';
import { Field, Form } from '../../form/index';
import { Flow } from '../../layout/Flow';

import { ComboBox, CubeComboBoxProps } from './ComboBox';

export default {
  title: 'Forms/ComboBox',
  component: ComboBox,
  subcomponents: { Item: ComboBox.Item, Section: ComboBox.Section },
  args: { id: 'name', width: '200px', label: 'Choose your favourite color' },
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    /* Content */
    children: {
      control: { type: null },
      description: 'ComboBox.Item elements that define the available options',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when input is empty',
    },
    icon: {
      control: { type: null },
      description: 'Icon element rendered before the input',
    },
    inputValue: {
      control: { type: 'text' },
      description: 'The current text value in controlled mode',
    },
    defaultInputValue: {
      control: { type: 'text' },
      description: 'The default text value in uncontrolled mode',
    },

    /* Selection */
    selectedKey: {
      control: { type: 'text' },
      description: 'The currently selected key (controlled)',
    },
    defaultSelectedKey: {
      control: { type: 'text' },
      description: 'The key of the initially selected item (uncontrolled)',
    },
    allowsCustomValue: {
      control: { type: 'boolean' },
      description: 'Whether the combo box allows custom values to be entered',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Behavior */
    menuTrigger: {
      options: ['focus', 'input', 'manual'],
      control: { type: 'radio' },
      description: 'How the menu is triggered',
      table: {
        defaultValue: { summary: 'input' },
      },
    },
    loadingState: {
      options: [undefined, 'loading', 'filtering', 'loadingMore'],
      control: { type: 'radio' },
      description: 'The current loading state of the ComboBox',
    },

    /* Presentation */
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'ComboBox size',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the input can be selected but not changed',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether user input is required before form submission',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the input should display valid or invalid visual styling',
    },
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the element should receive focus on render',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Events */
    onSelectionChange: {
      action: 'selection-change',
      description: 'Callback fired when the selected option changes',
      control: { type: null },
    },
    onInputChange: {
      action: 'input-change',
      description: 'Callback fired when the input text changes',
      control: { type: null },
    },
    onOpenChange: {
      action: 'open-change',
      description: 'Callback fired when the dropdown opens or closes',
      control: { type: null },
    },
    onBlur: {
      action: (e) => ({ type: 'blur', target: e?.target?.tagName }),
      description: 'Callback fired when the input loses focus',
      control: { type: null },
    },
    onFocus: {
      action: (e) => ({ type: 'focus', target: e?.target?.tagName }),
      description: 'Callback fired when the input receives focus',
      control: { type: null },
    },
  },
} as Meta<CubeComboBoxProps<any>>;

const Template: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => (
  <>
    <ComboBox {...args}>
      <ComboBox.Item key="red">Red</ComboBox.Item>
      <ComboBox.Item key="orange">Orange</ComboBox.Item>
      <ComboBox.Item key="yellow">Yellow</ComboBox.Item>
      <ComboBox.Item key="green">Green</ComboBox.Item>
      <ComboBox.Item key="blue">Blue</ComboBox.Item>
      <ComboBox.Item key="purple">Purple</ComboBox.Item>
      <ComboBox.Item key="violet">Violet</ComboBox.Item>
    </ComboBox>
  </>
);

const TemplateForm: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => {
  const [form] = Form.useForm();

  return (
    <Flow gap="2x">
      <Form
        form={form}
        defaultValues={{ combobox: args.allowsCustomValue ? 'unknown' : 'red' }}
        onSubmit={(data) => console.log('! submit', data)}
      >
        <ComboBox
          name="combobox"
          {...args}
          rules={[
            {
              required: true,
            },
            {
              pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
              message: 'Please enter valid variable name',
            },
          ]}
        >
          <ComboBox.Item key="red">
            {args.allowsCustomValue ? 'red' : 'Red'}
          </ComboBox.Item>
          <ComboBox.Item key="orange">
            {args.allowsCustomValue ? 'orange' : 'Orange'}
          </ComboBox.Item>
          <ComboBox.Item key="yellow">
            {args.allowsCustomValue ? 'yellow' : 'Yellow'}
          </ComboBox.Item>
          <ComboBox.Item key="green">
            {args.allowsCustomValue ? 'green' : 'Green'}
          </ComboBox.Item>
          <ComboBox.Item key="blue">
            {args.allowsCustomValue ? 'blue' : 'Blue'}
          </ComboBox.Item>
          <ComboBox.Item key="purple">
            {args.allowsCustomValue ? 'purple' : 'Purple'}
          </ComboBox.Item>
          <ComboBox.Item key="violet">
            {args.allowsCustomValue ? 'violet' : 'Violet'}
          </ComboBox.Item>
        </ComboBox>
      </Form>
      <Button>Focus</Button>
    </Flow>
  );
};

const TemplateFormPropagation: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => {
  const [form] = Form.useForm();

  return (
    <Flow gap="2x">
      <Form
        form={form}
        defaultValues={{ combobox: args.allowsCustomValue ? 'unknown' : 'red' }}
        onSubmit={(data) => console.log('! submit', data)}
      >
        <ComboBox
          name="combobox"
          {...args}
          rules={[
            {
              required: true,
            },
            {
              pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
              message: 'Please enter valid variable name',
            },
          ]}
        >
          <ComboBox.Item key="red">
            {args.allowsCustomValue ? 'red' : 'Red'}
          </ComboBox.Item>
          <ComboBox.Item key="orange">
            {args.allowsCustomValue ? 'orange' : 'Orange'}
          </ComboBox.Item>
          <ComboBox.Item key="yellow">
            {args.allowsCustomValue ? 'yellow' : 'Yellow'}
          </ComboBox.Item>
          <ComboBox.Item key="green">
            {args.allowsCustomValue ? 'green' : 'Green'}
          </ComboBox.Item>
          <ComboBox.Item key="blue">
            {args.allowsCustomValue ? 'blue' : 'Blue'}
          </ComboBox.Item>
          <ComboBox.Item key="purple">
            {args.allowsCustomValue ? 'purple' : 'Purple'}
          </ComboBox.Item>
          <ComboBox.Item key="violet">
            {args.allowsCustomValue ? 'violet' : 'Violet'}
          </ComboBox.Item>
        </ComboBox>
        <Form.Submit>Submit</Form.Submit>
      </Form>
    </Flow>
  );
};

const TemplateLegacyForm: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => {
  const [form] = Form.useForm();

  return (
    <Flow gap="2x">
      <Form
        form={form}
        defaultValues={{ combobox: args.allowsCustomValue ? 'unknown' : 'red' }}
        onSubmit={(data) => console.log('! Submit', data)}
      >
        <Field
          name="combobox"
          rules={[
            {
              required: true,
              pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
              message: 'Please enter valid variable name',
            },
          ]}
        >
          <ComboBox {...args}>
            <ComboBox.Item key="red">
              {args.allowsCustomValue ? 'red' : 'Red'}
            </ComboBox.Item>
            <ComboBox.Item key="orange">
              {args.allowsCustomValue ? 'orange' : 'Orange'}
            </ComboBox.Item>
            <ComboBox.Item key="yellow">
              {args.allowsCustomValue ? 'yellow' : 'Yellow'}
            </ComboBox.Item>
            <ComboBox.Item key="green">
              {args.allowsCustomValue ? 'green' : 'Green'}
            </ComboBox.Item>
            <ComboBox.Item key="blue">
              {args.allowsCustomValue ? 'blue' : 'Blue'}
            </ComboBox.Item>
            <ComboBox.Item key="purple">
              {args.allowsCustomValue ? 'purple' : 'Purple'}
            </ComboBox.Item>
            <ComboBox.Item key="violet">
              {args.allowsCustomValue ? 'violet' : 'Violet'}
            </ComboBox.Item>
          </ComboBox>
        </Field>
      </Form>
      <Button>Focus</Button>
    </Flow>
  );
};

export const Default = Template.bind({});
Default.args = {};

export const Small = Template.bind({});
Small.args = { size: 'small' };

export const Large = Template.bind({});
Large.args = { size: 'large' };

export const WithPlaceholder = Template.bind({});
WithPlaceholder.args = { placeholder: 'Enter a value' };

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: <IconCoin /> };

export const Invalid = Template.bind({});
Invalid.args = { selectedKey: 'yellow', validationState: 'invalid' };

export const Valid = Template.bind({});
Valid.args = { selectedKey: 'yellow', validationState: 'valid' };

export const Disabled = Template.bind({});
Disabled.args = { selectedKey: 'yellow', isDisabled: true };

export const Wide: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => (
  <ComboBox {...args}>
    <ComboBox.Item key="red">
      Red lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </ComboBox.Item>
    <ComboBox.Item key="blue">
      Blue lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </ComboBox.Item>
  </ComboBox>
);

Wide.args = { width: '600px', defaultSelectedKey: 'red' };

export const With1LongOption: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => (
  <ComboBox {...args}>
    <ComboBox.Item key="red">Red</ComboBox.Item>
    <ComboBox.Item key="orange">Orange</ComboBox.Item>
    <ComboBox.Item key="yellow">Yellow</ComboBox.Item>
    <ComboBox.Item key="green">
      green lorem ipsum dolor sit amet, consectetur adipiscing elit
    </ComboBox.Item>
    <ComboBox.Item key="blue">Blue</ComboBox.Item>
    <ComboBox.Item key="purple">Purple</ComboBox.Item>
    <ComboBox.Item key="violet">Violet</ComboBox.Item>
  </ComboBox>
);
With1LongOption.parameters = { layout: 'centered' };
With1LongOption.play = async ({ canvasElement }) => {
  const { getByRole } = within(canvasElement);

  const openButton = getByRole('button');

  await userEvent.click(openButton);
};

export const With1LongOptionFiltered = With1LongOption.bind({});
With1LongOptionFiltered.parameters = { layout: 'centered' };
With1LongOptionFiltered.play = async ({ canvasElement }) => {
  const { getByRole } = within(canvasElement);

  const combobox = getByRole('combobox');

  await userEvent.type(combobox, 'Red');
};

export const WithinForm = TemplateForm.bind({});
WithinForm.play = async ({ canvasElement }) => {
  const { getByRole, getByTestId } = within(canvasElement);

  const combobox = getByRole('combobox');
  const trigger = getByTestId('ComboBoxTrigger');
  const button = getByTestId('Button');
  const input = getByTestId('Input');

  await userEvent.click(combobox);
  await userEvent.click(trigger);
  await wait(250);
  await userEvent.click(button);
  await userEvent.type(
    input,
    '{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}blue',
  );
};

export const WithinFormSelected = TemplateForm.bind({});
WithinFormSelected.play = async ({ canvasElement }) => {
  const { getByRole, getByTestId } = within(canvasElement);

  const combobox = getByRole('combobox');
  const trigger = getByTestId('ComboBoxTrigger');
  const button = getByTestId('Button');
  const input = getByTestId('Input');

  await userEvent.click(combobox);
  await userEvent.click(trigger);
  await wait(250);
  await userEvent.click(button);
  await userEvent.type(
    input,
    '{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}blue{enter}',
  );
};

export const WithinFormWithCustomValue = TemplateForm.bind({});
WithinFormWithCustomValue.play = WithinForm.play;
WithinFormWithCustomValue.args = {
  ...TemplateForm.args,
  allowsCustomValue: true,
};

export const WithinFormWithLegacyFieldAndCustomValue = TemplateLegacyForm.bind(
  {},
);
WithinFormWithLegacyFieldAndCustomValue.play = WithinForm.play;
WithinFormWithLegacyFieldAndCustomValue.args = {
  ...TemplateForm.args,
  allowsCustomValue: true,
};

export const WithinFormStopEnterPropagation = TemplateFormPropagation.bind({});
WithinFormStopEnterPropagation.play = async ({ canvasElement }) => {
  const { getByTestId } = within(canvasElement);

  const input = getByTestId('Input');

  await userEvent.type(
    input,
    '{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}blurring{enter}',
  );
};

export const WithinFormStopBlurPropagation = TemplateFormPropagation.bind({});
WithinFormStopBlurPropagation.play = async ({ canvasElement }) => {
  const { getByTestId } = within(canvasElement);

  const input = getByTestId('Input');

  await userEvent.type(input, '!');
  const button = getByTestId('Button');
  await userEvent.click(button);
};

export const ItemsWithDescriptions: StoryFn<CubeComboBoxProps<any>> = (
  args,
) => (
  <ComboBox {...args} width="300px" label="Choose an item">
    <ComboBox.Item key="red" description="Strawberries, tomatoes">
      Red
    </ComboBox.Item>
    <ComboBox.Item key="orange" description="Oranges, carrots">
      Orange
    </ComboBox.Item>
    <ComboBox.Item key="yellow" description="Bananas, lemons">
      Yellow
    </ComboBox.Item>
  </ComboBox>
);
ItemsWithDescriptions.args = {};
ItemsWithDescriptions.play = async ({ canvasElement }) => {
  const { getByTestId } = within(canvasElement);

  const trigger = getByTestId('ComboBoxTrigger');

  await userEvent.click(trigger);
};

// ---------------------------------
// Section stories for ComboBox
// ---------------------------------

export const SectionsStatic: StoryFn<CubeComboBoxProps<any>> = (args) => (
  <ComboBox {...args} width="280px" placeholder="Select a color">
    <ComboBox.Section title="Warm colors">
      <ComboBox.Item key="red">Red</ComboBox.Item>
      <ComboBox.Item key="orange">Orange</ComboBox.Item>
      <ComboBox.Item key="yellow">Yellow</ComboBox.Item>
    </ComboBox.Section>
    <ComboBox.Section>
      <ComboBox.Item key="teal">Teal</ComboBox.Item>
      <ComboBox.Item key="cyan">Cyan</ComboBox.Item>
    </ComboBox.Section>
    <ComboBox.Section title="Cool colors">
      <ComboBox.Item key="blue">Blue</ComboBox.Item>
      <ComboBox.Item key="purple">Purple</ComboBox.Item>
    </ComboBox.Section>
  </ComboBox>
);

SectionsStatic.storyName = 'Sections – static items';
SectionsStatic.play = ItemsWithDescriptions.play;

export const SectionsDynamic: StoryFn<CubeComboBoxProps<any>> = (args) => {
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
    <ComboBox
      {...args}
      defaultItems={groups}
      width="280px"
      placeholder="Select an item"
    >
      {(group: any) => (
        <ComboBox.Section
          key={group.name}
          title={group.name}
          items={group.children}
        >
          {(item: any) => (
            <ComboBox.Item key={item.id}>{item.label}</ComboBox.Item>
          )}
        </ComboBox.Section>
      )}
    </ComboBox>
  );
};

SectionsDynamic.storyName = 'Sections – dynamic collection';
SectionsDynamic.play = ItemsWithDescriptions.play;
