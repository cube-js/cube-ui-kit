import { StoryFn } from '@storybook/react-vite';

import { CheckIcon, CloseIcon, ExclamationIcon } from '../../../icons';
import { baseProps } from '../../../stories/lists/baseProps';
import { Block } from '../../Block';
import { Title } from '../../content/Title';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';

import { Radio } from './Radio';
import { CubeRadioGroupProps } from './RadioGroup';

export default {
  title: 'Forms/RadioGroup',
  component: Radio.Group,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    children: {
      control: { type: null },
      description: 'Radio elements that define the available options',
    },
    label: {
      control: { type: 'text' },
      description: 'Label for the radio group',
    },
    description: {
      control: { type: 'text' },
      description: 'Additional descriptive text for the group',
    },

    /* Value */
    value: {
      control: { type: 'text' },
      description: 'The currently selected value (controlled)',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The default selected value (uncontrolled)',
    },

    /* Presentation */
    type: {
      options: ['radio', 'button', 'tabs'],
      control: { type: 'radio' },
      description:
        'Visual type for all radios in the group (button/tabs default to horizontal)',
      table: {
        defaultValue: { summary: 'radio' },
      },
    },
    orientation: {
      options: [undefined, 'vertical', 'horizontal'],
      control: { type: 'radio' },
      description: 'Orientation of the radio group (auto-set based on type)',
      table: {
        defaultValue: { summary: 'auto' },
      },
    },
    size: {
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge'],
      control: { type: 'radio' },
      description: 'Size for all radio buttons in the group',
      table: {
        defaultValue: { summary: 'xsmall' },
      },
    },
    buttonType: {
      options: ['outline', 'outline-2', 'clear', 'primary'],
      control: { type: 'radio' },
      description:
        'Button type for button-style radios (ignored in tabs mode). When set to "primary", selected buttons use primary style and non-selected use outline',
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the entire radio group is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the radio group can be focused but not changed',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether selection is required before form submission',
      table: {
        defaultValue: { summary: false },
      },
    },
    isInvalid: {
      control: { type: 'boolean' },
      description:
        'Whether the radio group should display invalid visual styling',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when the selected value changes',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the radio group loses focus',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the radio group receives focus',
      control: { type: null },
    },

    groupStyles: {
      control: { type: null },
      table: {
        type: { summary: 'Styles' },
      },
    },
  },
};

// Basic radio group template
const Template: StoryFn<CubeRadioGroupProps> = (args) => (
  <Radio.Group defaultValue="yes" {...args}>
    <Radio value="yes">Yes</Radio>
    <Radio value="no">No</Radio>
    <Radio value="maybe">Maybe</Radio>
  </Radio.Group>
);

// Basic stories
export const Default = Template.bind({});
Default.args = {};

export const Invalid = Template.bind({});
Invalid.args = { isInvalid: true };

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: 'Choose an option',
};

export const WithLabelAndDescription = Template.bind({});
WithLabelAndDescription.args = {
  label: 'Choose an option',
  description: 'Select one of the available options',
};

export const HorizontalOrientation = Template.bind({});
HorizontalOrientation.args = {
  orientation: 'horizontal',
};

// Button group stories
export const ButtonGroup = Template.bind({});
ButtonGroup.args = {
  type: 'button',
};

export const TabsGroup: StoryFn<CubeRadioGroupProps> = (args) => (
  <Radio.Tabs defaultValue="yes" width="280px" {...args}>
    <Radio icon={<CheckIcon />} value="yes">
      Yes
    </Radio>
    <Radio icon={<CloseIcon />} value="no">
      No
    </Radio>
    <Radio icon={<ExclamationIcon />} value="maybe">
      Maybe
    </Radio>
  </Radio.Tabs>
);

export const Stretched: StoryFn<CubeRadioGroupProps> = (args) => (
  <Flow gap="2x">
    <Radio.Tabs stretch defaultValue="yes" width="280px" {...args}>
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Tabs>
    <Radio.Tabs stretch defaultValue="yes" width="280px" {...args}>
      <Radio value="yes" icon={<CheckIcon />} suffix="!">
        Yes
      </Radio>
      <Radio value="no" icon={<CloseIcon />} suffix="!">
        No
      </Radio>
      <Radio value="maybe" icon={<ExclamationIcon />} suffix="!">
        Maybe
      </Radio>
    </Radio.Tabs>
  </Flow>
);

