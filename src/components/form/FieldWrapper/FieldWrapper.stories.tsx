import { Meta, StoryFn } from '@storybook/react-vite';
import { IconCoin } from '@tabler/icons-react';

import { Button } from '../../actions/index';
import { Text } from '../../content/Text';

import { FieldWrapper } from './FieldWrapper';

import type { CubeFieldWrapperProps } from './types';

export default {
  title: 'Forms/FieldWrapper',
  component: FieldWrapper,
  args: {
    label: 'Field name',
    Component: (
      <Text.Minor
        fill="#minor.05"
        styles={{
          display: 'block',
          padding: '1x 2x',
          radius: true,
          width: '40x',
        }}
      >
        This slot is for a form input
      </Text.Minor>
    ),
  },
  parameters: {
    layout: 'centered',
    docs: { hidden: true },
  },
} as Meta<CubeFieldWrapperProps>;

const Template: StoryFn<CubeFieldWrapperProps> = (args) => (
  <FieldWrapper {...args} />
);

export const Default = Template.bind({});

export const Small = Template.bind({});
Small.args = {
  labelProps: { size: 'small' },
};

export const WithTooltip = Template.bind({});
WithTooltip.args = {
  tooltip: 'Long description',
};

export const WithErrorMessage = Template.bind({});
WithErrorMessage.args = {
  errorMessage: 'This field is required',
  validationState: 'invalid',
};

export const SideLabel = Template.bind({});
SideLabel.args = {
  labelPosition: 'side',
};

export const SideLabelWithTooltip = Template.bind({});
SideLabelWithTooltip.args = {
  labelPosition: 'side',
  tooltip: 'Long description',
};

export const SideLabelWithMessage = Template.bind({});
SideLabelWithMessage.args = {
  labelPosition: 'side',
  description: 'Inline description of the field',
};

export const StyledLabel = Template.bind({});
StyledLabel.args = {
  labelStyles: {
    preset: 't2m',
  },
};

export const WithExtra = Template.bind({});
WithExtra.args = {
  extra: 'Extra info',
};

export const WithLabelSuffix = Template.bind({});
WithLabelSuffix.args = {
  labelSuffix: 'Suffix',
};

export const WithExtraAndSuffix = Template.bind({});
WithExtraAndSuffix.args = {
  extra: 'Extra info',
  labelSuffix: 'Suffix',
};

export const WithSuffixAndTooltip = Template.bind({});
WithSuffixAndTooltip.args = {
  labelSuffix: 'Suffix',
  tooltip: 'Long description',
};

export const WithSuffixExtraAndTooltip = Template.bind({});
WithSuffixExtraAndTooltip.args = {
  labelSuffix: 'Suffix',
  extra: 'Extra info',
  tooltip: 'Long description',
};

export const WithButtonSuffix = Template.bind({});
WithButtonSuffix.args = {
  labelSuffix: <Button size="small" icon={<IconCoin />} placeSelf="center" />,
};

export const WithButtonSuffixAndTooltip = Template.bind({});
WithButtonSuffixAndTooltip.args = {
  labelSuffix: (
    <Button
      width="3x"
      height="3x"
      type="clear"
      size="small"
      icon={<IconCoin />}
      placeSelf="center"
    />
  ),
  tooltip: 'Long description',
};

// New stories for description and errorMessage functionality

export const WithDescription = Template.bind({});
WithDescription.args = {
  description:
    'This is a helpful description that explains what this field is for',
};

export const WithDescriptionAndErrorMessage = Template.bind({});
WithDescriptionAndErrorMessage.args = {
  description:
    'This is a helpful description that explains what this field is for',
  errorMessage: 'This field has an error that needs to be fixed',
};

export const SideLabelWithDescription = Template.bind({});
SideLabelWithDescription.args = {
  labelPosition: 'side',
  description:
    'This is a helpful description that explains what this field is for',
};

export const SideLabelWithDescriptionAndErrorMessage = Template.bind({});
SideLabelWithDescriptionAndErrorMessage.args = {
  labelPosition: 'side',
  description:
    'This is a helpful description that explains what this field is for',
  errorMessage: 'This field has an error that needs to be fixed',
};

export const BackwardCompatibilityMessage = Template.bind({});
BackwardCompatibilityMessage.args = {
  message: 'This is the old message prop (deprecated but still works)',
  validationState: 'invalid',
};

export const ErrorMessageOverridesMessage = Template.bind({});
ErrorMessageOverridesMessage.args = {
  message: 'This message will not be shown',
  errorMessage: 'This error message takes precedence',
  description: 'Description is shown alongside error message',
};

export const SplitLabel = Template.bind({});
SplitLabel.args = {
  labelPosition: 'split',
  styles: { width: '(100vw - 6x)' },
};

export const SplitLabelWithTooltip = Template.bind({});
SplitLabelWithTooltip.args = {
  labelPosition: 'split',
  styles: { width: '(100vw - 6x)' },
  tooltip: 'Long description',
};

export const SplitLabelWithDescription = Template.bind({});
SplitLabelWithDescription.args = {
  labelPosition: 'split',
  styles: { width: '(100vw - 6x)' },
  description:
    'This is a helpful description that explains what this field is for',
};

export const SplitLabelWithDescriptionAndErrorMessage = Template.bind({});
SplitLabelWithDescriptionAndErrorMessage.args = {
  labelPosition: 'split',
  styles: { width: '(100vw - 6x)' },
  description:
    'This is a helpful description that explains what this field is for',
  errorMessage: 'This field has an error that needs to be fixed',
};
