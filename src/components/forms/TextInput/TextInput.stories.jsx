import { TextInput } from './TextInput';
import { DollarCircleOutlined } from '@ant-design/icons';
import {
  MESSAGE_ARG,
  IS_DISABLED_ARG,
  IS_LOADING_ARG,
  IS_REQUIRED_ARG,
  LABEL_ARG,
  LABEL_POSITION_ARG,
  MULTILINE_ARG,
  PLACEHOLDER_ARG,
  VALIDATION_STATE_ARG,
  SIZE_ARG,
  NECESSITY_INDICATOR_ARG,
} from '../../../stories/FormFieldArgs';

export default {
  title: 'UIKit/Forms/TextInput',
  component: TextInput,
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
    ...IS_DISABLED_ARG,
    ...IS_LOADING_ARG,
    ...VALIDATION_STATE_ARG,
    ...IS_REQUIRED_ARG,
    ...NECESSITY_INDICATOR_ARG,
    type: {
      defaultValue: 'text',
      description: 'Input type',
      control: {
        type: 'radio',
        options: ['text', 'search', 'url', 'tel', 'email', 'password'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'text' },
      },
    },
    ...SIZE_ARG,
    inputMode: {
      defaultValue: 'none',
      description: 'Input type mode',
      options: [
        'none',
        'text',
        'tel',
        'url',
        'email',
        'numeric',
        'decimal',
        'search',
      ],
      control: 'radio',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'none' },
      },
    },
    ...MESSAGE_ARG,
    ...LABEL_ARG,
    ...LABEL_POSITION_ARG,
    ...MULTILINE_ARG,
    defaultValue: {
      defaultValue: '',
      control: 'text',
    },
    ...PLACEHOLDER_ARG,
    suffix: {
      defaultValue: '',
      control: 'text',
    },
    suffixPosition: {
      defaultValue: 'after',
      description: 'Input type',
      control: {
        type: 'radio',
        options: ['before', 'after'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'text' },
      },
    },
  },
};

const Template = ({ icon, ...props }) => (
  <TextInput
    prefix={icon ? <DollarCircleOutlined /> : null}
    {...props}
    onChange={(query) => console.log('change', query)}
  />
);

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: 'default value' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: true };

export const Password = Template.bind({});
Password.args = { icon: true, type: 'password' };
