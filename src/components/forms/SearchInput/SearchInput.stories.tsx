import { baseProps } from '../../../stories/lists/baseProps';
import { TEXT_VALUE_ARG } from '../../../stories/FormFieldArgs';

import { SearchInput } from './SearchInput';

export default {
  title: 'Forms/SearchInput',
  component: SearchInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...TEXT_VALUE_ARG,
  },
};

const Template = (args) => (
  <SearchInput {...args} onSubmit={(query) => console.log('result', query)} />
);

export const Default = Template.bind({});
Default.args = {};

export const Clearable = Template.bind({});
Clearable.args = {
  isClearable: true,
};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { value: 'Back to the Future' };

export const Invalid = Template.bind({});
Invalid.args = {
  validationState: 'invalid',
};

export const ClearableWithSuffix = Template.bind({});
ClearableWithSuffix.args = {
  isClearable: true,
  defaultValue: 'Back to the Future',
  suffix: 'suffix',
};
