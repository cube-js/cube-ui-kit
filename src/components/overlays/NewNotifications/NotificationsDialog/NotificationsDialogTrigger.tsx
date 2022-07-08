import { tasty } from '../../../../tasty';
import { CubeDialogProps, Dialog, DialogTrigger } from '../../Dialog';

export function NotificationsDialogTrigger(props) {
  return <DialogTrigger {...props} type="popover" />;
}

const StyledDialogContent = tasty(Dialog, {
  styledScrollbar: true,
  height: '100%',
  border: '1bw solid #border',
  radius: '0.5x',
  overflow: 'auto',
});

const StyledDialog = tasty(Dialog, {
  height: 'auto calc(100vh - 12x)',
});

export function NotificationsDialog(props: CubeDialogProps) {
  const { children, ...dialogProps } = props;

  return (
    <StyledDialog {...dialogProps}>
      <StyledDialogContent>{children}</StyledDialogContent>
    </StyledDialog>
  );
}
