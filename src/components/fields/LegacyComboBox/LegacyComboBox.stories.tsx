import { Meta, StoryFn } from '@storybook/react-vite';
import { IconCoin } from '@tabler/icons-react';
import { userEvent, within } from 'storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';
import { wait } from '../../../test/utils/wait';
import { Button } from '../../actions/index';
import { Field, Form } from '../../form/index';
import { Flow } from '../../layout/Flow';

import { CubeLegacyComboBoxProps, LegacyComboBox } from './LegacyComboBox';

export default {
  title: 'Forms/LegacyComboBox',
  component: LegacyComboBox,
  subcomponents: { Item: LegacyComboBox.Item, Section: LegacyComboBox.Section },
  args: { id: 'name', width: '200px', label: 'Choose your favourite color' },
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    /* Content */
    children: {
      control: { type: null },
      description:
        'LegacyComboBox.Item elements that define the available options',
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
    isClearable: {
      control: { type: 'boolean' },
      description:
        'Whether the combo box is clearable using ESC keyboard button or clear button inside the input',
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
      description: 'The current loading state of the LegacyComboBox',
    },

    /* Presentation */
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'LegacyComboBox size',
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
} as Meta<CubeLegacyComboBoxProps<any>>;

const Template: StoryFn<CubeLegacyComboBoxProps<any>> = (
  args: CubeLegacyComboBoxProps<any>,
) => (
  <>
    <LegacyComboBox {...args}>
      <LegacyComboBox.Item key="red">Red</LegacyComboBox.Item>
      <LegacyComboBox.Item key="orange">Orange</LegacyComboBox.Item>
      <LegacyComboBox.Item key="yellow">Yellow</LegacyComboBox.Item>
      <LegacyComboBox.Item key="green">Green</LegacyComboBox.Item>
      <LegacyComboBox.Item key="blue">Blue</LegacyComboBox.Item>
      <LegacyComboBox.Item key="purple">Purple</LegacyComboBox.Item>
      <LegacyComboBox.Item key="violet">Violet</LegacyComboBox.Item>
    </LegacyComboBox>
  </>
);

const TemplateForm: StoryFn<CubeLegacyComboBoxProps<any>> = (
  args: CubeLegacyComboBoxProps<any>,
) => {
  const [form] = Form.useForm();

  return (
    <Flow gap="2x">
      <Form
        form={form}
        defaultValues={{ combobox: args.allowsCustomValue ? 'unknown' : 'red' }}
        onSubmit={(data) => console.log('! submit', data)}
      >
        <LegacyComboBox
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
          <LegacyComboBox.Item key="red">
            {args.allowsCustomValue ? 'red' : 'Red'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="orange">
            {args.allowsCustomValue ? 'orange' : 'Orange'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="yellow">
            {args.allowsCustomValue ? 'yellow' : 'Yellow'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="green">
            {args.allowsCustomValue ? 'green' : 'Green'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="blue">
            {args.allowsCustomValue ? 'blue' : 'Blue'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="purple">
            {args.allowsCustomValue ? 'purple' : 'Purple'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="violet">
            {args.allowsCustomValue ? 'violet' : 'Violet'}
          </LegacyComboBox.Item>
        </LegacyComboBox>
      </Form>
      <Button>Focus</Button>
    </Flow>
  );
};

const TemplateFormPropagation: StoryFn<CubeLegacyComboBoxProps<any>> = (
  args: CubeLegacyComboBoxProps<any>,
) => {
  const [form] = Form.useForm();

  return (
    <Flow gap="2x">
      <Form
        form={form}
        defaultValues={{ combobox: args.allowsCustomValue ? 'unknown' : 'red' }}
        onSubmit={(data) => console.log('! submit', data)}
      >
        <LegacyComboBox
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
          <LegacyComboBox.Item key="red">
            {args.allowsCustomValue ? 'red' : 'Red'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="orange">
            {args.allowsCustomValue ? 'orange' : 'Orange'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="yellow">
            {args.allowsCustomValue ? 'yellow' : 'Yellow'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="green">
            {args.allowsCustomValue ? 'green' : 'Green'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="blue">
            {args.allowsCustomValue ? 'blue' : 'Blue'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="purple">
            {args.allowsCustomValue ? 'purple' : 'Purple'}
          </LegacyComboBox.Item>
          <LegacyComboBox.Item key="violet">
            {args.allowsCustomValue ? 'violet' : 'Violet'}
          </LegacyComboBox.Item>
        </LegacyComboBox>
        <Form.Submit>Submit</Form.Submit>
      </Form>
    </Flow>
  );
};

const TemplateLegacyForm: StoryFn<CubeLegacyComboBoxProps<any>> = (
  args: CubeLegacyComboBoxProps<any>,
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
          <LegacyComboBox {...args}>
            <LegacyComboBox.Item key="red">
              {args.allowsCustomValue ? 'red' : 'Red'}
            </LegacyComboBox.Item>
            <LegacyComboBox.Item key="orange">
              {args.allowsCustomValue ? 'orange' : 'Orange'}
            </LegacyComboBox.Item>
            <LegacyComboBox.Item key="yellow">
              {args.allowsCustomValue ? 'yellow' : 'Yellow'}
            </LegacyComboBox.Item>
            <LegacyComboBox.Item key="green">
              {args.allowsCustomValue ? 'green' : 'Green'}
            </LegacyComboBox.Item>
            <LegacyComboBox.Item key="blue">
              {args.allowsCustomValue ? 'blue' : 'Blue'}
            </LegacyComboBox.Item>
            <LegacyComboBox.Item key="purple">
              {args.allowsCustomValue ? 'purple' : 'Purple'}
            </LegacyComboBox.Item>
            <LegacyComboBox.Item key="violet">
              {args.allowsCustomValue ? 'violet' : 'Violet'}
            </LegacyComboBox.Item>
          </LegacyComboBox>
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

export const Clearable = Template.bind({});
Clearable.args = {
  defaultSelectedKey: 'purple',
  isClearable: true,
  placeholder: 'Choose a color...',
};

export const Wide: StoryFn<CubeLegacyComboBoxProps<any>> = (
  args: CubeLegacyComboBoxProps<any>,
) => (
  <LegacyComboBox {...args}>
    <LegacyComboBox.Item key="red">
      Red lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </LegacyComboBox.Item>
    <LegacyComboBox.Item key="blue">
      Blue lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </LegacyComboBox.Item>
  </LegacyComboBox>
);

Wide.args = { width: '600px', defaultSelectedKey: 'red' };

export const With1LongOption: StoryFn<CubeLegacyComboBoxProps<any>> = (
  args: CubeLegacyComboBoxProps<any>,
) => (
  <LegacyComboBox {...args}>
    <LegacyComboBox.Item key="red">Red</LegacyComboBox.Item>
    <LegacyComboBox.Item key="orange">Orange</LegacyComboBox.Item>
    <LegacyComboBox.Item key="yellow">Yellow</LegacyComboBox.Item>
    <LegacyComboBox.Item key="green">
      green lorem ipsum dolor sit amet, consectetur adipiscing elit
    </LegacyComboBox.Item>
    <LegacyComboBox.Item key="blue">Blue</LegacyComboBox.Item>
    <LegacyComboBox.Item key="purple">Purple</LegacyComboBox.Item>
    <LegacyComboBox.Item key="violet">Violet</LegacyComboBox.Item>
  </LegacyComboBox>
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
  const trigger = getByTestId('LegacyComboBoxTrigger');
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
  const trigger = getByTestId('LegacyComboBoxTrigger');
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

export const ItemsWithDescriptions: StoryFn<CubeLegacyComboBoxProps<any>> = (
  args,
) => (
  <LegacyComboBox {...args} width="300px" label="Choose an item">
    <LegacyComboBox.Item key="red" description="Strawberries, tomatoes">
      Red
    </LegacyComboBox.Item>
    <LegacyComboBox.Item key="orange" description="Oranges, carrots">
      Orange
    </LegacyComboBox.Item>
    <LegacyComboBox.Item key="yellow" description="Bananas, lemons">
      Yellow
    </LegacyComboBox.Item>
  </LegacyComboBox>
);
ItemsWithDescriptions.args = {};
ItemsWithDescriptions.play = async ({ canvasElement }) => {
  const { getByTestId } = within(canvasElement);

  const trigger = getByTestId('LegacyComboBoxTrigger');

  await userEvent.click(trigger);
};

// ---------------------------------
// Section stories for LegacyComboBox
// ---------------------------------

export const SectionsStatic: StoryFn<CubeLegacyComboBoxProps<any>> = (args) => (
  <LegacyComboBox {...args} width="280px" placeholder="Select a color">
    <LegacyComboBox.Section title="Warm colors">
      <LegacyComboBox.Item key="red">Red</LegacyComboBox.Item>
      <LegacyComboBox.Item key="orange">Orange</LegacyComboBox.Item>
      <LegacyComboBox.Item key="yellow">Yellow</LegacyComboBox.Item>
    </LegacyComboBox.Section>
    <LegacyComboBox.Section>
      <LegacyComboBox.Item key="teal">Teal</LegacyComboBox.Item>
      <LegacyComboBox.Item key="cyan">Cyan</LegacyComboBox.Item>
    </LegacyComboBox.Section>
    <LegacyComboBox.Section title="Cool colors">
      <LegacyComboBox.Item key="blue">Blue</LegacyComboBox.Item>
      <LegacyComboBox.Item key="purple">Purple</LegacyComboBox.Item>
    </LegacyComboBox.Section>
  </LegacyComboBox>
);

SectionsStatic.storyName = 'Sections – static items';
SectionsStatic.play = ItemsWithDescriptions.play;

export const SectionsDynamic: StoryFn<CubeLegacyComboBoxProps<any>> = (
  args,
) => {
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
    <LegacyComboBox
      {...args}
      defaultItems={groups}
      width="280px"
      placeholder="Select an item"
    >
      {(group: any) => (
        <LegacyComboBox.Section
          key={group.name}
          title={group.name}
          items={group.children}
        >
          {(item: any) => (
            <LegacyComboBox.Item key={item.id}>
              {item.label}
            </LegacyComboBox.Item>
          )}
        </LegacyComboBox.Section>
      )}
    </LegacyComboBox>
  );
};

SectionsDynamic.storyName = 'Sections – dynamic collection';
SectionsDynamic.play = ItemsWithDescriptions.play;