// Size demonstrations
export const ButtonGroupSizes: StoryFn<CubeRadioGroupProps> = () => (
  <Space flow="column" gap="1x">
    <Space flow="column">
      <Title level={6}>XSmall</Title>
      <Radio.Group
        type="button"
        size="xsmall"
        defaultValue="yes"
        aria-label="XSmall"
      >
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Group>
    </Space>
    <Space flow="column">
      <Title level={6}>Small</Title>
      <Radio.Group
        type="button"
        size="small"
        defaultValue="yes"
        aria-label="Small"
      >
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Group>
    </Space>
    <Space flow="column">
      <Title level={6}>Medium</Title>
      <Radio.Group
        type="button"
        size="medium"
        defaultValue="yes"
        aria-label="Medium"
      >
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Group>
    </Space>
    <Space flow="column">
      <Title level={6}>Large</Title>
      <Radio.Group
        type="button"
        size="large"
        defaultValue="yes"
        aria-label="Large"
      >
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Group>
    </Space>
    <Space flow="column">
      <Title level={6}>XLarge</Title>
      <Radio.Group
        type="button"
        size="xlarge"
        defaultValue="yes"
        aria-label="XLarge"
      >
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Group>
    </Space>
  </Space>
);

export const TabsGroupSizes: StoryFn<CubeRadioGroupProps> = () => (
  <Space flow="column" gap="1x">
    <Space flow="column">
      <Title level={6}>Large (default, 40px)</Title>
      <Radio.Tabs size="large" defaultValue="yes" aria-label="Large">
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Tabs>
    </Space>
    <Space flow="column">
      <Title level={6}>Medium (32px)</Title>
      <Radio.Tabs size="medium" defaultValue="yes" aria-label="Medium">
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Tabs>
    </Space>
  </Space>
);

// Button type variants
export const CustomButtonTypes: StoryFn<CubeRadioGroupProps> = () => (
  <Space flow="column" gap="1x">
    <Space flow="column">
      <Title level={6}>
        Primary (selected: primary, non-selected: outline)
      </Title>
      <Radio.Group
        type="button"
        buttonType="primary"
        defaultValue="yes"
        aria-label="Primary"
      >
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Group>
    </Space>
    <Space flow="column">
      <Title level={6}>Outline (default)</Title>
      <Radio.Group
        type="button"
        buttonType="outline"
        defaultValue="yes"
        aria-label="Outline"
      >
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Group>
    </Space>
    {/* `outline-2` uses `#surface-3` as its base fill so it stands out
        when sitting on a `#surface-2` container — wrap accordingly. */}
    <Space flow="column">
      <Title level={6}>Outline 2 (on a #surface-2 container)</Title>
      <Block fill="#surface-2" padding="1.5x" radius="1cr">
        <Radio.Group
          type="button"
          buttonType="outline-2"
          defaultValue="yes"
          aria-label="Outline 2"
        >
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
          <Radio value="maybe">Maybe</Radio>
        </Radio.Group>
      </Block>
    </Space>
    <Space flow="column">
      <Title level={6}>Clear</Title>
      <Radio.Group
        type="button"
        buttonType="clear"
        defaultValue="yes"
        aria-label="Clear"
      >
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Group>
    </Space>
  </Space>
);

// Disabled state
export const DisabledState: StoryFn<CubeRadioGroupProps> = () => (
  <Space flow="column" gap="1x">
    <Space flow="column">
      <Title level={6}>Radio (Disabled)</Title>
      <Radio.Group
        type="radio"
        isDisabled={true}
        defaultValue="yes"
        aria-label="Radio (Disabled)"
      >
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Group>
    </Space>
    <Space flow="column">
      <Title level={6}>Button (Disabled)</Title>
      <Radio.Group
        type="button"
        isDisabled={true}
        defaultValue="yes"
        aria-label="Button (Disabled)"
      >
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Group>
    </Space>
    <Space flow="column">
      <Title level={6}>Tabs (Disabled)</Title>
      <Radio.Tabs
        isDisabled={true}
        defaultValue="yes"
        aria-label="Tabs (Disabled)"
      >
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
        <Radio value="maybe">Maybe</Radio>
      </Radio.Tabs>
    </Space>
  </Space>
);
