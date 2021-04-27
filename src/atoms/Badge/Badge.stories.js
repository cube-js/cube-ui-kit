import React from 'react';

import UIKitBadge from './Badge';

// fix component name
const Badge = (args) => <UIKitBadge {...args} />;

export default {
  title: 'UIKit/Atoms/Badge',
  component: Badge,
  argTypes: {
    type: {
      control: {
        type: 'inline-radio',
        options: [undefined, 'note', 'success', 'danger'],
      },
      description: 'Type of the alert',
      defaultValue: undefined,
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'note' },
      },
    },
  },
};

const Template = ({ label, ...props }) => <Badge {...props}>{label}</Badge>;

export const Default = Template.bind({});
Default.args = {
  label: '1',
};
