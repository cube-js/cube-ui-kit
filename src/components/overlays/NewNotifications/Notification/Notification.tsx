import { ForwardedRef, forwardRef, KeyboardEventHandler, useMemo } from 'react';
import { useHover } from '@react-aria/interactions';
import { useFocusRing } from '@react-aria/focus';
import { mergeProps, useId } from '@react-aria/utils';
import { tasty } from '../../../../tasty';
import { useEvent } from '../../../../_internal';
import { Timer } from '../timer';
import { NotificationIcon } from './NotificationIcon';
import { NotificationHeader } from './NotificationHeader';
import { NotificationDescription } from './NotificationDescription';
import { NotificationFooter } from './NotificationFooter';
import { NotificationCloseButton } from './NotificationCloseButton';
import type { NotificationProps } from './types';

const NotificationContainer = tasty({
  styles: {
    position: 'relative',
    display: 'grid',
    width: 'auto',
    padding: '1.5x 1x 1.5x 1.5x',
    gridAreas: `
      "icon . header"
      "icon . description"
      "icon . footer"
    `,
    gridColumns: 'min-content 1x minmax(0, auto)',
    fill: '#white',
    boxShadow: {
      '': '0 0 0 2bw #purple-04.0 inset',
      focused: '0 0 0 2bw #purple-04 inset',
    },
  },
});

export const Notification = forwardRef(function Notification(
  props: NotificationProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    onClose,
    type = 'attention',
    actions,
    header,
    icon,
    isClosable = true,
    description,
    duration = 5_000,
    id,
    attributes = {},
  } = props;

  const labelID = useId();
  const descriptionID = useId();

  const onCloseEvent = useEvent(() => {
    if (isClosable) {
      onClose?.();
    }
  });

  const onKeyDown = useEvent<KeyboardEventHandler<HTMLElement>>((event) => {
    const closeKeys = ['Delete', 'Backspace', 'Escape'];

    if (closeKeys.includes(event.key)) {
      onCloseEvent();
    }
  });

  const timer = useMemo(() => {
    if (duration === null) {
      return null;
    }

    return new Timer(onCloseEvent, duration);
  }, []);

  const { hoverProps, isHovered } = useHover({
    onHoverStart: timer?.reset,
    onHoverEnd: timer?.resume,
  });

  const { isFocusVisible, focusProps } = useFocusRing({ within: true });

  return (
    <NotificationContainer
      {...mergeProps(attributes, hoverProps, focusProps, { onKeyDown })}
      ref={ref}
      data-id={id}
      data-qa="notification"
      aria-labelledby={labelID}
      aria-describedby={descriptionID}
      mods={{ focused: isFocusVisible }}
    >
      <NotificationIcon icon={icon} type={type} />
      {header && <NotificationHeader header={header} id={labelID} />}
      {description && (
        <NotificationDescription description={description} id={descriptionID} />
      )}
      {actions && <NotificationFooter actions={actions} />}
      {isClosable && (
        <NotificationCloseButton
          onPress={onCloseEvent}
          isHovered={isHovered}
          isFocused={isFocusVisible}
        />
      )}
    </NotificationContainer>
  );
});
