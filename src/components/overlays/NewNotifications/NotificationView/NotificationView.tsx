import { ForwardedRef, forwardRef } from 'react';
import { useHover } from '@react-aria/interactions';
import { useFocusRing } from '@react-aria/focus';

import { tasty } from '../../../../tasty';
import { useEvent, useTimer } from '../../../../_internal';
import { ClearSlots, mergeProps } from '../../../../utils/react';
import { useId } from '../../../../utils/react/useId';

import { NotificationIcon } from './NotificationIcon';
import { NotificationHeader } from './NotificationHeader';
import { NotificationDescription } from './NotificationDescription';
import { NotificationFooter } from './NotificationFooter';
import { NotificationCloseButton } from './NotificationCloseButton';
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
    boxShadow: {
      '': '0 0 0 4bw #purple-04.0 inset',
      focused: '0 0 0 4bw #purple-04 inset',
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
          aria-labelledby={labelID}
          aria-describedby={descriptionID}
          mods={{ focused: isFocusVisible, 'is-dismissible': isDismissible }}
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
