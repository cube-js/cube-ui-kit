import { DollarCircleFilled } from '@ant-design/icons';
import { Meta, StoryFn } from '@storybook/react';

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

export const WithTooltip = Template.bind({});
WithTooltip.args = {
  tooltip: 'Long description',
};

export const WithMessage = Template.bind({});
WithMessage.args = {
  message: 'Inline description of the field',
};

export const WithErrorMessage = Template.bind({});
WithErrorMessage.args = {
  message: 'This field is required',
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
  message: 'Inline description of the field',
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
  labelSuffix: (
    <Button size="small" icon={<DollarCircleFilled />} placeSelf="center" />
  ),
};

export const WithButtonSuffixAndTooltip = Template.bind({});
WithButtonSuffixAndTooltip.args = {
  labelSuffix: (
    <Button
      width="3x"
      height="3x"
      type="clear"
      size="small"
      icon={<DollarCircleFilled />}
      placeSelf="center"
    />
  ),
  tooltip: 'Long description',
};
