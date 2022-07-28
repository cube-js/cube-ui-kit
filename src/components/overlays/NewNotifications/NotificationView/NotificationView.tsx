import { ForwardedRef, forwardRef } from 'react';
import { useHover } from '@react-aria/interactions';
import { useFocusRing } from '@react-aria/focus';
import { mergeProps, useId } from '@react-aria/utils';
import { tasty } from '../../../../tasty';
import { useEvent, useTimer } from '../../../../_internal';
import { ClearSlots } from '../../../../utils/react';
import { NotificationIcon } from './NotificationIcon';
import { NotificationHeader } from './NotificationHeader';
import { NotificationDescription } from './NotificationDescription';
import { NotificationFooter } from './NotificationFooter';
import { NotificationCloseButton } from './NotificationCloseButton';
import type { NotificationProps } from './types';
import { NotificationProvider } from './NotificationProvider';

const NotificationContainer = tasty({
  styles: {
    boxSizing: 'border-box',
    position: 'relative',
    display: 'grid',
    width: '100%',
    padding: '1.5x 1x 1.5x 1.5x',
    radius: '0.5x',
    gridAreas: `
      "icon . header"
      "icon . description"
      ".    . footer"
    `,
    gridColumns: 'min-content 1x minmax(0, auto)',
    gridRows: 'minmax(0, auto) minmax(0, auto) minmax(0, auto)',
    fill: '#white',
    boxShadow: {
      '': '0 0 0 4bw #purple-04.0 inset',
      focused: '0 0 0 4bw #purple-04 inset',
    },
  },
});

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
          styles={styles}
          ref={ref}
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
            <NotificationCloseButton
              onPress={onDismissEvent}
              isHovered={isHovered}
              isFocused={isFocusVisible}
            />
          )}
        </NotificationContainer>
      </NotificationProvider>
    </ClearSlots>
  );
});
