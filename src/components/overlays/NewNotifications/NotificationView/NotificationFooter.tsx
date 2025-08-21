import React, { isValidElement, memo } from 'react';
import flatten from 'react-keyed-flatten-children';

import { tasty } from '../../../../tasty';
import { ButtonGroup } from '../../../actions';
import { CubeNotificationProps, NotificationActionComponent } from '../types';

interface NotificationFooterProps {
  hasDescription: boolean;
  actions: CubeNotificationProps['actions'];
  onClose: () => void;
  onDismiss: () => void;
}

const FooterArea = tasty(ButtonGroup, {
  styles: {
    gridArea: 'footer',
    gap: '1x 2x',
    flow: 'row wrap',
    '&:not(:empty)': {
      margin: { '': '0.5x top', 'has-description': '1x top' },
    },
  },
});

/**
 * @internal This component is unstable and must not be used outside of `NotificationView`.
 */
export const NotificationFooter = memo(function NotificationFooter(
  props: NotificationFooterProps,
) {
  const { actions, onClose, onDismiss, hasDescription } = props;

  return (
    <FooterArea mods={{ 'has-description': hasDescription }}>
      {flatten(
        typeof actions === 'function'
          ? actions({ onClose, onDismiss })
          : actions,
      )
        .filter((action) => isValidElement(action))
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
