import { Paragraph } from '../components/content/Paragraph';

export default {
  title: 'Generic/Paragraph',
  component: Paragraph,
  argTypes: {
    italic: {
      defaultValue: false,
      control: {
        type: 'boolean',
      },
    },
    nowrap: {
      defaultValue: false,
      control: {
        type: 'boolean',
      },
    },
    ellipsis: {
      defaultValue: false,
      control: {
        type: 'boolean',
      },
    },
    font: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, 'monospace'],
      },
    },
    shadow: {
      defaultValue: false,
      control: {
        type: 'radio',
        options: [
          false,
          true,
          '0 1x 3x #shadow',
          '0 1x 3x #purple',
          '0 1x 3x #purple.50',
        ],
      },
    },
    border: {
      defaultValue: false,
      control: {
        type: 'radio',
        options: [false, '1bw', '1bw #danger'],
      },
    },
    radius: {
      defaultValue: false,
      control: {
        type: 'radio',
        options: [false, '0', '1r', 'round'],
      },
    },
    padding: {
      defaultValue: false,
      control: {
        type: 'radio',
        options: [false, '1x', '2x', '1x top'],
      },
    },
  },
};

const Template = ({ label, ...args }) => (
  <Paragraph {...args}>{label}</Paragraph>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Paragraph content',
};
