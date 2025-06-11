import { ReactNode } from 'react';
import { VisuallyHidden } from 'react-aria';

import { tasty } from '../../../../tasty';
import { ClearSlots } from '../../../../utils/react';
import { Title } from '../../../content/Title';
import { Flex } from '../../../layout/Flex';
import {
  CubeDialogProps,
  CubeDialogTriggerProps,
  Dialog,
  DialogTrigger,
} from '../../Dialog';
import { useNotificationsObserver } from '../hooks';
import { CubeNotifyApiPropsWithID } from '../types';

export type NotificationsDialogTriggerProps = Omit<
  CubeDialogTriggerProps,
  'type'
> & {
  onCloseNotificationInBar?: (props: CubeNotifyApiPropsWithID) => void;
};

export function NotificationsDialogTrigger(
  props: NotificationsDialogTriggerProps,
) {
  const { onCloseNotificationInBar, ...dialogTriggerProps } = props;

  useNotificationsObserver((args) => onCloseNotificationInBar?.(args));

  return <DialogTrigger {...dialogTriggerProps} type="popover" />;
}

const StyledDialog = tasty(Dialog, { height: 'auto calc(100vh - 12x)' });

const StyledDialogContent = tasty(Flex, {
  styles: {
    flow: 'column',
    placeItems: 'start start',
    scrollbar: 'styled',
    height: '100%',
    radius: '0.5x',
    overflow: 'auto',
  },
});

export type NotificationsDialogProps = { title?: ReactNode } & CubeDialogProps;

export function NotificationsDialog(props: NotificationsDialogProps) {
  const { children, title = 'Notifications', ...dialogProps } = props;

  return (
    <StyledDialog {...dialogProps}>
      <VisuallyHidden>
        <Title>{title}</Title>
      </VisuallyHidden>

      <StyledDialogContent>
        <ClearSlots>{children}</ClearSlots>
      </StyledDialogContent>
    </StyledDialog>
  );
}
