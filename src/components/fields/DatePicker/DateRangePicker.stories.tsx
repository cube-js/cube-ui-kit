import { StoryFn } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';

import { ICON_ARG, VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import {
  openPickerDialog,
  PICKER_DIALOG_ARGS,
} from '../../../stories/PickerDialogArgs';
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
    ...PICKER_DIALOG_ARGS,
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
WithDefaultValueOpen.args = { ...WithDefaultValue.args, dialogType: 'popover' };
WithDefaultValueOpen.play = async ({ canvasElement }) =>
  openPickerDialog(canvasElement, 'popover');

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

export const Tray = Template.bind({});
Tray.args = { ...WithDefaultValueOpen.args, dialogType: 'tray' };
Tray.play = async ({ canvasElement }) =>
  openPickerDialog(canvasElement, 'tray');
