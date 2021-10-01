import { ActiveZone } from './ActiveZone';

export default {
  title: 'UIKit/Content/ActiveZone',
  component: ActiveZone,
  argTypes: {
    isDisabled: {
      defaultValue: false,
      description: 'Disables the button.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    label: {
      defaultValue: 'ActiveZone',
      control: 'text',
    },
  },
};

const Template = ({
  isDisabled,
  label,
}) => (
  <ActiveZone
    isDisabled={isDisabled}
  >
    {label}
  </ActiveZone>
);

export const Default = Template.bind({});
Default.args = {
  label: 'ActiveZone',
};
