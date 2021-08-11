import { NumberInput } from './NumberInput';
import { DollarCircleOutlined } from '@ant-design/icons';
import {
  AUTO_FOCUS_ARG,
  MESSAGE_ARG,
  IS_DISABLED_ARG,
  IS_LOADING_ARG,
  IS_READ_ONLY_ARG,
  IS_REQUIRED_ARG,
  LABEL_ARG,
  LABEL_POSITION_ARG,
  VALIDATION_STATE_ARG,
} from '../../stories/FormFieldArgs';

export default {
  title: 'UIKit/Atoms/NumberInput',
  component: NumberInput,
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
    hideStepper: {
      defaultValue: false,
      description: 'Whether to hide the increment and decrement buttons.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    ...IS_READ_ONLY_ARG,
    ...IS_REQUIRED_ARG,
    ...AUTO_FOCUS_ARG,
    ...IS_LOADING_ARG,
    ...VALIDATION_STATE_ARG,
    ...LABEL_POSITION_ARG,
    ...LABEL_ARG,
    ...MESSAGE_ARG,
    defaultValue: {
      defaultValue: undefined,
      control: 'number',
      description: 'The default value (uncontrolled).',
    },
    minValue: {
      defaultValue: undefined,
      control: 'number',
      description: 'The default value (uncontrolled).',
    },
    maxValue: {
      defaultValue: undefined,
      control: 'number',
      description: 'The largest value allowed for the input.',
    },
    step: {
      defaultValue: undefined,
      control: 'number',
      description:
        'The amount that the input value changes with each increment or decrement "tick".',
    },
  },
};

const Template = ({ icon, ...props }) => (
  <NumberInput
    prefix={icon ? <DollarCircleOutlined /> : null}
    {...props}
    onChange={(query) => console.log('change', query)}
  />
);

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: 5 };
