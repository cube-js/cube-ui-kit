import { TextArea } from './TextArea';
import { DollarCircleOutlined } from '@ant-design/icons';
import {
  MESSAGE_ARG,
  IS_DISABLED_ARG,
  IS_LOADING_ARG,
  LABEL_ARG,
  LABEL_POSITION_ARG,
  PLACEHOLDER_ARG,
  VALIDATION_STATE_ARG,
} from '../../stories/FormFieldArgs';

export default {
  title: 'UIKit/Atoms/TextArea',
  component: TextArea,
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
    inputMode: {
      defaultValue: 'none',
      description: 'Input type mode',
      control: {
        type: 'radio',
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
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'none' },
      },
    },
    ...IS_DISABLED_ARG,
    ...IS_LOADING_ARG,
    ...VALIDATION_STATE_ARG,
    ...LABEL_POSITION_ARG,
    ...LABEL_ARG,
    ...MESSAGE_ARG,
    ...PLACEHOLDER_ARG,
    defaultValue: {
      defaultValue: '',
      control: 'text',
    },
    rows: {
      defaultValue: 3,
      description: 'Number of rows.',
      control: {
        type: 'number',
      },
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 1 },
      },
    },
    autoSize: {
      defaultValue: false,
      description: 'Whether the input should be resized depend on the content.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
  },
};

const Template = ({ icon, ...props }) => (
  <TextArea
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
