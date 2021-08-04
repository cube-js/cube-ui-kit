import { forwardRef } from 'react';
import THEMES from '../../data/themes';
import { Base } from '../../components/Base';
import { CONTAINER_STYLES } from '../../styles/list';
import { extractStyles } from '../../utils/styles';
import { filterBaseProps } from '../../utils/filterBaseProps';
import { BaseProps, ContainerStyleProps } from '../../components/types';
import { NuStyles } from '../../styles/types';

const DEFAULT_STYLES: NuStyles = {
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

export interface BadgeProps extends BaseProps, ContainerStyleProps {
  type?: keyof typeof THEMES;
}

export const Badge = forwardRef((allProps: BadgeProps, ref) => {
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
