import { TopBar } from './TopBar';
import { Button } from '../../../index';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Organisms/TopBar',
  component: TopBar,
  parameters: {
    controls: {
      exclude: baseProps,
    },
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
