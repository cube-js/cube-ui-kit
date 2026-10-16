import { MULTIPLE_VALUE_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { Checkbox } from './Checkbox';

import type { StoryFn } from '@storybook/react-vite';

export default {
  title: 'Forms/CheckboxGroup',
  component: Checkbox.Group,
  args: { fieldStyles: { width: '0 max-content 100%' } },
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

export const Default: StoryFn = Template.bind({});
Default.args = {};

export const Validation: StoryFn = () => (
  <Space gap="2x" flow="column" placeItems="start">
    <Checkbox.Group
      fieldStyles={{ width: '0 max-content 100%' }}
      label="Valid group"
      isValid
      defaultValue={['one']}
    >
      <Checkbox value="one">One</Checkbox>
      <Checkbox value="two">Two</Checkbox>
    </Checkbox.Group>
    <Checkbox.Group
      fieldStyles={{ width: '0 max-content 100%' }}
      label="Invalid group"
      isInvalid
    >
      <Checkbox value="one">One</Checkbox>
      <Checkbox value="two">Two</Checkbox>
    </Checkbox.Group>
  </Space>
);

export const WithLabel: StoryFn = Template.bind({});
WithLabel.args = { label: 'Checkbox Group', 'aria-label': undefined };
