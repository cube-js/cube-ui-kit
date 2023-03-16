import { baseProps } from '../../../stories/lists/baseProps';
import {
  IS_INDETERMINATE_ARG,
  IS_SELECTED_ARG,
} from '../../../stories/FormFieldArgs';

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
  <Checkbox
    aria-label="Checkbox"
    {...props}
    onChange={(query) => console.log('onChange event', query)}
  />
);

export const Default = Template.bind({});
Default.args = { children: 'Checkbox' };

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  label: '',
};

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: 'Checkbox',
  'aria-label': undefined,
};

export const Checked = Template.bind({});
Checked.args = {
  isSelected: true,
};

export const Intermediate = Template.bind({});
Intermediate.args = {
  isIndeterminate: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

export const Invalid = Template.bind({});
Invalid.args = {
  validationState: 'invalid',
};
