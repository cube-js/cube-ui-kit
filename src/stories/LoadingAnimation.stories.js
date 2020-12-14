import React from 'react';

import UIKitLoadingAnimation from '../components/LoadingAnimation';

// fix component name
const LoadingAnimation = (args) => <UIKitLoadingAnimation {...args} />;

export default {
  title: 'Example/LoadingAnimation',
  component: LoadingAnimation,
  argTypes: {
    size: {
      defaultValue: 4,
      control: {
        type: 'inline-radio',
        options: [2, 3, 4],
      },
    },
  },
};

const Template = ({ size }) => <LoadingAnimation size={size} />;

export const Default = Template.bind({});
Default.args = {};
