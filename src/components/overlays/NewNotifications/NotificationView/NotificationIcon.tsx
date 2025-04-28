import { memo, ReactNode } from 'react';

import { DangerIcon, ExclamationIcon } from '../../../../icons';
import { wrapIcon } from '../../../../icons/wrap-icon';
import { tasty } from '../../../../tasty';

import { NotificationIconProps } from './types';

export const SuccessIcon = wrapIcon(
  'SuccessIcon',
  <svg
    fill="currentColor"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m13.67 5.88-5.8 5.8a1.1 1.1 0 0 1-1.55 0l-3-3a1.1 1.1 0 0 1 1.56-1.55l2.21 2.21 5.03-5.02a1.1 1.1 0 0 1 1.55 1.56Z" />
  </svg>,
);

const IconContainer = tasty({
  styles: {
    boxSizing: 'border-box',
    display: 'flex',
    alignSelf: 'start',
    gridArea: 'icon',
    minHeight: '3x',
    placeContent: 'center',
  },
});

const IconPreset = tasty({
  styles: {
    boxSizing: 'border-box',
    display: 'flex',
    fill: {
      '': '#note-bg',
      attention: '#note-bg',
      success: '#success-bg',
      danger: '#danger-bg',
    },
    color: {
      '': '#note-text',
      attention: '#note-text',
      success: '#success-text',
      danger: '#danger-text',
    },
    radius: '1r',
    width: '3x',
    height: '3x',
    padding: '0.5x',
    alignItems: 'center',
    justifyContent: 'center',
    '& svg': {
      width: '100%',
      height: '100%',
    },
  },
});

/**
 * @internal This component is unstable and must not be used outside of `NotificationView`.
 */
export const NotificationIcon = memo(function NotificationIcon(
  props: NotificationIconProps,
) {
  const { icon, type } = props;

  return (
    <IconContainer>
      {icon ? (
        icon
      ) : (
        <IconPreset
          mods={{
            attention: type === 'attention',
            success: type === 'success',
            danger: type === 'danger',
          }}
        >
          {iconsByType[type]}
        </IconPreset>
      )}
    </IconContainer>
  );
});

const iconsByType: Record<NotificationIconProps['type'], ReactNode> = {
  attention: <ExclamationIcon />,
  success: <SuccessIcon />,
  danger: <DangerIcon />,
};
