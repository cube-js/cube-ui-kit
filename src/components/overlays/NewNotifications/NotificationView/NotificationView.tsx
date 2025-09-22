import { ForwardedRef, forwardRef } from 'react';
import { useFocusRing, useHover } from 'react-aria';

import { useEvent, useTimer } from '../../../../_internal';
import { tasty } from '../../../../tasty';
import { ClearSlots, mergeProps } from '../../../../utils/react';
import { useId } from '../../../../utils/react/useId';
import { useNotificationsDialogContext } from '../Dialog/NotificationsDialogContext';

import { NotificationCloseButton } from './NotificationCloseButton';
import { NotificationDescription } from './NotificationDescription';
import { NotificationFooter } from './NotificationFooter';
import { NotificationHeader } from './NotificationHeader';
import { NotificationIcon } from './NotificationIcon';
import { NotificationProvider } from './NotificationProvider';

import type { NotificationProps } from './types';

const NotificationContainer = tasty({
  styles: {
    boxSizing: 'border-box',
    position: 'relative',
    display: 'grid',
    width: '100%',
    padding: '0.5x 0.5x 1.5x 1.5x',
    gridAreas: `
      ".    . .           .      close"
      "icon . header      .      close"
      "icon . description .      close"
      ".    . footer      footer footer"
    `,
    gridColumns: 'min-content 1x minmax(0, auto) 1x minmax(0, min-content)',
    gridRows: '1x minmax(0, auto) minmax(0, auto) minmax(0, auto)',
    fill: '#white',
    radius: '1cr',
    boxShadow: {
      '': '0 0 0 4bw #purple-04.0 inset',
      focused: '0 0 0 4bw #purple-04 inset',
    },
    outline: 0,
    border: {
      '': '#border',
      '[data-type="success"]': '#success.4',
      '[data-type="danger"]': '#danger.4',
      '[data-type="attention"]': '#border',
      // Clear border when inside dialog
      'inside-dialog': '#clear',
    },
  },
});

/**
 * @internal This component is unstable and is a subject to change.
 */
export const NotificationView = forwardRef(function NotificationView(
  props: NotificationProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    onClose,
    actions,
    header,
    icon,
    description,
    id,
    styles,
    type = 'attention',
    isDismissible = true,
    duration = null,
    attributes = {},
    qa = 'notification',
    timer: propsTimer,
    onDismiss,
  } = props;

  const labelID = useId();
  const descriptionID = useId();

  // Detect if we're inside a NotificationsDialog specifically
  const insideNotificationsDialog = useNotificationsDialogContext();

  const onCloseEvent = useEvent(() => {
    onClose?.();
  });

  const onDismissEvent = useEvent(() => {
    if (isDismissible) {
      onDismiss?.();
    }
  });

  const { hoverProps, isHovered } = useHover({});
  const { isFocusVisible, focusProps } = useFocusRing({ within: true });

  useTimer({
    timer: propsTimer,
    delay: duration,
    callback: onDismissEvent,
    isDisabled: isFocusVisible || isHovered || !isDismissible,
  });

  return (
    <ClearSlots>
      <NotificationProvider onClose={onClose}>
        <NotificationContainer
          {...mergeProps(attributes, hoverProps, focusProps)}
          ref={ref}
          styles={styles}
          data-id={id}
          data-qa={qa}
          data-type={type}
          aria-labelledby={labelID}
          aria-describedby={descriptionID}
          mods={{
            focused: isFocusVisible,
            'is-dismissible': isDismissible,
            'inside-dialog': insideNotificationsDialog,
          }}
        >
          <NotificationIcon icon={icon} type={type} />

          <NotificationHeader header={header} id={labelID} />

          {description && (
            <NotificationDescription
              description={description}
              id={descriptionID}
            />
          )}

          <NotificationFooter
            hasDescription={!!description}
            actions={actions}
            onClose={onCloseEvent}
            onDismiss={onDismissEvent}
          />

          {isDismissible && (
            <NotificationCloseButton onPress={onDismissEvent} />
          )}
        </NotificationContainer>
      </NotificationProvider>
    </ClearSlots>
  );
});
