import { Card } from './Card';

export default {
  title: 'UIKit/Content/Card',
  component: Card,
  argTypes: {
    shadow: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [
          undefined,
          true,
          '0 1x 3x #shadow',
          '0 1x 3x #purple',
          '0 1x 3x #purple.50',
        ],
      },
    },
    radius: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, '1r', 'round'],
      },
    },
    border: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, true, '#purple'],
      },
    },
    padding: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, '1x', '2x', '1x top'],
      },
    },
  },
};

const Template = (args) => <Card {...args}>Card content</Card>;

export const Default = Template.bind({});
