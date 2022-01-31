import { Result } from './Result';
import { Button } from '../../actions/Button/Button';

export default {
  title: 'UIKit/Organisms/Result',
  component: Result,
};

const Template = (args) => <Result {...args} />

export const Success = Template.bind({});
Success.args = {
  status: 'success',
  title: 'Successfully Purchased Cloud Server ECS!',
  description: 'Order number: 2017182818828182881 Cloud server configuration takes 1-5 minutes, please wait.',
  extra: [
    <Button type="primary">Go Console</Button>,
    <Button type="default">Buy Again</Button>,
  ],
};

export const Info = Template.bind({});
Info.args = {
  status: 'info',
  title: 'Your operation has been executed',
  extra: (
    <Button type="primary">Go Console</Button>
  ),
};

export const Warning = Template.bind({});
Warning.args = {
  status: 'warning',
  title: 'There are some problems with your operation',
  extra: (
    <Button type="primary">Go Console</Button>
  ),
};

export const Error = Template.bind({});
Error.args = {
  status: 'error',
  title: 'Submission Failed',
  description: 'Please check and modify the following information before resubmitting.',
  extra: [
    <Button type="primary">Go Console</Button>,
    <Button type="default">Buy Again</Button>,
  ],
};
