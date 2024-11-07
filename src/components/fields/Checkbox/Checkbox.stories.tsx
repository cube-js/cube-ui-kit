import { baseProps } from '../../../stories/lists/baseProps';
import {
  IS_INDETERMINATE_ARG,
  IS_SELECTED_ARG,
} from '../../../stories/FormFieldArgs';
import { Flow } from '../../layout/Flow';

import { Checkbox } from './Checkbox';

export default {
  title: 'Forms/Checkbox',
  component: Checkbox,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...IS_SELECTED_ARG,
    ...IS_INDETERMINATE_ARG,
  },
};

const Template = (props) => (
  <Flow gap="2x">
    <Checkbox
      aria-label="Checkbox"
      {...props}
      defaultSelected={true}
      onChange={(query) => console.log('onChange event', query)}
    />
    <Checkbox
      aria-label="Checkbox"
      {...props}
      defaultSelected={false}
      onChange={(query) => console.log('onChange event', query)}
    />
  </Flow>
);

export const Default = Template.bind({});
Default.args = { children: 'Checkbox' };

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  label: '',
};

export const Intermediate = Template.bind({});
Intermediate.args = {
  isIndeterminate: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
  label: 'Checkbox',
};

export const Invalid = Template.bind({});
Invalid.args = {
  validationState: 'invalid',
  label: 'Checkbox',
};
