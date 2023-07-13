import { baseProps } from '../../../stories/lists/baseProps';
import { MULTIPLE_VALUE_ARG } from '../../../stories/FormFieldArgs';

import { Checkbox } from './Checkbox';

export default {
  title: 'Forms/CheckboxGroup',
  component: Checkbox.Group,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...MULTIPLE_VALUE_ARG,
  },
};

const Template = (props) => (
  <Checkbox.Group
    aria-label="Checkbox Group"
    {...props}
    onChange={(query) => console.log('onChange event', query)}
  >
    <Checkbox value="one">One</Checkbox>
    <Checkbox value="two">Two</Checkbox>
    <Checkbox value="three">Three</Checkbox>
  </Checkbox.Group>
);

export const Default = Template.bind({});
Default.args = {};

export const Invalid = Template.bind({});
Invalid.args = { validationState: 'invalid' };

export const WithLabel = Template.bind({});
WithLabel.args = { label: 'Checkbox Group', 'aria-label': undefined };
