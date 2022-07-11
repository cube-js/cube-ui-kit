import { VisuallyHidden } from '@react-aria/visually-hidden';
import { CubeDialogProps, Dialog, DialogTrigger } from '../../Dialog';
import { tasty } from '../../../../tasty';
import { Flex } from '../../../layout/Flex';
import { Title } from '../../../content/Title';
import { ClearSlots } from '../../../../utils/react';
import { CubeNotifyApiProps } from '../types';

export function NotificationsDialogTrigger(props) {
  return <DialogTrigger {...props} type="popover" />;
}

const StyledDialog = tasty(Dialog, {
  height: 'auto calc(100vh - 12x)',
});

const StyledDialogContent = tasty(Flex, {
  styles: {
    flow: 'column',
    placeItems: 'start start',
    styledScrollbar: true,
    height: '100%',
    border: '1bw solid #border',
    radius: '0.5x',
    overflow: 'auto',
  },
});

export type NotificationsDialogProps = {
  onCloseNotificationInBar?: (props: CubeNotifyApiProps) => void;
} & CubeDialogProps;

export function NotificationsDialog(props: NotificationsDialogProps) {
  const { children, ...dialogProps } = props;

  return (
    <StyledDialog {...dialogProps}>
      <VisuallyHidden>
        <Title>Notifications</Title>
      </VisuallyHidden>

      <StyledDialogContent>
        <ClearSlots>{children}</ClearSlots>
      </StyledDialogContent>
    </StyledDialog>
  );
}
