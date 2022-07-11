import { CubeDialogProps, Dialog, DialogTrigger } from '../../Dialog';
import { tasty } from '../../../../tasty';
import { Flex } from '../../../layout/Flex';

export function NotificationsDialogTrigger(props) {
  return <DialogTrigger {...props} type="popover" />;
}

const StyledDialog = tasty(Dialog, {
  height: 'auto calc(100vh - 12x)',
});

const StyledDialogContent = tasty(Flex, {
  styledScrollbar: true,
  height: '100%',
  border: '1bw solid #border',
  radius: '0.5x',
  overflow: 'auto',
});

export function NotificationsDialog(props: CubeDialogProps) {
  const { children, ...dialogProps } = props;

  return (
    <StyledDialog {...dialogProps}>
      <StyledDialogContent>{children}</StyledDialogContent>
    </StyledDialog>
  );
}
