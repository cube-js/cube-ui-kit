import React from 'react';

import UIKitCard from './Card';

// fix component name
const Card = (args) => <UIKitCard {...args} />;

export default {
  title: 'UIKit/Atoms/Card',
  component: Card,
  argTypes: {},
};

const Template = (args) => <Card>Card content</Card>;

export const Default = Template.bind({});
Default.args = {};
