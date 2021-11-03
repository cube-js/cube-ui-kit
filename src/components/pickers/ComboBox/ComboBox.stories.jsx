import { ComboBox, Item } from '../../../index';
import { DollarCircleOutlined } from '@ant-design/icons';
import {
  IS_LOADING_ARG,
  LABEL_ARG,
  LABEL_POSITION_ARG,
  MESSAGE_ARG,
  PLACEHOLDER_ARG,
  SIZE_ARG,
  VALIDATION_STATE_ARG,
} from '../../../stories/FormFieldArgs';

export default {
  title: 'UIKit/Pickers/ComboBox',
  component: ComboBox,
  argTypes: {
    icon: {
      defaultValue: false,
      description: 'Show the icon',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    ...SIZE_ARG,
    ...IS_LOADING_ARG,
    hideTrigger: {
      defaultValue: false,
      description: 'Hides trigger button',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    ...VALIDATION_STATE_ARG,
    allowsCustomValue: {
      defaultValue: false,
      description: 'Allows values that are not listed in options',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    menuTrigger: {
      defaultValue: undefined,
      description: 'Menu trigger behavior',
      control: {
        type: 'radio',
        options: ['input', 'focus', 'manual'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'input' },
      },
    },
    ...LABEL_POSITION_ARG,
    ...LABEL_ARG,
    ...MESSAGE_ARG,
    ...PLACEHOLDER_ARG,
    defaultSelectedKey: {
      defaultValue: null,
      description: 'Default selected key',
      control: 'text',
    },
    defaultInputValue: {
      defaultValue: null,
      description: 'Default selected key',
      control: 'text',
    },
  },
};

const Template = ({ icon, ...props }) => {
  return (
    <>
      <ComboBox
        id="name"
        prefix={icon ? <DollarCircleOutlined /> : null}
        {...props}
        onSelectionChange={(query) => console.log('change', query)}
        onInputChange={(query) => console.log('input', query)}
        width="200px"
      >
        <Item key="red">Red</Item>
        <Item key="orange">Orange</Item>
        <Item key="yellow">Yellow</Item>
        <Item key="green">Green</Item>
        <Item key="blue">Blue</Item>
        <Item key="purple">Purple</Item>
        <Item key="violet">Violet</Item>
      </ComboBox>
    </>
  );
};

export const Default = Template.bind({});
Default.args = { disallowEmptySelection: true };

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: true };
