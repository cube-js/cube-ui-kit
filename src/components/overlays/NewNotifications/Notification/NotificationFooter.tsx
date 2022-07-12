import React, { memo } from 'react';
import { isElement } from 'react-is';
import flatten from 'react-keyed-flatten-children';
import { CubeNotificationProps, NotificationActionComponent } from '../types';
import { tasty } from '../../../../tasty';
import { ButtonGroup } from '../../../actions';

interface NotificationFooterProps {
  actions: CubeNotificationProps['actions'];
  onClose: () => void;
  onDismiss: () => void;
}

const FooterArea = tasty(ButtonGroup, {
  gridArea: 'footer',
  gap: '2x',
  styles: { '&:not(:empty)': { margin: '1x top' } },
});

export const NotificationFooter = memo(function NotificationFooter(
  props: NotificationFooterProps,
): JSX.Element {
  const { actions, onClose, onDismiss } = props;

  return (
    <FooterArea>
      {flatten(
        typeof actions === 'function'
          ? actions({ onClose, onDismiss })
          : actions,
      )
        .filter((action) => isElement(action))
        .map((action, index) => {
          const { props } = action as NotificationActionComponent;
          const defaultType = index === 0 ? 'primary' : 'secondary';

          return React.cloneElement(
            action as NotificationActionComponent,
            {
              ...props,
              type: props.type ?? defaultType,
            },
            props.children,
          );
        })}
    </FooterArea>
  );
});
