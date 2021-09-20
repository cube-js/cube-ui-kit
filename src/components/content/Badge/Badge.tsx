import { forwardRef } from 'react';
import THEMES from '../../../data/themes';
import { Base } from '../../Base';
import { CONTAINER_STYLES } from '../../../styles/list';
import { extractStyles } from '../../../utils/styles';
import { filterBaseProps } from '../../../utils/filterBaseProps';
import { BaseProps, ContainerStyleProps } from '../../types';
import { Styles } from '../../../styles/types';

const DEFAULT_STYLES: Styles = {
  display: 'inline-flex',
  placeContent: 'center',
  placeItems: 'center',
  radius: 'round',
  size: '12px 12px',
  width: 'min 16px',
  height: '16px',
  textAlign: 'center',
  fontWeight: 600,
  color: '#white',
} as const;

export interface CubeBadgeProps extends BaseProps, ContainerStyleProps {
  type?: keyof typeof THEMES;
}

export const Badge = forwardRef((allProps: CubeBadgeProps, ref) => {
  let { type, children, ...props } = allProps;

  const styles = extractStyles(props, CONTAINER_STYLES, {
    ...DEFAULT_STYLES,
    padding:
      typeof children === 'string'
        ? children.length > 2
          ? '0 2px'
          : children.length > 1
          ? '0 1px'
          : 0
        : 0,
    fill: type && THEMES[type] ? THEMES[type].color : '#purple',
  });

  return (
    <Base
      role="region"
      {...filterBaseProps(props, { eventProps: true })}
      styles={styles}
      ref={ref}
    >
      {children}
    </Base>
  );
});
