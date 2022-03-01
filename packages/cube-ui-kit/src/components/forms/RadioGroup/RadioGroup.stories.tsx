import { Radio } from './Radio';
import { baseProps } from '../../../stories/lists/baseProps';
import {
  IS_SELECTED_ARG,
  TEXT_VALUE_ARG,
} from '../../../stories/FormFieldArgs';

export default {
  title: 'UIKit/Forms/RadioGroup',
  component: Radio.Group,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...TEXT_VALUE_ARG,
  },
};

const Template = ({ type, ...props }) => (
  <Radio.Group
    {...props}
    onChange={(query) => console.log('onChange event', query)}
  >
    {type !== 'button' ? (
      <>
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
      </>
    ) : (
      <>
        <Radio.Button value="yes">Yes</Radio.Button>
        <Radio type="button" value="no">
          No
        </Radio>
      </>
    )}
  </Radio.Group>
);

export const Default = Template.bind({});
Default.args = {};

export const RadioButtons = Template.bind({});
RadioButtons.args = { type: 'button' };
