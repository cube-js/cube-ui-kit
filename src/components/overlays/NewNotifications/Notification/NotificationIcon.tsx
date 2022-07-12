import { memo, ReactNode } from 'react';
import { NotificationIconProps } from './types';
import { tasty } from '../../../../tasty';
import { Danger, Success, Attention } from '../../../../icons';

const IconContainer = tasty({
  styles: {
    boxSizing: 'border-box',
    display: 'flex',
    gridArea: 'icon',
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
    borderRadius: '0.5x',
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

export const NotificationIcon = memo(function NotificationIcon(
  props: NotificationIconProps,
): JSX.Element {
  const { icon, type } = props;

  if (icon) {
    return <>{icon}</>;
  }

  return (
    <IconContainer
      mods={{
        attention: type === 'attention',
        success: type === 'success',
        danger: type === 'danger',
      }}
    >
      {iconsByType[type]}
    </IconContainer>
  );
});

const iconsByType: Record<NotificationIconProps['type'], ReactNode> = {
  attention: <Attention />,
  success: <Success />,
  danger: <Danger />,
};
