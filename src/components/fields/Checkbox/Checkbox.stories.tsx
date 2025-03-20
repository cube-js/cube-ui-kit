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

const Template = (props) => {
  return (
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
};

export const Default = Template.bind({});
Default.args = { children: 'Checkbox' };

export const WithLabel = Template.bind({});
WithLabel.args = { label: 'Checkbox' };

export const WithLabelAndTitle = Template.bind({});
WithLabelAndTitle.args = { children: 'Title', label: 'Checkbox' };

export const WithoutLabel = Template.bind({});
WithoutLabel.args = {};

export const Intermediate = Template.bind({});
Intermediate.args = {
  isIndeterminate: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
  children: 'Checkbox',
};

export const Invalid = Template.bind({});
Invalid.args = {
  validationState: 'invalid',
  children: 'Checkbox',
};
