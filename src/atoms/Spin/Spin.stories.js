import React from 'react';

import UIKitSpin from './Spin';

// fix component name
const Spin = (args) => <UIKitSpin {...args} />;

export default {
  title: 'UIKit/Atoms/Spin',
  component: Spin,
  argTypes: {
    size: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, 'small', 'medium', 'large', 8],
      },
    },
  },
};

const Template = ({ size }) => <Spin size={size} />;

export const Default = Template.bind({});
Default.args = {};
