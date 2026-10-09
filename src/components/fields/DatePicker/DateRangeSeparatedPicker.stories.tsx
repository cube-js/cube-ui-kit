import { StoryFn } from '@storybook/react-vite';
import { userEvent } from 'storybook/test';

import { NO_SNAPSHOT } from '../../../stories/chromatic';
import { ICON_ARG, VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { waitForOverlay } from '../../../stories/interactions';
import { baseProps } from '../../../stories/lists/baseProps';
import {
  openPickerDialog,
  PICKER_DIALOG_ARGS,
} from '../../../stories/PickerDialogArgs';
import { Space } from '../../layout/Space';

import {
  CubeDateRangeSeparatedPickerProps,
  DateRangeSeparatedPicker,
} from './DateRangeSeparatedPicker';
import { parseAbsoluteDate } from './parseDate';

export default {
  title: 'Forms/DateRangeSeparatedPicker',
  component: DateRangeSeparatedPicker,
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

const Template: StoryFn<CubeDateRangeSeparatedPickerProps> = ({ ...props }) => {
  return (
    <DateRangeSeparatedPicker
      aria-label="DateRangeSeparatedPicker"
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
// Without this the story photographs a closed picker — identical to
// `WithDefaultValue` — and the calendar it is named for goes untested.
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

export const Validation: StoryFn<CubeDateRangeSeparatedPickerProps> = (
  props,
) => (
  <Space gap="2x" flow="column" placeItems="start">
    <DateRangeSeparatedPicker {...props} isValid aria-label="Valid range" />
    <DateRangeSeparatedPicker {...props} isInvalid aria-label="Invalid range" />
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

export const EndTray = Template.bind({});
EndTray.args = { ...WithDefaultValueOpen.args, dialogType: 'tray' };
EndTray.play = async ({ canvasElement }) =>
  openPickerDialog(canvasElement, 'tray', 1);
// Same tray layout as Tray; this story checks the second trigger's wiring.
EndTray.parameters = NO_SNAPSHOT;
