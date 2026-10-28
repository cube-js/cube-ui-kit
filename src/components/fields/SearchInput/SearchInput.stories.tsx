import { StoryFn } from '@storybook/react-vite';
import { within } from 'storybook/test';

import { NO_SNAPSHOT } from '../../../stories/chromatic';
import { VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { openTooltip } from '../../../stories/interactions';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { CubeSearchInputProps, SearchInput } from './SearchInput';

export default {
  title: 'Forms/SearchInput',
  component: SearchInput,
  args: { fieldStyles: { width: '0 320px 100%' } },
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    value: {
      control: { type: 'text' },
      description: 'The search value in controlled mode',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The default search value in uncontrolled mode',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when input is empty',
    },
    suffix: {
      control: { type: null },
      description:
        'Input decoration after the main input (before clear button)',
    },

    /* Search Specific */
    isClearable: {
      control: { type: 'boolean' },
      description: 'Whether the search input shows a clear button',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Presentation */
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'Input size',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },

    tooltip: {
      control: { type: 'text' },
      description:
        "The input's own tooltip, shown on hover over the field box and on keyboard focus, including while disabled",
    },
    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the input can be selected but not changed',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether user input is required before form submission',
      table: {
        defaultValue: { summary: false },
      },
    },
    ...VALIDATION_ARGS,
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the element should receive focus on render',
      table: {
        defaultValue: { summary: false },
      },
    },
    autoComplete: {
      control: { type: 'text' },
      description:
        'HTML `autocomplete` token telling the browser what to autofill (`off` to suppress autofill on a filter field)',
    },

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when the search value changes',
      control: { type: null },
    },
    onSubmit: {
      action: 'submit',
      description: 'Callback fired when search is submitted',
      control: { type: null },
    },
    onClear: {
      action: 'clear',
      description:
        'Callback fired after the text is cleared, by the clear button or by Escape',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the input loses focus',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the input receives focus',
      control: { type: null },
    },

    icon: {
      control: { type: null },
      description:
        'Icon element rendered before the input (default: search icon)',
      table: {
        type: { summary: 'ReactElement' },
      },
    },
    prefix: {
      control: { type: null },
      description: 'Content rendered before the input',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    suffixPosition: {
      options: ['before', 'after'],
      control: { type: 'radio' },
      description:
        'Position of suffix relative to validation/loading state icons',
      table: {
        defaultValue: { summary: 'after' },
        type: { summary: "'before' | 'after'" },
      },
    },
    inputProps: {
      control: { type: null },
      description: 'Direct props passed to the native input element',
      table: {
        type: { summary: 'Props' },
      },
    },
    wrapperProps: {
      control: { type: null },
      description: 'Direct props passed to the input wrapper element',
      table: {
        type: { summary: 'Props' },
      },
    },
    inputStyles: {
      control: { type: null },
      table: {
        type: { summary: 'Styles' },
      },
    },
  },
};

const Template: StoryFn<CubeSearchInputProps> = (props) => (
  <SearchInput {...props} onSubmit={(query) => console.log('submit', query)} />
);

export const Default = Template.bind({});
Default.args = {
  label: 'Search',
  placeholder: 'Search products...',
};

export const WithClearButton = Template.bind({});
WithClearButton.args = {
  label: 'Filter items',
  placeholder: 'Type to filter...',
  isClearable: true,
  defaultValue: 'sample search',
};

export const Small = Template.bind({});
Small.args = {
  size: 'small',
  placeholder: 'Quick search...',
  'aria-label': 'Quick search',
};

export const Validation: StoryFn<CubeSearchInputProps> = (props) => (
  <Space gap="2x" flow="column" placeItems="start">
    <SearchInput {...props} label="Valid" isValid defaultValue="cube" />
    <SearchInput
      {...props}
      label="Invalid"
      isInvalid
      placeholder="Enter at least 3 characters"
    />
  </Space>
);

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Search (Offline)',
  isDisabled: true,
  placeholder: 'Search unavailable',
};

export const WithTooltip: StoryFn<CubeSearchInputProps> = ({
  tooltip,
  ...args
}) => (
  <SearchInput
    qa="SearchMembers"
    {...args}
    // `delay: 0` only so the story does not depend on the open delay.
    tooltip={{ title: tooltip as string, delay: 0 }}
  />
);

WithTooltip.args = {
  'aria-label': 'Search members',
  placeholder: 'Search members',
  tooltip: 'Matches names and email addresses',
  // Room above the field, so the tooltip opens in its default `top` placement.
  fieldStyles: { width: '0 320px 100%', margin: '6x top' },
};

WithTooltip.parameters = {
  // The same open tooltip over a field box as `TextInput / WithTooltip`, and
  // `NumberInput / WithTooltip` photographs the anchor spanning more than the
  // input.
  ...NO_SNAPSHOT,
  docs: {
    description: {
      story:
        'While the tooltip is open, the first `Escape` closes it and keeps the text; the next one clears the field.',
    },
  },
};

WithTooltip.play = async ({ canvasElement }) => {
  // The tooltip is the field box's, so hover the box, as a pointer would.
  await openTooltip(
    () =>
      within(canvasElement)
        .getByTestId('SearchMembers')
        .closest('[data-qa="InputWrapper"]') as HTMLElement,
  );
};
