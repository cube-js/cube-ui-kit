import { memo, ReactNode } from 'react';

import { tasty } from '../../../../tasty';
import { Danger, Success, Attention } from '../../../../icons';

import { NotificationIconProps } from './types';

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

/**
 * @internal This component is unstable and must not be used outside of `NotificationView`.
 */
export const NotificationIcon = memo(function NotificationIcon(
  props: NotificationIconProps,
): JSX.Element {
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
  attention: <Attention />,
  success: <Success />,
  danger: <Danger />,
};
