import { StoryFn } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';

import { ICON_ARG, VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { CubeDateRangePickerProps, DateRangePicker } from './DateRangePicker';
import { parseAbsoluteDate } from './parseDate';

export default {
  title: 'Forms/DateRangePicker',
  component: DateRangePicker,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...ICON_ARG,
    ...VALIDATION_ARGS,
  },
};

const Template: StoryFn<CubeDateRangePickerProps> = ({ ...props }) => {
  return (
    <DateRangePicker
      aria-label="DateRangePicker"
      wrapperStyles={{ width: 'max-content' }}
      {...props}
      onChange={(query) => console.log('change', query)}
    />
  );
};

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = {
  defaultValue: {
    start: parseAbsoluteDate(new Date('2020-09-10')),
    end: parseAbsoluteDate(new Date('2021-04-01')),
  },
};

export const WithDefaultValueOpen = Template.bind({});
WithDefaultValueOpen.args = WithDefaultValue.args;
WithDefaultValueOpen.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByRole('button');

  await userEvent.click(button);
};

export const WithSecondGranularity = Template.bind({});
WithSecondGranularity.args = {
  defaultValue: {
    start: parseAbsoluteDate(new Date('2020-09-10 18:19')),
    end: parseAbsoluteDate(new Date('2020-10-02 14:12')),
  },
  granularity: 'second',
};

export const Validation: StoryFn<CubeDateRangePickerProps> = (props) => (
  <Space gap="2x" flow="column" placeItems="start">
    <DateRangePicker {...props} isValid aria-label="Valid range" />
    <DateRangePicker {...props} isInvalid aria-label="Invalid range" />
  </Space>
);

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true };

export const Small = Template.bind({});
Small.args = { size: 'small' };

export const WithLocale = Template.bind({});
WithLocale.args = { useLocale: true };
