import { StoryFn } from '@storybook/react';
import { userEvent, within } from '@storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';

import { CubeDatePickerProps, DatePicker } from './DatePicker';
import { parseAbsoluteDate } from './parseDate';

export default {
  title: 'Forms/DatePicker',
  component: DatePicker,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    label: {
      control: { type: 'text' },
      description: 'Label for the date picker',
      table: {
        type: { summary: 'string' },
      },
    },
    description: {
      control: { type: 'text' },
      description: 'Additional descriptive text',
      table: {
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when no date is selected',
      table: {
        type: { summary: 'string' },
      },
    },

    /* Value */
    value: {
      control: { type: 'text' },
      description: 'The current date value (controlled)',
      table: {
        type: { summary: 'DateValue' },
      },
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The default date value (uncontrolled)',
      table: {
        type: { summary: 'DateValue' },
      },
    },
    placeholderValue: {
      control: { type: 'text' },
      description: 'Date used as placeholder when calendar opens',
      table: {
        type: { summary: 'DateValue' },
      },
    },

    /* Date Constraints */
    minValue: {
      control: { type: 'text' },
      description: 'The minimum allowed date',
      table: {
        type: { summary: 'DateValue' },
      },
    },
    maxValue: {
      control: { type: 'text' },
      description: 'The maximum allowed date',
      table: {
        type: { summary: 'DateValue' },
      },
    },
    granularity: {
      options: ['day', 'hour', 'minute', 'second'],
      control: { type: 'radio' },
      description: 'Determines the smallest selectable unit',
      table: {
        type: { summary: "'day' | 'hour' | 'minute' | 'second'" },
        defaultValue: { summary: 'day' },
      },
    },

    /* Presentation */
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'DatePicker size',
      table: {
        type: { summary: "'small' | 'medium' | 'large' | (string & {})" },
        defaultValue: { summary: 'medium' },
      },
    },
    showMonthAndYearPickers: {
      control: { type: 'boolean' },
      description: 'Whether to show month and year picker dropdowns',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    useLocale: {
      control: { type: 'boolean' },
      description: 'Whether to use locale-specific date formatting',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    maxVisibleMonths: {
      control: { type: 'number', min: 1, max: 3 },
      description: 'Maximum number of months to display in calendar',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 1 },
      },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the date picker is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the date picker can be focused but not changed',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether date selection is required before form submission',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the date picker should display valid or invalid visual styling',
      table: {
        type: { summary: 'ValidationState' },
      },
    },
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the element should receive focus on render',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when the date value changes',
      control: { type: null },
      table: {
        type: { summary: '(value: DateValue | null) => void' },
      },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the date picker loses focus',
      control: { type: null },
      table: {
        type: { summary: '(e: FocusEvent) => void' },
      },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the date picker receives focus',
      control: { type: null },
      table: {
        type: { summary: '(e: FocusEvent) => void' },
      },
    },
    onOpenChange: {
      action: 'open-change',
      description: 'Callback fired when the calendar opens or closes',
      control: { type: null },
      table: {
        type: { summary: '(isOpen: boolean) => void' },
      },
    },
  },
};

const Template: StoryFn<CubeDatePickerProps> = ({ ...props }) => {
  try {
    if (props.defaultValue) {
      props.defaultValue = parseAbsoluteDate(props.defaultValue);
    }
  } catch (e) {
    props.defaultValue = undefined;
  }

  try {
    if (props.value) {
      props.value = parseAbsoluteDate(props.value);
    }
  } catch (e) {
    props.value = undefined;
  }

  return (
    <DatePicker
      aria-label="DatePicker"
      wrapperStyles={{ width: 'max-content' }}
      {...props}
    />
  );
};

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: new Date('2023-10-04 12:14') };

export const WithDefaultValueOpen = Template.bind({});
WithDefaultValueOpen.args = WithDefaultValue.args;
WithDefaultValueOpen.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByRole('button');

  await userEvent.click(button);
};

export const Invalid = Template.bind({});
Invalid.args = { validationState: 'invalid' };

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true };

export const Small = Template.bind({});
Small.args = { size: 'small' };

export const WithLimitedRange = Template.bind({});
WithLimitedRange.args = {
  minValue: parseAbsoluteDate('2023-10-04'),
  maxValue: parseAbsoluteDate('2023-12-15'),
};

export const WithLocale = Template.bind({});
WithLocale.args = { useLocale: true };
