import { Block } from '../components/Block';

export default {
  title: 'Generic/Block',
  component: Block,
  argTypes: {
    shadow: {
      defaultValue: true,
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
    radius: {
      defaultValue: '1r',
      control: {
        type: 'radio',
        options: ['0', '1r', 'round'],
      },
    },
    border: {
      defaultValue: true,
      control: {
        type: 'radio',
        options: [false, true, '#purple'],
      },
    },
    padding: {
      defaultValue: '2x',
      control: {
        type: 'radio',
        options: [false, '1x', '2x', '1x top'],
      },
    },
  },
};

const Template = ({ label, ...args }) => <Block {...args}>{label}</Block>;

export const Default = Template.bind({});
Default.args = {
  label: 'Block content',
  shadow: true,
  radius: '1r',
  padding: '2x',
  border: true,
};
