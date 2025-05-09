import { IconCoin } from '@tabler/icons-react';

import { NUMBER_VALUE_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

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
    prefix={icon ? <IconCoin /> : null}
    {...props}
    onChange={(query) => console.log('change', query)}
  />
);

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: 5 };

export const Small = Template.bind({});
Small.args = {
  size: 'small',
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

export const WithSuffixBefore = Template.bind({});
WithSuffixBefore.args = {
  suffix: <div>suffix</div>,
  suffixPosition: 'before',
};

export const WithSuffixAfter = Template.bind({});
WithSuffixAfter.args = {
  suffix: <div>suffix</div>,
  suffixPosition: 'after',
};
