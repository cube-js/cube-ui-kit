import { Checkbox } from './Checkbox';
import { baseProps } from '../../../stories/lists/baseProps';
import { MULTIPLE_VALUE_ARG } from '../../../stories/FormFieldArgs';

export default {
  title: 'UIKit/Forms/CheckboxGroup',
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
