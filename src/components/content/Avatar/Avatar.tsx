import { forwardRef, ReactNode } from 'react';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Element,
  extractStyles,
  filterBaseProps,
  Styles,
} from '../../../tasty';

const DEFAULT_STYLES = {
  display: 'grid',
  gap: '1x',
  flow: 'row',
  fill: '#purple',
  color: '#white',
  radius: 'round',
  placeContent: 'center',
  width: '@avatar-size @avatar-size @avatar-size',
  height: '@avatar-size @avatar-size @avatar-size',
  fontSize: 'calc(@avatar-size / 2)',
  lineHeight: 'calc(@avatar-size / 2)',
  fontWeight: 500,
};

export interface CubeAvatarProps extends BaseProps, ContainerStyleProps {
  icon?: ReactNode;
  size?: Styles['size'];
}

export const Avatar = forwardRef(
  ({ size = '4x', icon, children, ...props }: CubeAvatarProps, ref) => {
    const styles = extractStyles(props, CONTAINER_STYLES, {
      ...DEFAULT_STYLES,
      '--avatar-size': size,
    });

    return (
      <Element
        {...filterBaseProps(props, { eventProps: true })}
        styles={styles}
        ref={ref}
        data-theme="special"
      >
        {icon}
        {children}
      </Element>
    );
  },
);
