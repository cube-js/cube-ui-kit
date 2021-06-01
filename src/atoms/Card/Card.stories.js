import React from 'react';
import { Card } from './Card';

export default {
  title: 'UIKit/Atoms/Card',
  component: Card,
  argTypes: {},
};

const Template = (args) => <Card {...args}>Card content</Card>;

export const Default = Template.bind({});
Default.args = {};
