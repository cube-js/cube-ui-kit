import { Result } from './Result';
import { Button } from '../../actions/Button/Button';
import { Space } from '../../layout/Space';

export default {
  title: 'UIKit/Organisms/Result',
  component: Result,
};

const Template = ({ children, ...props }) => {
  return (
    <Result {...props}>{children}</Result>
  );
};

export const Success = Template.bind({});
Success.args = {
  status: 'success',
  title: 'Successfully Purchased Cloud Server ECS!',
  subTitle:
    'Order number: 2017182818828182881 Cloud server configuration takes 1-5 minutes, please wait.',
  children: (
    <Space>
      <Button type="primary">Go Console</Button>
      <Button type="default">Buy Again</Button>
    </Space>
  ),
};

export const Info = Template.bind({});
Info.args = {
  status: 'info',
  title: 'Your operation has been executed',
  children: (
    <Button type="primary">Go Console</Button>
  ),
};

export const Warning = Template.bind({});
Warning.args = {
  status: 'warning',
  title: 'There are some problems with your operation',
  children: (
    <Button type="primary">Go Console</Button>
  ),
};

export const Error = Template.bind({});
Error.args = {
  status: 'error',
  title: 'Submission Failed',
  subTitle:
    'Please check and modify the following information before resubmitting.',
  children: (
    <Space>
      <Button type="primary">Go Console</Button>
      <Button type="default">Buy Again</Button>
    </Space>
  ),
};
