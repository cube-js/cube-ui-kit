import { forwardRef, ReactNode } from 'react';
import { Base } from '../../Base';
import { CONTAINER_STYLES } from '../../../styles/list';
import { extractStyles } from '../../../utils/styles';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import { BaseProps, ContainerStyleProps } from '../../types';
import { Styles } from '../../../styles/types';

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
      <Base
        {...filterBaseProps(props, { eventProps: true })}
        styles={styles}
        ref={ref}
        data-theme="special"
      >
        {icon}
        {children}
      </Base>
    );
  },
);
