import React, { memo } from 'react';
import { CubeNotificationProps } from '../types';
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
      {React.Children.map(
        typeof actions === 'function'
          ? actions({ onClose, onDismiss })
          : actions,
        (action, index) => {
          if (action != null) {
            const { props } = action;

            return React.cloneElement(
              action,
              {
                ...props,
                type: props.type ?? index === 0 ? 'primary' : 'secondary',
              },
              props.children,
            );
          }

          return action;
        },
      )}
    </FooterArea>
  );
});
