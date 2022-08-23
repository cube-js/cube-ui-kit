import { DollarCircleOutlined } from '@ant-design/icons';

import { baseProps } from '../../../stories/lists/baseProps';
import { NUMBER_VALUE_ARG } from '../../../stories/FormFieldArgs';

import { NumberInput } from './NumberInput';

export default {
  title: 'Forms/NumberInput',
  component: NumberInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...NUMBER_VALUE_ARG,
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
