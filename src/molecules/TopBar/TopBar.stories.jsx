import { TopBar } from './TopBar';
import { Button } from '../../index';

export default {
  title: 'UIKit/Molecules/TopBar',
  component: TopBar,
  argTypes: {
    // size: {
    //   defaultValue: 4,
    //   control: {
    //     type: 'inline-radio',
    //     options: [2, 3, 4],
    //   }
    // },
  },
};

const Template = ({ leftContent, rightContent, border, ...args }) => (
  <TopBar {...args} border={border ? 'bottom' : false}>
    {leftContent ? (
      <Button>Left button</Button>
    ) : rightContent ? (
      <div></div>
    ) : (
      ''
    )}
    {rightContent ? <Button>Right button</Button> : ''}
  </TopBar>
);

export const Default = Template.bind({});
Default.args = {
  leftContent: false,
  rightContent: false,
  border: false,
};

export const WithContent = Template.bind({});
WithContent.args = {
  leftContent: true,
  rightContent: true,
};

export const WithBorder = Template.bind({});
WithBorder.args = {
  border: true,
};
