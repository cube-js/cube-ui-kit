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

const NotificationContainer = tasty({
  styles: {
    boxSizing: 'border-box',
    position: 'relative',
    display: 'grid',
    width: '100%',
    padding: '1.5x 1x 1.5x 1.5x',
    gridAreas: `
      "icon . header"
      "icon . description"
      "icon . footer"
    `,
    gridColumns: 'min-content 1x minmax(0, auto)',
    fill: '#white',
    boxShadow: {
      '': '0 0 0 4bw #purple-04.0 inset',
      focused: '0 0 0 4bw #purple-04 inset',
    },
  },
});

export const Notification = forwardRef(function Notification(
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
    isClosable = true,
    duration = null,
    attributes = {},
    qa = 'notification',
    timer: propsTimer,
  } = props;

  const labelID = useId();
  const descriptionID = useId();

  const onCloseEvent = useEvent(() => {
    if (isClosable) {
      onClose?.();
    }
  });

  const { isFocusVisible, focusProps, isFocused } = useFocusRing({
    within: true,
  });

  const { hoverProps, isHovered } = useHover({});

  useTimer({
    timer: propsTimer,
    delay: duration,
    callback: onCloseEvent,
    isDisabled: isFocused || isHovered,
  });

  return (
    <ClearSlots>
      <NotificationContainer
        {...mergeProps(attributes, hoverProps, focusProps)}
        styles={styles}
        ref={ref}
        data-id={id}
        data-qa={qa}
        aria-labelledby={labelID}
        aria-describedby={descriptionID}
        mods={{ focused: isFocusVisible }}
      >
        <NotificationIcon icon={icon} type={type} />
        {header && <NotificationHeader header={header} id={labelID} />}
        {description && (
          <NotificationDescription
            description={description}
            id={descriptionID}
          />
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
    </ClearSlots>
  );
});
