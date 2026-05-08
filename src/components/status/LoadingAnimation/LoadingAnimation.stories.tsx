import { Meta, StoryFn } from '@storybook/react-vite';

import { withDarkScheme } from '../../../stories/decorators/withColorScheme';
import { baseProps } from '../../../stories/lists/baseProps';

import {
  CubeLoadingAnimationProps,
  LoadingAnimation,
} from './LoadingAnimation';

export default {
  title: 'Status/LoadingAnimation',
  component: LoadingAnimation,
  parameters: { controls: { exclude: baseProps } },
} as Meta<CubeLoadingAnimationProps>;

const Template: StoryFn<CubeLoadingAnimationProps> = (args) => (
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

export const DarkScheme = Template.bind({});
DarkScheme.args = {};
DarkScheme.decorators = [withDarkScheme];
