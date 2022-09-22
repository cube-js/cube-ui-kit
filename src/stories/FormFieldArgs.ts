import { baseProps } from './lists/baseProps';

export const DISABLE_BASE_ARGS = baseProps.reduce((map, prop) => {
  map[prop] = { table: { disable: true } };

  return map;
}, {});

export const LABEL_POSITION_ARG = {
  labelPosition: {
    description: 'The position of labels for each field.',
    options: ['top', 'side'],
    control: 'radio',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'top' },
    },
  },
};

export const LABEL_ARG = {
  label: {
    control: 'text',
    description: 'The content to display as the label.',
  },
};

export const EXTRA_ARG = {
  extra: {
    control: 'text',
    description: 'The extra content to display next to the label.',
  },
};

export const DESCRIPTION_ARG = {
  description: {
    control: 'text',
    description: 'The description for the field.',
  },
};

export const NECESSITY_INDICATOR_ARG = {
  necessityIndicator: {
    // defaultValue: 'icon',
    description: 'Type of the necessity indicator',
    options: ['icon', 'label', false],
    control: 'radio',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'icon' },
    },
  },
};

export const MESSAGE_ARG = {
  message: {
    // defaultValue: '',
    description: 'Validation error message',
    control: 'text',
  },
};

export const PLACEHOLDER_ARG = {
  placeholder: {
    // defaultValue: 'Placeholder',
    control: 'text',
  },
};

export const VALIDATION_STATE_ARG = {
  validationState: {
    // defaultValue: undefined,
    description:
      'Whether the input should display its "valid" or "invalid" visual styling.',
    options: [undefined, 'valid', 'invalid'],
    control: 'radio',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'top' },
    },
  },
};

export const IS_LOADING_ARG = {
  isLoading: {
    control: 'boolean',
    description: 'Loading state with spinner. Also works as disabled',
    // defaultValue: false,
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: false },
    },
  },
};

export const AUTO_FOCUS_ARG = {
  autoFocus: {
    // defaultValue: false,
    description: 'Whether the element should receive focus on render.',
    control: {
      type: 'boolean',
    },
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: false },
    },
  },
};

export const IS_REQUIRED_ARG = {
  isRequired: {
    // defaultValue: false,
    description:
      'Whether user input is required on the input before form submission. Often paired with the necessityIndicator prop to add a visual indicator to the input.',
    control: {
      type: 'boolean',
    },
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: false },
    },
  },
};

export const IS_READ_ONLY_ARG = {
  isReadOnly: {
    // defaultValue: false,
    description:
      'Whether the input can be selected but not changed by the user.',
    control: {
      type: 'boolean',
    },
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: false },
    },
  },
};

export const IS_DISABLED_ARG = {
  isDisabled: {
    // defaultValue: false,
    description: 'Whether the input is disabled.',
    control: {
      type: 'boolean',
    },
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: false },
    },
  },
};

export const SIZE_ARG = {
  size: {
    // defaultValue: undefined,
    description: 'The size of the button',
    options: [undefined, 'default', 'small'],
    control: 'radio',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'default' },
    },
  },
};

export const MULTILINE_ARG = {
  multiLine: {
    // defaultValue: false,
    description: 'Whether the input is multiline.',
    control: {
      type: 'boolean',
    },
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: false },
    },
  },
};

export const REQUIRED_MARK_ARG = {
  requiredMark: {
    // defaultValue: true,
    description: 'Whether to show the required mark on labels.',
    control: {
      type: 'boolean',
    },
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: true },
    },
  },
};

export const TEXT_VALUE_ARG = {
  value: {
    defaultValue: undefined,
    description: 'The text value in controlled mode',
    control: 'text',
    table: {
      type: { summary: 'string' },
    },
  },
  defaultValue: {
    defaultValue: undefined,
    description: 'The default text value in uncontrolled mode',
    control: 'text',
    table: {
      type: { summary: 'string' },
    },
  },
};

export const NUMBER_VALUE_ARG = {
  value: {
    defaultValue: undefined,
    description: 'The number value in controlled mode',
    control: 'text',
    table: {
      type: { summary: 'number' },
    },
  },
  defaultValue: {
    defaultValue: undefined,
    description: 'The default number value in uncontrolled mode',
    control: 'text',
    table: {
      type: { summary: 'number' },
    },
  },
};

export const MULTIPLE_VALUE_ARG = {
  value: {
    defaultValue: undefined,
    description: 'The multiple value in controlled mode',
    control: 'object',
    table: {
      type: { summary: 'string[]' },
    },
  },
  defaultValue: {
    defaultValue: undefined,
    description: 'The default multiple value in uncontrolled mode',
    control: 'object',
    table: {
      type: { summary: 'string[]' },
    },
  },
};

export const MULTIPLE_NUMBER_VALUE_ARG = {
  value: {
    defaultValue: undefined,
    description: 'The multiple value in controlled mode',
    control: 'object',
    table: {
      type: { summary: 'number[]' },
    },
  },
  defaultValue: {
    defaultValue: undefined,
    description: 'The default multiple value in uncontrolled mode',
    control: 'object',
    table: {
      type: { summary: 'number[]' },
    },
  },
};

export const IS_SELECTED_ARG = {
  isSelected: {
    defaultValue: undefined,
    description: 'Whether the input is selected in controlled mode',
    control: {
      type: 'radio',
      options: [undefined, true, false],
    },
    table: {
      type: { summary: 'boolean' },
    },
  },
  defaultSelected: {
    defaultValue: undefined,
    description:
      'Whether the input is selected by default in uncontrolled mode',
    control: {
      type: 'radio',
      options: [undefined, true, false],
    },
    table: {
      type: { summary: 'boolean' },
    },
  },
};

export const IS_INDETERMINATE_ARG = {
  isIndeterminate: {
    defaultValue: undefined,
    description: 'Whether the input is indeterminate in controlled mode',
    control: {
      type: 'radio',
      options: [undefined, true, false],
    },
    table: {
      type: { summary: 'boolean' },
    },
  },
};

export const SELECTED_KEY_ARG = {
  selectedKey: {
    defaultValue: undefined,
    description: 'The selected value in controlled mode',
    control: 'text',
    table: {
      type: { summary: 'string' },
    },
  },
  defaultSelectedKey: {
    defaultValue: undefined,
    description: 'The default selected value in uncontrolled mode',
    control: 'text',
    table: {
      type: { summary: 'string' },
    },
  },
};

export const ICON_ARG = {
  icon: {
    // defaultValue: true,
    description: 'Whether to show an icon on the element',
    control: {
      type: 'boolean',
    },
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: true },
    },
  },
};
