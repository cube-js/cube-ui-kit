import {
  LoadingAnimation,
  CubeLoadingAnimationProps,
} from './LoadingAnimation';
import { baseProps } from '../../../stories/lists/baseProps';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'Status/LoadingAnimation',
  component: LoadingAnimation,
  parameters: { controls: { exclude: baseProps } },
} as Meta<CubeLoadingAnimationProps>;

const Template: Story<CubeLoadingAnimationProps> = (args) => (
  <LoadingAnimation {...args} />
);

export const Default = Template.bind({});
Default.args = {};
export const Small = Template.bind({});
Small.args = {
  size: 'small',
};
export const Large = Template.bind({});
Large.args = {
  size: 'large',
};
